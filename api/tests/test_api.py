"""
Tests for FastAPI endpoints
"""

from fastapi.testclient import TestClient

from main import app

# TestClient takes app as positional argument
client = TestClient(app)


class TestHealthEndpoint:
    """Tests for health check endpoint"""

    def test_root_endpoint(self):
        """Root endpoint should return message"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data

    def test_hello_endpoint(self):
        """Hello endpoint should return message"""
        response = client.get("/hello")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data


class TestTransformEndpoint:
    """Tests for transform endpoint"""

    def test_transform_with_default_grid(self):
        """Transform should work with default grid"""
        response = client.post(
            "/api/data-science/vektor/transform",
            json={
                "matrix": [[1, 0], [0, 1]],
                "grid_size": 5,
                "grid_range": 2.0,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "original" in data
        assert "transformed" in data
        assert "matrix" in data
        assert len(data["original"]) > 0
        assert len(data["transformed"]) > 0

    def test_transform_with_custom_points(self):
        """Transform should work with custom points"""
        response = client.post(
            "/api/data-science/vektor/transform",
            json={
                "matrix": [[2, 0], [0, 2]],
                "points": [[1, 1], [2, 2]],
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["transformed"] == [[2, 2], [4, 4]]

    def test_transform_rotation(self):
        """Transform should handle rotation"""
        response = client.post(
            "/api/data-science/vektor/transform",
            json={
                "matrix": [[0, -1], [1, 0]],  # 90 degree rotation
                "points": [[1, 0]],
            },
        )
        assert response.status_code == 200
        data = response.json()
        # (1, 0) rotated 90 degrees should be approximately (0, 1)
        result = data["transformed"][0]
        assert abs(result[0]) < 0.01
        assert abs(result[1] - 1) < 0.01


class TestEigenEndpoint:
    """Tests for eigen endpoint"""

    def test_eigen_identity(self):
        """Identity matrix should have eigenvalues of 1"""
        response = client.post(
            "/api/data-science/vektor/eigen",
            json={"matrix": [[1, 0], [0, 1]]},
        )
        assert response.status_code == 200
        data = response.json()
        assert "eigenvalues" in data
        assert "eigenvectors" in data
        # Eigenvalues should be [1, 1] (may be complex format)
        eigenvalues = data["eigenvalues"]
        assert len(eigenvalues) == 2

    def test_eigen_diagonal(self):
        """Diagonal matrix eigenvalues"""
        response = client.post(
            "/api/data-science/vektor/eigen",
            json={"matrix": [[2, 0], [0, 3]]},
        )
        assert response.status_code == 200
        data = response.json()
        eigenvalues = data["eigenvalues"]
        # Should handle complex numbers in [real, imag] format
        assert len(eigenvalues) == 2


class TestDeterminantEndpoint:
    """Tests for determinant endpoint"""

    def test_determinant_identity(self):
        """Identity matrix determinant should be 1"""
        response = client.post(
            "/api/data-science/vektor/determinant",
            json={"matrix": [[1, 0], [0, 1]]},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["determinant"] == 1.0

    def test_determinant_general(self):
        """General matrix determinant"""
        response = client.post(
            "/api/data-science/vektor/determinant",
            json={"matrix": [[1, 2], [3, 4]]},
        )
        assert response.status_code == 200
        data = response.json()
        assert abs(data["determinant"] - (-2.0)) < 1e-10

    def test_determinant_zero(self):
        """Matrix with zero determinant"""
        response = client.post(
            "/api/data-science/vektor/determinant",
            json={"matrix": [[1, 2], [2, 4]]},
        )
        assert response.status_code == 200
        data = response.json()
        assert abs(data["determinant"]) < 1e-10


class TestPCAEndpoint:
    """Tests for PCA endpoint"""

    def test_pca_simple_data(self):
        """PCA should work on simple 2D data"""
        data = [[1, 1], [2, 2], [3, 3], [4, 4]]
        response = client.post(
            "/api/data-science/vektor/pca",
            json={"data": data},
        )
        assert response.status_code == 200
        result = response.json()
        assert "principal_components" in result
        assert "explained_variance" in result
        assert "projected_data" in result
        assert "mean" in result

    def test_pca_random_data(self):
        """PCA should work on random 2D data"""
        import random

        data = [[random.random(), random.random()] for _ in range(20)]
        response = client.post(
            "/api/data-science/vektor/pca",
            json={"data": data},
        )
        assert response.status_code == 200
        result = response.json()
        assert len(result["principal_components"]) == 2
        assert len(result["explained_variance"]) == 2


class TestErrorHandling:
    """Tests for error handling"""

    def test_invalid_matrix_shape(self):
        """Should handle invalid matrix shape gracefully"""
        response = client.post(
            "/api/data-science/vektor/determinant",
            json={"matrix": [[1, 2, 3], [4, 5, 6]]},
        )
        # The endpoint validates and returns 422 (Unprocessable Entity)
        assert response.status_code == 422
        assert "detail" in response.json()

    def test_missing_matrix(self):
        """Should return error for missing matrix"""
        response = client.post(
            "/api/data-science/vektor/determinant",
            json={},
        )
        assert response.status_code == 422  # Validation error
