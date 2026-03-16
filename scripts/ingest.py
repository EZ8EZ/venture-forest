"""
Venture Forest: Data Ingestion Pipeline

Reads raw company data from data/raw/, normalizes it,
and outputs to data/normalized/.

Usage:
    python scripts/ingest.py

For v1, this is a placeholder. The app runs on pre-built
snapshot data without requiring the Python pipeline.
"""

import json
import os
import sys

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
RAW_DIR = os.path.join(DATA_DIR, 'raw')
NORMALIZED_DIR = os.path.join(DATA_DIR, 'normalized')


def main():
    os.makedirs(NORMALIZED_DIR, exist_ok=True)

    raw_files = [f for f in os.listdir(RAW_DIR) if f.endswith('.json') or f.endswith('.csv')]

    if not raw_files:
        print('No raw data files found in data/raw/.')
        print('Place CSV or JSON files there and run again.')
        sys.exit(0)

    print(f'Found {len(raw_files)} raw file(s). Processing...')

    for filename in raw_files:
        filepath = os.path.join(RAW_DIR, filename)
        print(f'  Processing: {filename}')

        if filename.endswith('.json'):
            with open(filepath, 'r') as f:
                data = json.load(f)
            # Normalize and write
            out_path = os.path.join(NORMALIZED_DIR, filename)
            with open(out_path, 'w') as f:
                json.dump(data, f, indent=2)
            print(f'  -> {out_path}')

    print('Done.')


if __name__ == '__main__':
    main()
