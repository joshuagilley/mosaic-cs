from typing import Any

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Handle imports for both local development (from api/) and Docker (from /app)
# When running from api/, use direct import; when running from /app, use api. prefix
try:
    from linear_algebra import (
        compute_determinant,
        compute_eigen,
        compute_pca,
        generate_grid,
        transform_points,
    )
except ImportError:
    # This branch is for Docker when running from /app
    # Mypy will complain but it's fine - we add type ignore
    from api.linear_algebra import (  # type: ignore[import-not-found,no-redef]
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
    """Request model for matrix operations"""

    matrix: list[list[float]]

    class Config:
        """Pydantic config"""

        json_schema_extra = {
            "example": {
                "matrix": [[1.0, 0.0], [0.0, 1.0]],
            }
        }


class TransformRequest(BaseModel):
    """Request model for matrix transformations"""

    matrix: list[list[float]]
    points: list[list[float]] | None = None
    grid_size: int | None = 10
    grid_range: float | None = 5.0

    class Config:
        """Pydantic config"""

        json_schema_extra = {
            "example": {
                "matrix": [[1.0, 0.0], [0.0, 1.0]],
                "grid_size": 10,
                "grid_range": 5.0,
            }
        }


class PCARequest(BaseModel):
    """Request model for PCA computation"""

    data: list[list[float]]

    class Config:
        """Pydantic config"""

        json_schema_extra = {
            "example": {
                "data": [[1.0, 1.0], [2.0, 2.0], [3.0, 3.0]],
            }
        }


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint"""
    return {"message": "Hello from FastAPI!"}


@app.get("/hello")
async def hello() -> dict[str, str]:
    """Hello endpoint"""
    return {"message": "Hello World from FastAPI! Mosaic is ready to go."}


@app.post("/api/transform")
async def transform(request: TransformRequest) -> dict[str, list[list[float]]]:
    """
    Transform points using a matrix

    Args:
        request: TransformRequest with matrix and optional points

    Returns:
        Dictionary with original points, transformed points, and matrix
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
        grid_size: int = request.grid_size if request.grid_size is not None else 10
        grid_range: float = request.grid_range if request.grid_range is not None else 5.0
        grid_points = generate_grid(grid_size, grid_range)
    else:
        grid_points = np.array(request.points)

    transformed = transform_points(grid_points, matrix)

    return {
        "original": grid_points.tolist(),
        "transformed": transformed.tolist(),
        "matrix": matrix.tolist(),
    }


@app.post("/api/eigen")
async def eigen(request: MatrixRequest) -> dict[str, list[Any]]:
    """
    Compute eigenvalues and eigenvectors

    Args:
        request: MatrixRequest with 2x2 matrix

    Returns:
        Dictionary with eigenvalues and eigenvectors
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
    def convert_complex(obj: Any) -> Any:
        """Convert complex numbers to [real, imaginary] format"""
        if isinstance(obj, (complex, np.complex128, np.complex64)):  # noqa: UP038
            return [float(obj.real), float(obj.imag)]
        elif isinstance(obj, np.ndarray):
            return [convert_complex(x) for x in obj]
        elif isinstance(obj, (list, tuple)):  # noqa: UP038
            return [convert_complex(x) for x in obj]
        else:
            return float(obj) if isinstance(obj, (np.floating, np.integer)) else obj  # noqa: UP038

    eigenvalues_list: list[Any] = convert_complex(eigenvalues)
    eigenvectors_list: list[Any] = convert_complex(eigenvectors)

    return {
        "eigenvalues": eigenvalues_list,
        "eigenvectors": eigenvectors_list,
    }


@app.post("/api/determinant")
async def determinant(request: MatrixRequest) -> dict[str, float]:
    """
    Compute determinant of matrix

    Args:
        request: MatrixRequest with 2x2 matrix

    Returns:
        Dictionary with determinant value
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
async def pca(request: PCARequest) -> dict[str, list[list[float]] | list[float]]:
    """
    Perform PCA on 2D data

    Args:
        request: PCARequest with 2D data points

    Returns:
        Dictionary with PCA results
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
