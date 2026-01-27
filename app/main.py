"""FastAPI application entry point."""
import json
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.rules.engine import RuleEngine
from app.api.routes import companies, financial_items, zakat, rules, lookups, excel_upload


def _log_request(request: Request):
    """Log incoming request for debugging."""
    try:
        log_entry = {
            "location": "main.py:middleware",
            "message": "Incoming request",
            "data": {
                "method": request.method,
                "path": request.url.path,
                "query_params": str(request.query_params),
            },
            "timestamp": int(time.time() * 1000),
            "sessionId": "debug-session",
            "runId": "run1",
            "hypothesisId": "H5"
        }
        with open(r"c:\Users\user\OneDrive\Desktop\Zakat App\.cursor\debug.log", "a", encoding="utf-8") as f:
            f.write(json.dumps(log_entry) + "\n")
    except Exception:
        pass


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all incoming requests."""
    async def dispatch(self, request: Request, call_next):
        _log_request(request)
        response = await call_next(request)
        return response


# Global rule engine instance
rule_engine: RuleEngine | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown."""
    global rule_engine
    
    # Startup: Load and validate rules
    try:
        rule_engine = RuleEngine()
        rule_engine.load_rules(settings.rules_path)
        app.state.rule_engine = rule_engine
    except (FileNotFoundError, ValueError) as e:
        # Fail fast if rules cannot be loaded or validated
        raise RuntimeError(
            f"Failed to load or validate zakat rules: {e}\n"
            "Please ensure zakat_rules_full_v1.json exists and contains all required Arabic fields (reason_ar)."
        ) from e
    
    yield
    
    # Shutdown: cleanup if needed
    rule_engine = None


app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    lifespan=lifespan,
)

# Request logging middleware (for debugging)
app.add_middleware(RequestLoggingMiddleware)

# CORS middleware (for future frontend integration)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(companies.router, prefix="/companies", tags=["companies"])
app.include_router(financial_items.router, prefix="/financial-items", tags=["financial-items"])
app.include_router(zakat.router, prefix="/zakat", tags=["zakat"])
app.include_router(excel_upload.router, prefix="/zakat", tags=["zakat"])
app.include_router(rules.router, prefix="/rules", tags=["rules"])
app.include_router(lookups.router, prefix="/lookups", tags=["lookups"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Corporate Zakat Calculation API",
        "version": settings.api_version,
        "direction": "rtl",  # RTL readiness hint
        "language": "ar",  # Arabic-first API
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}
