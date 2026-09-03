"""
RazorRevive — Single-command boot script.
Starts the FastAPI backend (port 8000) and the Vite frontend dev server (port 5173).

Usage:
    python run.py            # boot backend + frontend (dev mode)
    python run.py --backend  # backend only (serves built frontend from frontend/dist if present)
"""
import os
import subprocess
import sys
import time
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND_PORT = os.getenv("BACKEND_PORT", "8000")
FRONTEND_PORT = "5173"

processes = []


def check_backend_deps() -> bool:
    try:
        import fastapi  # noqa: F401
        import uvicorn  # noqa: F401
        import httpx  # noqa: F401
        return True
    except ImportError:
        return False


def start_backend() -> subprocess.Popen:
    print(f"[RazorRevive] Starting FastAPI backend on http://127.0.0.1:{BACKEND_PORT} ...")
    backend_cmd = [
        sys.executable, "-m", "uvicorn",
        "backend.app.main:app", "--host", "0.0.0.0", "--port", BACKEND_PORT
    ]
    return subprocess.Popen(backend_cmd, cwd=ROOT)


def start_frontend() -> subprocess.Popen:
    print(f"[RazorRevive] Starting Vite frontend dev server on http://localhost:{FRONTEND_PORT} ...")
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    return subprocess.Popen([npm_cmd, "run", "dev"], cwd=ROOT / "frontend")


def main():
    backend_only = "--backend" in sys.argv

    if not check_backend_deps():
        print("[RazorRevive] Missing backend dependencies. Installing from requirements.txt ...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", str(ROOT / "requirements.txt")])

    try:
        backend = start_backend()
        processes.append(backend)
    except Exception as e:
        print(f"[RazorRevive] Failed to start backend: {e}")
        sys.exit(1)

    if not backend_only:
        frontend_dir = ROOT / "frontend"
        if not (frontend_dir / "node_modules").exists():
            print("[RazorRevive] Installing frontend dependencies (first run) ...")
            npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
            subprocess.check_call([npm_cmd, "install"], cwd=frontend_dir)
        try:
            frontend = start_frontend()
            processes.append(frontend)
        except Exception as e:
            print(f"[RazorRevive] Failed to start frontend: {e}")
            print(f"[RazorRevive] Backend still available at http://127.0.0.1:{BACKEND_PORT}")

    time.sleep(3)
    url = f"http://localhost:{FRONTEND_PORT}" if not backend_only else f"http://127.0.0.1:{BACKEND_PORT}"
    print(f"\n{'=' * 60}")
    print(f"  RazorRevive is live:  {url}")
    print(f"  Backend API docs:     http://127.0.0.1:{BACKEND_PORT}/docs")
    print(f"{'=' * 60}\n")
    try:
        webbrowser.open(url)
    except Exception:
        pass

    try:
        while True:
            time.sleep(1)
            for p in processes:
                if p.poll() is not None:
                    print("[RazorRevive] A child process exited. Shutting down.")
                    raise KeyboardInterrupt
    except KeyboardInterrupt:
        print("\n[RazorRevive] Shutting down (Ctrl+C) ...")
        for p in processes:
            p.terminate()
        for p in processes:
            try:
                p.wait(timeout=5)
            except subprocess.TimeoutExpired:
                p.kill()
        print("[RazorRevive] Stopped cleanly.")


if __name__ == "__main__":
    main()
