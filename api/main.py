from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np

# Handle imports for both local development (from api/) and Docker (from /app)
try:
    from linear_algebra import (
        compute_determinant,
        compute_eigen,
        compute_pca,
        generate_grid,
        transform_points,
    )
except ImportError:
    from api.linear_algebra import (
        compute_determinant,
        compute_eigen,
        compute_pca,
        generate_grid,
        transform_points,
    )

app = FastAPI(title="Mosaic API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class MatrixRequest(BaseModel):
    matrix: list[list[float]]


class TransformRequest(BaseModel):
    matrix: list[list[float]]
    points: list[list[float]] | None = None
    grid_size: int | None = 10
    grid_range: float | None = 5.0


class PCARequest(BaseModel):
    data: list[list[float]]


@app.get("/")
async def root():
    return {"message": "Hello from FastAPI!"}


@app.get("/hello")
async def hello():
    return {"message": "Hello World from FastAPI! Mosaic is ready to go."}


@app.post("/api/transform")
async def transform(request: TransformRequest):
    """
    Transform points using a matrix
    """
    matrix = np.array(request.matrix)

    # Validate matrix shape
    if matrix.shape != (2, 2):
        raise HTTPException(
            status_code=422,
            detail=f"Matrix must be 2x2, got shape {matrix.shape}",
        )

    if request.points is None:
        # Generate default grid
        grid_points = generate_grid(request.grid_size, request.grid_range)
    else:
        grid_points = np.array(request.points)

    transformed = transform_points(grid_points, matrix)

    return {
        "original": grid_points.tolist(),
        "transformed": transformed.tolist(),
        "matrix": matrix.tolist(),
    }


@app.post("/api/eigen")
async def eigen(request: MatrixRequest):
    """
    Compute eigenvalues and eigenvectors
    """
    matrix = np.array(request.matrix)

    # Validate matrix shape
    if matrix.shape != (2, 2):
        raise HTTPException(
            status_code=422,
            detail=f"Matrix must be 2x2, got shape {matrix.shape}",
        )

    eigenvalues, eigenvectors = compute_eigen(matrix)

    # Convert complex numbers to JSON-serializable format
    def convert_complex(obj):
        """Convert complex numbers to [real, imaginary] format"""
        if isinstance(obj, (complex, np.complex128, np.complex64)):
            return [float(obj.real), float(obj.imag)]
        elif isinstance(obj, np.ndarray):
            return [convert_complex(x) for x in obj]
        elif isinstance(obj, (list, tuple)):
            return [convert_complex(x) for x in obj]
        else:
            return float(obj) if isinstance(obj, (np.floating, np.integer)) else obj

    eigenvalues_list = convert_complex(eigenvalues)
    eigenvectors_list = convert_complex(eigenvectors)

    return {
        "eigenvalues": eigenvalues_list,
        "eigenvectors": eigenvectors_list,
    }


@app.post("/api/determinant")
async def determinant(request: MatrixRequest):
    """
    Compute determinant of matrix
    """
    matrix = np.array(request.matrix)

    # Validate matrix shape
    if matrix.shape != (2, 2):
        raise HTTPException(
            status_code=422,
            detail=f"Matrix must be 2x2, got shape {matrix.shape}",
        )

    det = compute_determinant(matrix)

    return {
        "determinant": float(det),
    }


@app.post("/api/pca")
async def pca(request: PCARequest):
    """
    Perform PCA on 2D data
    """
    data = np.array(request.data)
    result = compute_pca(data)

    return {
        "original_data": data.tolist(),
        "principal_components": result["principal_components"].tolist(),
        "explained_variance": result["explained_variance"].tolist(),
        "projected_data": result["projected_data"].tolist(),
        "mean": result["mean"].tolist(),
    }
