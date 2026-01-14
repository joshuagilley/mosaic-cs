"""API routes for StatLab statistics application"""

from __future__ import annotations

from typing import Any

import pandas as pd
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, ConfigDict

from .statistics import (
    compute_basic_stats,
    compute_correlation,
    prepare_histogram_data,
    prepare_scatter_data,
)

router = APIRouter(prefix="/api/data-science/statlab", tags=["statlab"])


class CSVUploadResponse(BaseModel):
    """Response model for CSV upload"""

    columns: list[str]
    shape: list[int]
    preview: list[dict[str, Any]]
    numeric_columns: list[str]


class HistogramRequest(BaseModel):
    """Request model for histogram"""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "column": "age",
                "bins": 20,
            }
        }
    )

    column: str
    bins: int = 20


class ScatterRequest(BaseModel):
    """Request model for scatter plot"""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "x_column": "age",
                "y_column": "salary",
            }
        }
    )

    x_column: str
    y_column: str


@router.post("/upload", response_model=CSVUploadResponse)
async def upload_csv(file: UploadFile = File(...)) -> CSVUploadResponse:
    """
    Upload and parse CSV file

    Args:
        file: CSV file to upload

    Returns:
        CSVUploadResponse with file metadata
    """
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV file")

    try:
        contents = await file.read()
        df = pd.read_csv(pd.io.common.BytesIO(contents))

        # Get numeric columns
        numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()

        # Get preview (first 10 rows)
        preview = df.head(10).to_dict(orient="records")

        return CSVUploadResponse(
            columns=df.columns.tolist(),
            shape=[int(df.shape[0]), int(df.shape[1])],
            preview=preview,
            numeric_columns=numeric_cols,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing CSV: {str(e)}") from None


@router.post("/stats")
async def get_statistics(file: UploadFile = File(...)) -> dict[str, Any]:
    """
    Compute basic statistics for numeric columns in CSV

    Args:
        file: CSV file

    Returns:
        Dictionary with statistics for each numeric column
    """
    try:
        contents = await file.read()
        df = pd.read_csv(pd.io.common.BytesIO(contents))

        stats = compute_basic_stats(df)

        return {
            "statistics": stats,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error computing statistics: {str(e)}") from None


@router.post("/histogram")
async def get_histogram(
    file: UploadFile = File(...),
    column: str = Form(...),
    bins: int = Form(20),
) -> dict[str, Any]:
    """
    Generate histogram data for a column

    Args:
        file: CSV file
        column: Column name
        bins: Number of bins

    Returns:
        Dictionary with histogram data
    """
    try:
        contents = await file.read()
        df = pd.read_csv(pd.io.common.BytesIO(contents))

        histogram_data = prepare_histogram_data(df, column, bins)

        return histogram_data
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from None
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error generating histogram: {str(e)}") from None


@router.post("/scatter")
async def get_scatter(
    file: UploadFile = File(...),
    x_column: str = Form(...),
    y_column: str = Form(...),
) -> dict[str, Any]:
    """
    Generate scatter plot data

    Args:
        file: CSV file
        x_column: X-axis column name
        y_column: Y-axis column name

    Returns:
        Dictionary with scatter plot data
    """
    try:
        contents = await file.read()
        df = pd.read_csv(pd.io.common.BytesIO(contents))

        scatter_data = prepare_scatter_data(df, x_column, y_column)

        return scatter_data
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from None
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error generating scatter plot: {str(e)}") from None


@router.post("/correlation")
async def get_correlation(file: UploadFile = File(...)) -> dict[str, Any]:
    """
    Compute correlation matrix for numeric columns

    Args:
        file: CSV file

    Returns:
        Dictionary with correlation matrix
    """
    try:
        contents = await file.read()
        df = pd.read_csv(pd.io.common.BytesIO(contents))

        corr_data = compute_correlation(df)

        return corr_data
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error computing correlation: {str(e)}") from None
