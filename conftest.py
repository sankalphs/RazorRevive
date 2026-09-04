"""
Pytest bootstrap: make `backend.*` importable regardless of how pytest
is invoked (`python -m pytest`, bare `pytest`, IDE runners).

pytest inserts each rootdir containing a conftest.py into sys.path only
under `rootdir`-relative import modes; the explicit insert below keeps
the repo-root-first imports working in every runner.
"""
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))
