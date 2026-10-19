"""Compatibility entrypoint; the CAD engine is text-to-cad."""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts.text_to_cad_smoke import main

if __name__ == '__main__':
    raise SystemExit(main())
