import fs from 'node:fs';
import zlib from 'node:zlib';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function readChunk(buf, offset) {
  const len = buf.readUInt32BE(offset);
  const type = buf.toString('ascii', offset + 4, offset + 8);
  const data = buf.subarray(offset + 8, offset + 8 + len);
  const crc = buf.readUInt32BE(offset + 8 + len);
  return { len, type, data, crc, next: offset + 12 + len };
}

function writeChunk(type, data) {
  const chunk = Buffer.allocUnsafe(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  chunk.write(type, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = zlib.crc32 ? zlib.crc32(chunk.subarray(4, 8 + data.length)) : 0;
  chunk.writeUInt32BE(crc, 8 + data.length);
  return chunk;
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function unfilterRow(filter, row, prevRow, bytesPerPixel) {
  const out = Buffer.alloc(row.length);
  for (let i = 0; i < row.length; i += 1) {
    const raw = row[i];
    const a = i >= bytesPerPixel ? out[i - bytesPerPixel] : 0;
    const b = prevRow ? prevRow[i] : 0;
    const c = prevRow && i >= bytesPerPixel ? prevRow[i - bytesPerPixel] : 0;
    let v;
    switch (filter) {
      case 0: v = raw; break;
      case 1: v = raw + a; break;
      case 2: v = raw + b; break;
      case 3: v = raw + Math.floor((a + b) / 2); break;
      case 4: v = raw + paeth(a, b, c); break;
      default: v = raw; break;
    }
    out[i] = v & 0xff;
  }
  return out;
}

function filterRow(row, prevRow, bytesPerPixel) {
  // Use filter 0 (None) for simplicity; it is well compressed by Deflate.
  const out = Buffer.alloc(1 + row.length);
  out[0] = 0;
  row.copy(out, 1);
  return out;
}

function parsePng(path) {
  const buf = fs.readFileSync(path);
  if (!buf.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('Not a PNG file');
  }
  const ihdr = readChunk(buf, 8);
  if (ihdr.type !== 'IHDR' || ihdr.len !== 13) {
    throw new Error('Missing or invalid IHDR');
  }
  const width = ihdr.data.readUInt32BE(0);
  const height = ihdr.data.readUInt32BE(4);
  const bitDepth = ihdr.data[8];
  const colorType = ihdr.data[9];
  const compression = ihdr.data[10];
  const filterMethod = ihdr.data[11];
  const interlace = ihdr.data[12];

  if (bitDepth !== 8) throw new Error(`Unsupported bit depth: ${bitDepth}`);
  if (compression !== 0 || filterMethod !== 0) throw new Error('Unsupported PNG method');
  if (interlace !== 0) throw new Error('Interlaced PNG not supported');

  let offset = ihdr.next;
  const idatBuffers = [];
  while (offset < buf.length) {
    const chunk = readChunk(buf, offset);
    if (chunk.type === 'IDAT') idatBuffers.push(chunk.data);
    if (chunk.type === 'IEND') break;
    offset = chunk.next;
  }
  const compressed = Buffer.concat(idatBuffers);
  const decompressed = zlib.inflateSync(compressed);

  let bytesPerPixel;
  let channels;
  if (colorType === 0) bytesPerPixel = 1; // Grayscale
  else if (colorType === 2) bytesPerPixel = 3; // RGB
  else if (colorType === 4) bytesPerPixel = 2; // Grayscale + alpha
  else if (colorType === 6) bytesPerPixel = 4; // RGBA
  else throw new Error(`Unsupported color type: ${colorType}`);
  channels = bytesPerPixel;

  const stride = width * bytesPerPixel;
  const rows = [];
  let pos = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = decompressed[pos];
    pos += 1;
    const rowData = decompressed.subarray(pos, pos + stride);
    pos += stride;
    const prevRow = y > 0 ? rows[y - 1] : null;
    const unfiltered = unfilterRow(filter, rowData, prevRow, bytesPerPixel);
    rows.push(unfiltered);
  }

  return { width, height, colorType, channels, rows };
}

function makeRgba(rows, width, height, colorType) {
  const rgbaRows = [];
  for (let y = 0; y < height; y += 1) {
    const src = rows[y];
    const dst = Buffer.alloc(width * 4);
    for (let x = 0; x < width; x += 1) {
      let r, g, b, a;
      const i = x * 4;
      const j = x * 4; // destination always 4 bytes
      if (colorType === 0) { // Gray
        r = g = b = src[x];
        a = 255;
      } else if (colorType === 2) { // RGB
        r = src[x * 3];
        g = src[x * 3 + 1];
        b = src[x * 3 + 2];
        a = 255;
      } else if (colorType === 4) { // Gray + alpha
        r = g = b = src[x * 2];
        a = src[x * 2 + 1];
      } else if (colorType === 6) { // RGBA
        r = src[x * 4];
        g = src[x * 4 + 1];
        b = src[x * 4 + 2];
        a = src[x * 4 + 3];
      }
      // Make the checkerboard background transparent.
      if (r > 190 && g > 190 && b > 190) {
        a = 0;
      }
      dst[i] = r;
      dst[i + 1] = g;
      dst[i + 2] = b;
      dst[i + 3] = a;
    }
    rgbaRows.push(dst);
  }
  return rgbaRows;
}

function buildPng(width, height, rgbaRows) {
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter method
  ihdrData[12] = 0; // interlace

  const filtered = [];
  let prevRow = null;
  for (const row of rgbaRows) {
    filtered.push(filterRow(row, prevRow, 4));
    prevRow = row;
  }
  const raw = Buffer.concat(filtered);
  const idatData = zlib.deflateSync(raw, { level: 9 });

  const parts = [
    PNG_SIGNATURE,
    writeChunk('IHDR', ihdrData),
    writeChunk('IDAT', idatData),
    writeChunk('IEND', Buffer.alloc(0)),
  ];
  return Buffer.concat(parts);
}

function main() {
  const input = process.argv[2] || 'public/assets/world/wanderlust/base/layers/55_forest.png';
  const output = process.argv[3] || input;
  const { width, height, colorType, rows } = parsePng(input);
  console.log(`Loaded ${input}: ${width}x${height}, colorType=${colorType}`);
  const rgbaRows = makeRgba(rows, width, height, colorType);
  const png = buildPng(width, height, rgbaRows);
  fs.writeFileSync(output, png);
  console.log(`Wrote transparent PNG to ${output}`);
}

main();
