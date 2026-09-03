import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .config import BACKEND_PORT, BACKEND_HOST, GMI_MODEL
from .api.routes_batch import router as batch_router
from .api.routes_agent import router as agent_router
from .api.routes_webhook import router as webhook_router
from .api.routes_audit import router as audit_router

app = FastAPI(
    title="RazorRevive - Autonomous AI Revenue Recovery Engine",
    description="Razorpay Buildathon 2026: Multi-channel recovery with measured financial outcomes, compliant escalation, and immutable audit trails.",
    version="1.0.0"
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(batch_router)
app.include_router(agent_router)
app.include_router(webhook_router)
app.include_router(audit_router)

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "RazorRevive AI",
        "version": "1.0.0",
        "llm_model": GMI_MODEL,
        "track": "AI Revenue Recovery (Razorpay Buildathon 2026)"
    }

# Serve static frontend dist if it exists
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = FRONTEND_DIST / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=BACKEND_HOST, port=BACKEND_PORT, reload=True)
