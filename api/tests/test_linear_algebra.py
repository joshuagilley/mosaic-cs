"""
Unit tests for linear algebra operations
"""

import numpy as np
import pytest
from data_science.vektor.linear_algebra import (
    compute_determinant,
    compute_eigen,
    compute_pca,
    create_reflection_matrix,
    create_rotation_matrix,
    create_scale_matrix,
    create_shear_matrix,
    generate_grid,
    transform_points,
)


class TestTransformPoints:
    """Tests for point transformation"""

    def test_identity_matrix(self):
        """Identity matrix should not transform points"""
        points = np.array([[1, 0], [0, 1], [2, 3]])
        matrix = np.array([[1, 0], [0, 1]])
        result = transform_points(points, matrix)
        np.testing.assert_array_almost_equal(result, points)

    def test_rotation_90_degrees(self):
        """90 degree rotation should map (1,0) to (0,1)"""
        points = np.array([[1, 0]])
        matrix = np.array([[0, -1], [1, 0]])  # 90 degree rotation
        result = transform_points(points, matrix)
        expected = np.array([[0, 1]])
        np.testing.assert_array_almost_equal(result, expected)

    def test_scaling(self):
        """Scaling matrix should multiply coordinates"""
        points = np.array([[1, 2], [3, 4]])
        matrix = np.array([[2, 0], [0, 3]])  # Scale x by 2, y by 3
        result = transform_points(points, matrix)
        expected = np.array([[2, 6], [6, 12]])
        np.testing.assert_array_almost_equal(result, expected)

    def test_invalid_matrix_shape(self):
        """Should raise error for non-2x2 matrix"""
        points = np.array([[1, 0]])
        matrix = np.array([[1, 0, 0], [0, 1, 0], [0, 0, 1]])  # 3x3 matrix
        with pytest.raises(ValueError, match="Matrix must be 2x2"):
            transform_points(points, matrix)


class TestComputeEigen:
    """Tests for eigenvalue/eigenvector computation"""

    def test_identity_matrix_eigenvalues(self):
        """Identity matrix has eigenvalues of 1"""
        matrix = np.array([[1, 0], [0, 1]])
        eigenvalues, eigenvectors = compute_eigen(matrix)
        np.testing.assert_array_almost_equal(eigenvalues, [1.0, 1.0])

    def test_diagonal_matrix_eigenvalues(self):
        """Diagonal matrix eigenvalues are the diagonal elements"""
        matrix = np.array([[2, 0], [0, 3]])
        eigenvalues, eigenvectors = compute_eigen(matrix)
        # Eigenvalues should be 2 and 3 (order may vary)
        assert set(np.round(eigenvalues.real, 5)) == {2.0, 3.0}

    def test_eigenvectors_normalized(self):
        """Eigenvectors should be normalized"""
        matrix = np.array([[2, 0], [0, 3]])
        eigenvalues, eigenvectors = compute_eigen(matrix)
        for i in range(eigenvectors.shape[1]):
            norm = np.linalg.norm(eigenvectors[:, i])
            assert abs(norm - 1.0) < 1e-10

    def test_invalid_matrix_shape(self):
        """Should raise error for non-2x2 matrix"""
        matrix = np.array([[1, 0, 0], [0, 1, 0], [0, 0, 1]])
        with pytest.raises(ValueError, match="Matrix must be 2x2"):
            compute_eigen(matrix)


class TestComputeDeterminant:
    """Tests for determinant computation"""

    def test_identity_determinant(self):
        """Identity matrix has determinant of 1"""
        matrix = np.array([[1, 0], [0, 1]])
        det = compute_determinant(matrix)
        assert det == 1.0

    def test_diagonal_determinant(self):
        """Determinant of diagonal matrix is product of diagonal"""
        matrix = np.array([[2, 0], [0, 3]])
        det = compute_determinant(matrix)
        assert det == 6.0

    def test_general_matrix_determinant(self):
        """Test determinant of general 2x2 matrix"""
        matrix = np.array([[1, 2], [3, 4]])
        det = compute_determinant(matrix)
        assert abs(det - (-2.0)) < 1e-10  # ad - bc = 1*4 - 2*3 = -2

    def test_zero_determinant(self):
        """Matrix with zero determinant"""
        matrix = np.array([[1, 2], [2, 4]])  # Second row is 2x first row
        det = compute_determinant(matrix)
        assert abs(det) < 1e-10

    def test_invalid_matrix_shape(self):
        """Should raise error for non-2x2 matrix"""
        matrix = np.array([[1, 0, 0], [0, 1, 0], [0, 0, 1]])
        with pytest.raises(ValueError, match="Matrix must be 2x2"):
            compute_determinant(matrix)


class TestGenerateGrid:
    """Tests for grid generation"""

    def test_grid_size(self):
        """Grid should have correct number of points"""
        grid = generate_grid(size=10, range_val=5.0)
        # Should have 2 * size * size points (horizontal + vertical lines)
        assert grid.shape[0] == 2 * 10 * 10

    def test_grid_range(self):
        """Grid should be within specified range"""
        grid = generate_grid(size=5, range_val=2.0)
        assert np.all(grid >= -2.0)
        assert np.all(grid <= 2.0)

    def test_grid_structure(self):
        """Grid should have correct shape"""
        grid = generate_grid(size=5, range_val=1.0)
        assert grid.shape[1] == 2  # 2D points
        assert grid.shape[0] == 50  # 2 * 5 * 5


class TestComputePCA:
    """Tests for PCA computation"""

    def test_pca_2d_data(self):
        """PCA should work on 2D data"""
        # Create simple 2D data
        data = np.array([[1, 1], [2, 2], [3, 3], [4, 4]])
        result = compute_pca(data)
        assert "principal_components" in result
        assert "explained_variance" in result
        assert "projected_data" in result
        assert "mean" in result

    def test_pca_principal_components_shape(self):
        """Principal components should be 2x2 for 2D data"""
        data = np.random.randn(10, 2)
        result = compute_pca(data)
        assert result["principal_components"].shape == (2, 2)

    def test_pca_explained_variance_sum(self):
        """Explained variance should sum to 1"""
        data = np.random.randn(20, 2)
        result = compute_pca(data)
        variance_sum = np.sum(result["explained_variance"])
        assert abs(variance_sum - 1.0) < 1e-10

    def test_pca_invalid_data_shape(self):
        """Should raise error for non-2D data"""
        data = np.random.randn(10, 3)  # 3D data
        with pytest.raises(ValueError, match="Data must be 2D"):
            compute_pca(data)


class TestMatrixCreation:
    """Tests for matrix creation helpers"""

    def test_rotation_matrix(self):
        """Rotation matrix should rotate points"""
        angle = np.pi / 2  # 90 degrees
        matrix = create_rotation_matrix(angle)
        # Rotate (1, 0) by 90 degrees should give (0, 1)
        point = np.array([[1, 0]])
        result = transform_points(point, matrix)
        expected = np.array([[0, 1]])
        np.testing.assert_array_almost_equal(result, expected, decimal=5)

    def test_scale_matrix(self):
        """Scale matrix should scale coordinates"""
        matrix = create_scale_matrix(2, 3)
        points = np.array([[1, 1]])
        result = transform_points(points, matrix)
        expected = np.array([[2, 3]])
        np.testing.assert_array_almost_equal(result, expected)

    def test_reflection_x(self):
        """Reflection across x-axis should flip y coordinate"""
        matrix = create_reflection_matrix("x")
        points = np.array([[1, 1]])
        result = transform_points(points, matrix)
        expected = np.array([[1, -1]])
        np.testing.assert_array_almost_equal(result, expected)

    def test_reflection_y(self):
        """Reflection across y-axis should flip x coordinate"""
        matrix = create_reflection_matrix("y")
        points = np.array([[1, 1]])
        result = transform_points(points, matrix)
        expected = np.array([[-1, 1]])
        np.testing.assert_array_almost_equal(result, expected)

    def test_reflection_invalid_axis(self):
        """Should raise error for invalid axis"""
        with pytest.raises(ValueError, match="Axis must be 'x' or 'y'"):
            create_reflection_matrix("z")

    def test_shear_matrix(self):
        """Shear matrix should shear coordinates"""
        matrix = create_shear_matrix(0.5, 0)
        points = np.array([[0, 1]])  # Point on y-axis will be sheared in x
        result = transform_points(points, matrix)
        expected = np.array([[0.5, 1]])  # x gets sheared by kx * y
        np.testing.assert_array_almost_equal(result, expected)


class TestEdgeCases:
    """Tests for edge cases and error handling"""

    def test_empty_points(self):
        """Should handle empty point array"""
        points = np.array([]).reshape(0, 2)
        matrix = np.array([[1, 0], [0, 1]])
        result = transform_points(points, matrix)
        assert result.shape == (0, 2)

    def test_single_point(self):
        """Should handle single point"""
        points = np.array([[1, 1]])
        matrix = np.array([[2, 0], [0, 2]])
        result = transform_points(points, matrix)
        expected = np.array([[2, 2]])
        np.testing.assert_array_almost_equal(result, expected)

    def test_large_matrix_values(self):
        """Should handle large matrix values"""
        matrix = np.array([[100, 0], [0, 100]])
        points = np.array([[1, 1]])
        result = transform_points(points, matrix)
        expected = np.array([[100, 100]])
        np.testing.assert_array_almost_equal(result, expected)
