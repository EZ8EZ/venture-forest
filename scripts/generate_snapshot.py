"""
Venture Forest: Snapshot Generator

Reads normalized data from data/normalized/ and generates
a complete forest snapshot at data/snapshots/latest.json.

The snapshot includes pre-computed tree placements, grove
assignments, and visual parameters.

Usage:
    python scripts/generate_snapshot.py

For v1, the app ships with a pre-built demo snapshot in
apps/web/public/data/demo-snapshot.json.
"""

import json
import math
import os
import sys

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
NORMALIZED_DIR = os.path.join(DATA_DIR, 'normalized')
SNAPSHOTS_DIR = os.path.join(DATA_DIR, 'snapshots')


def main():
    os.makedirs(SNAPSHOTS_DIR, exist_ok=True)

    print('Snapshot generator placeholder.')
    print('For v1, use the demo snapshot at apps/web/public/data/demo-snapshot.json.')
    print('A full pipeline will be implemented in Phase B.')


if __name__ == '__main__':
    main()
