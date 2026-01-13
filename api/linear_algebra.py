"""
Core linear algebra operations using NumPy
"""

from typing import TypedDict

import numpy as np
from numpy.typing import NDArray


def transform_points(
    points: NDArray[np.float64], matrix: NDArray[np.float64]
) -> NDArray[np.float64]:
    """
    Apply matrix transformation to points

    Args:
        points: Array of shape (n, 2) representing 2D points
        matrix: 2x2 transformation matrix

    Returns:
        Transformed points
    """
    # Ensure matrix is 2x2
    if matrix.shape != (2, 2):
        raise ValueError("Matrix must be 2x2")

    # Apply transformation: points @ matrix.T
    return points @ matrix.T


def compute_eigen(
    matrix: NDArray[np.float64],
) -> tuple[NDArray[np.complex128], NDArray[np.complex128]]:
    """
    Compute eigenvalues and eigenvectors

    Args:
        matrix: 2x2 matrix

    Returns:
        Tuple of (eigenvalues, eigenvectors)
    """
    if matrix.shape != (2, 2):
        raise ValueError("Matrix must be 2x2")

    eig_result = np.linalg.eig(matrix)
    eigenvalues: NDArray[np.complex128] = eig_result[0].astype(np.complex128)
    eigenvectors: NDArray[np.complex128] = eig_result[1].astype(np.complex128)

    # Normalize eigenvectors
    for i in range(eigenvectors.shape[1]):
        eigenvectors[:, i] = eigenvectors[:, i] / np.linalg.norm(eigenvectors[:, i])

    return eigenvalues, eigenvectors


def compute_determinant(matrix: NDArray[np.float64]) -> float:
    """
    Compute determinant of matrix

    Args:
        matrix: 2x2 matrix

    Returns:
        Determinant value
    """
    if matrix.shape != (2, 2):
        raise ValueError("Matrix must be 2x2")

    return float(np.linalg.det(matrix))


def generate_grid(size: int = 10, range_val: float = 5.0) -> NDArray[np.float64]:
    """
    Generate a grid of points for visualization

    Args:
        size: Number of grid points in each direction
        range_val: Range of grid (-range_val to range_val)

    Returns:
        Array of shape (n, 2) with grid points organized for drawing
    """
    # Generate grid coordinates
    x = np.linspace(-range_val, range_val, size)
    y = np.linspace(-range_val, range_val, size)

    points = []

    # Create grid points: first all horizontal line points, then vertical
    # Horizontal lines (varying x, fixed y)
    for yi in y:
        for xi in x:
            points.append([xi, yi])

    # Vertical lines (fixed x, varying y) - appended after horizontal
    for xi in x:
        for yi in y:
            points.append([xi, yi])

    return np.array(points)


class PCAResult(TypedDict):
    """Type definition for PCA results"""

    principal_components: NDArray[np.float64]
    explained_variance: NDArray[np.float64]
    projected_data: NDArray[np.float64]
    mean: NDArray[np.float64]


def compute_pca(data: NDArray[np.float64]) -> PCAResult:
    """
    Perform Principal Component Analysis on 2D data

    Args:
        data: Array of shape (n, 2) representing 2D data points

    Returns:
        Dictionary with PCA results:
        - principal_components: The principal axes (eigenvectors)
        - explained_variance: Variance explained by each component
        - projected_data: Data projected onto principal components
        - mean: Mean of the data
    """
    if data.shape[1] != 2:
        raise ValueError("Data must be 2D (n, 2)")

    # Center the data
    mean = np.mean(data, axis=0)
    centered_data = data - mean

    # Compute covariance matrix
    cov_matrix = np.cov(centered_data.T)

    # Compute eigenvalues and eigenvectors
    eigenvalues, eigenvectors = np.linalg.eig(cov_matrix)

    # Sort by eigenvalue (descending)
    idx = eigenvalues.argsort()[::-1]
    eigenvalues = eigenvalues[idx]
    eigenvectors = eigenvectors[:, idx]

    # Normalize eigenvectors
    for i in range(eigenvectors.shape[1]):
        eigenvectors[:, i] = eigenvectors[:, i] / np.linalg.norm(eigenvectors[:, i])

    # Project data onto principal components
    projected_data = centered_data @ eigenvectors

    # Explained variance
    explained_variance = eigenvalues / np.sum(eigenvalues)

    return {
        "principal_components": eigenvectors,
        "explained_variance": explained_variance,
        "projected_data": projected_data,
        "mean": mean,
    }


def create_rotation_matrix(angle: float) -> NDArray[np.float64]:
    """
    Create a 2D rotation matrix

    Args:
        angle: Rotation angle in radians

    Returns:
        2x2 rotation matrix
    """
    cos_a = np.cos(angle)
    sin_a = np.sin(angle)
    return np.array([[cos_a, -sin_a], [sin_a, cos_a]])


def create_scale_matrix(sx: float, sy: float) -> NDArray[np.float64]:
    """
    Create a 2D scaling matrix

    Args:
        sx: Scale factor in x direction
        sy: Scale factor in y direction

    Returns:
        2x2 scaling matrix
    """
    return np.array([[sx, 0], [0, sy]])


def create_reflection_matrix(axis: str = "x") -> NDArray[np.float64]:
    """
    Create a 2D reflection matrix

    Args:
        axis: "x" or "y" to reflect across that axis

    Returns:
        2x2 reflection matrix
    """
    if axis == "x":
        return np.array([[1, 0], [0, -1]])
    elif axis == "y":
        return np.array([[-1, 0], [0, 1]])
    else:
        raise ValueError("Axis must be 'x' or 'y'")


def create_shear_matrix(kx: float, ky: float) -> NDArray[np.float64]:
    """
    Create a 2D shearing matrix

    Args:
        kx: Shear factor in x direction
        ky: Shear factor in y direction

    Returns:
        2x2 shearing matrix
    """
    return np.array([[1, kx], [ky, 1]])
