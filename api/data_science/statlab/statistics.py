"""
Core statistics operations using pandas and numpy
"""

from typing import Any

import numpy as np
import pandas as pd


def compute_basic_stats(df: pd.DataFrame) -> dict[str, Any]:
    """
    Compute basic statistics for numeric columns

    Args:
        df: DataFrame with numeric columns

    Returns:
        Dictionary with statistics for each column
    """
    stats = {}

    for col in df.select_dtypes(include=[np.number]).columns:
        col_data = df[col].dropna()
        if len(col_data) == 0:
            continue

        stats[col] = {
            "mean": float(col_data.mean()),
            "median": float(col_data.median()),
            "std": float(col_data.std()),
            "min": float(col_data.min()),
            "max": float(col_data.max()),
            "q25": float(col_data.quantile(0.25)),
            "q75": float(col_data.quantile(0.75)),
            "count": int(len(col_data)),
            "missing": int(df[col].isna().sum()),
        }

    return stats


def prepare_histogram_data(df: pd.DataFrame, column: str, bins: int = 20) -> dict[str, Any]:
    """
    Prepare histogram data for visualization

    Args:
        df: DataFrame
        column: Column name to create histogram for
        bins: Number of bins

    Returns:
        Dictionary with histogram bin edges and counts
    """
    if column not in df.columns:
        raise ValueError(f"Column '{column}' not found in DataFrame")

    col_data = df[column].dropna()
    if len(col_data) == 0:
        raise ValueError(f"Column '{column}' has no valid data")

    counts, bin_edges = np.histogram(col_data, bins=bins)

    return {
        "counts": counts.tolist(),
        "bin_edges": bin_edges.tolist(),
        "bin_centers": ((bin_edges[:-1] + bin_edges[1:]) / 2).tolist(),
    }


def prepare_scatter_data(df: pd.DataFrame, x_col: str, y_col: str) -> dict[str, Any]:
    """
    Prepare scatter plot data

    Args:
        df: DataFrame
        x_col: X-axis column name
        y_col: Y-axis column name

    Returns:
        Dictionary with x and y data points
    """
    if x_col not in df.columns or y_col not in df.columns:
        raise ValueError("One or both columns not found in DataFrame")

    df_clean = df[[x_col, y_col]].dropna()

    return {
        "x": df_clean[x_col].tolist(),
        "y": df_clean[y_col].tolist(),
    }


def compute_correlation(df: pd.DataFrame) -> dict[str, Any]:
    """
    Compute correlation matrix for numeric columns

    Args:
        df: DataFrame with numeric columns

    Returns:
        Dictionary with correlation matrix as nested lists
    """
    numeric_df = df.select_dtypes(include=[np.number])
    corr_matrix = numeric_df.corr()

    return {
        "columns": corr_matrix.columns.tolist(),
        "values": corr_matrix.values.tolist(),
    }
