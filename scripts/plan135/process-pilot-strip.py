#!/usr/bin/env python3
"""Process one raw Gemini output: colour transfer -> validation -> ingest if green."""
import argparse
import json
import subprocess
import sys
from pathlib import Path

from pilotlib import PILOT_DIR, rel, sha256_file

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]


def run(cmd):
    proc = subprocess.run(cmd, cwd=ROOT, text=True, capture_output=True)
    return proc


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--crop', required=True)
    ap.add_argument('--raw', required=True)
    ap.add_argument('--attempt', type=int, default=1)
    args = ap.parse_args()
    corrected = PILOT_DIR / 'corrected' / f'{args.crop}-attempt{args.attempt}.png'
    transfer_report = PILOT_DIR / 'corrected' / f'{args.crop}-attempt{args.attempt}.json'
    validation = PILOT_DIR / 'validations' / f'{args.crop}-attempt{args.attempt}.json'
    for p in (corrected.parent, validation.parent):
        p.mkdir(parents=True, exist_ok=True)
    cmd = [sys.executable, str(HERE / 'color-transfer-pilot-strip.py'), '--crop', args.crop, '--input', args.raw, '--output', str(corrected), '--report', str(transfer_report)]
    proc = run(cmd)
    print(proc.stdout.strip())
    if proc.returncode != 0:
        print(proc.stderr, file=sys.stderr)
        raise SystemExit(proc.returncode)
    cmd = [sys.executable, str(HERE / 'ingest-pilot-strip.py'), '--crop', args.crop, '--image', str(corrected), '--validation', str(validation)]
    proc = run(cmd)
    print(proc.stdout.strip())
    if proc.returncode != 0:
        print(proc.stderr, file=sys.stderr)
        raise SystemExit(proc.returncode)
    print(json.dumps({'status': 'INGESTED', 'crop': args.crop, 'validatedImage': rel(corrected), 'sha256': sha256_file(corrected)}))


if __name__ == '__main__':
    main()
