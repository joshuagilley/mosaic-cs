"""API routes for Vektor linear algebra application"""

from typing import Any

import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .linear_algebra import (
    compute_determinant,
    compute_eigen,
    compute_pca,
    generate_grid,
    transform_points,
)

router = APIRouter(prefix="/api/data-science/vektor", tags=["vektor"])


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


@router.post("/transform")
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


@router.post("/eigen")
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


@router.post("/determinant")
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


@router.post("/pca")
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
