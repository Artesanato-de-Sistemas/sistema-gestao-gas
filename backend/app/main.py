from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import api_router

# ─── FastAPI Application ──────────────────────────────────────────────────────

app = FastAPI(
    title="Império do Gás — API",
    description=(
        "Backend de gestão para distribuidora de gás. "
        "Gerencia estoque, entradas (inbounds), vendas, clientes e colaboradores."
    ),
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
# Allows the React frontend running on localhost:5173 to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Global Exception Handler ─────────────────────────────────────────────────
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Erro interno do servidor: {str(exc)}"},
    )

# ─── Routes ───────────────────────────────────────────────────────────────────
app.include_router(api_router, prefix="/api")


@app.get("/", tags=["Health"])
def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "Imperio do Gas API",
        "version": "2.0.0 (Python/FastAPI)",
    }
