from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import sub-app routers
# Handle imports for both local development (from api/) and Docker (from /app)
try:
    from data_science.vektor.routes import router as vektor_router
except ImportError:
    # This branch is for Docker when running from /app
    # Mypy config handles import-not-found, but we need to ignore no-redef
    from api.data_science.vektor.routes import router as vektor_router  # type: ignore[no-redef]

app = FastAPI(title="Mosaic API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint"""
    return {"message": "Hello from FastAPI!"}


@app.get("/hello")
async def hello() -> dict[str, str]:
    """Hello endpoint"""
    return {"message": "Hello World from FastAPI! Mosaic is ready to go."}


# Include sub-app routers
app.include_router(vektor_router)
