#!/bin/bash

# Pre-commit hook script
# Runs ruff, pytest, and ESLint before allowing commit

set -e

echo "Running pre-commit checks..."
echo ""

# Get the project directory (works from git root or script location)
if [ -d ".git" ]; then
    PROJECT_DIR="$(pwd)"
else
    PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fi
cd "$PROJECT_DIR"

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "api" ]; then
    echo "Error: Must run from project root directory"
    exit 1
fi

# Python checks
echo "🐍 Running Python checks..."

# Determine which Python to use (prefer virtual environment)
PYTHON=""
if [ -n "$VIRTUAL_ENV" ]; then
    # Already in a virtual environment
    PYTHON="$VIRTUAL_ENV/bin/python"
    echo "Using active virtual environment: $VIRTUAL_ENV"
else
    # Look for virtual environment in common locations
    # Prioritize api/.venv since that's where the Python code lives
    # Convert to absolute paths so they work after cd
    # Use quotes to handle paths with spaces
    if [ -f "$PROJECT_DIR/api/.venv/bin/python" ]; then
        PYTHON="$PROJECT_DIR/api/.venv/bin/python"
        echo "Using virtual environment: api/.venv"
    elif [ -f "$PROJECT_DIR/api/venv/bin/python" ]; then
        PYTHON="$PROJECT_DIR/api/venv/bin/python"
        echo "Using virtual environment: api/venv"
    elif [ -f "$PROJECT_DIR/venv/bin/python" ]; then
        PYTHON="$PROJECT_DIR/venv/bin/python"
        echo "Using virtual environment: venv"
    elif [ -f "$PROJECT_DIR/.venv/bin/python" ]; then
        PYTHON="$PROJECT_DIR/.venv/bin/python"
        echo "Using virtual environment: .venv"
    elif [ -f "$PROJECT_DIR/env/bin/python" ]; then
        PYTHON="$PROJECT_DIR/env/bin/python"
        echo "Using virtual environment: env"
    fi
    
    # Ensure we have an absolute path
    if [ -n "$PYTHON" ] && [[ "$PYTHON" != /* ]]; then
        PYTHON="$PROJECT_DIR/$PYTHON"
    fi
fi

# Fall back to system Python if no venv found
if [ -z "$PYTHON" ]; then
    if command -v python &> /dev/null; then
        PYTHON="python"
        echo "Using system Python: $(python --version 2>&1)"
    elif command -v python3 &> /dev/null; then
        PYTHON="python3"
        echo "Using system Python: $(python3 --version 2>&1)"
    else
        echo "Warning: Python not found, skipping Python checks"
    fi
fi

if [ -n "$PYTHON" ]; then
    # Run ruff format
    echo "📝 Formatting Python code with ruff..."
    cd api || exit 1
    "$PYTHON" -m ruff format . tests || {
        echo "❌ Ruff formatting failed!"
        exit 1
    }

    # Run ruff check
    echo "🔍 Checking Python code with ruff..."
    "$PYTHON" -m ruff check --fix . tests || {
        echo "❌ Ruff linting failed!"
        exit 1
    }

    # Run mypy type checking
    echo "🔍 Type checking with mypy..."
    if "$PYTHON" -c "import mypy" 2>/dev/null; then
        "$PYTHON" -m mypy . --config-file ../mypy.ini || {
            echo "❌ Type checking failed!"
            exit 1
        }
    else
        echo "⚠️  mypy not installed, skipping type checking"
        echo "   Install with: pip install mypy"
    fi

    # Check if dependencies are installed
    echo "🔍 Checking Python dependencies..."
    if ! "$PYTHON" -c "import fastapi, numpy, pytest" 2>/dev/null; then
        echo "❌ Python dependencies not installed in current Python environment!"
        echo ""
        echo "Current Python: $("$PYTHON" --version 2>&1)"
        echo "Python path: $("$PYTHON" -c 'import sys; print(sys.executable)')"
        echo ""
        echo "Please install dependencies:"
        echo "  cd api && \"$PYTHON\" -m pip install -r requirements.txt"
        echo ""
        echo "Or activate your virtual environment if you have one."
        echo "Or skip tests for now with: git commit --no-verify"
        exit 1
    fi

    # Run pytest
    echo "🧪 Running Python tests..."
    "$PYTHON" -m pytest tests -v || {
        echo "❌ Tests failed!"
        exit 1
    }
    cd .. || exit 1
fi

# JavaScript/TypeScript checks
echo ""
echo "📦 Running JavaScript/TypeScript checks..."

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "Warning: npm not found, skipping JavaScript checks"
else
    # Run ESLint
    echo "🔍 Checking JavaScript/TypeScript code with ESLint..."
    npm run lint || {
        echo "❌ ESLint failed!"
        exit 1
    }
fi

echo ""
echo "✅ All checks passed! Proceeding with commit..."
