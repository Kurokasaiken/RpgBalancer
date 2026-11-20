import { chromium } from 'playwright';
for (const args of [[], ['--use-angle=metal'], ['--use-gl=angle', '--use-angle=metal'], ['--enable-gpu'], ['--ignore-gpu-blocklist', '--enable-gpu-rasterization']]) {
  const browser = await chromium.launch({ args });
  const page = await browser.newPage();
  const info = await page.evaluate(() => {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return 'NO-WEBGL';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  });
  console.log(JSON.stringify(args), '->', info);
  await browser.close();
}
