# Mosaic

A sandbox environment for mathematical computing and exploration. Built with Nuxt, FastAPI, and deployed on Fly.io.

## Features

- **Vektor**: Interactive linear algebra playground with matrix transformations, eigenvalues, eigenvectors, and PCA
- Hexagonal mosaic interface for navigating different tools
- FastAPI backend for mathematical computations
- Nuxt frontend with TypeScript

## Setup

### Prerequisites

- Node.js 20+ and npm
- Python 3.11+
- pip or uv (for Python package management)

### Installation

1. **Install Nuxt dependencies:**
   ```bash
   cd nuxt
   npm install
   cd ..
   ```

2. **Install Python dependencies:**
   ```bash
   cd api
   pip install -r requirements.txt
   # or if using uv:
   # uv pip install -r requirements.txt
   cd ..
   ```

3. **Set up pre-commit hooks:**
   ```bash
   # Make the script executable (if not already)
   chmod +x pre-commit.sh
   
   # Install the git hook
   ln -sf ../../pre-commit.sh .git/hooks/pre-commit
   chmod +x .git/hooks/pre-commit
   ```

## Development

### Running the Application

1. **Start the FastAPI backend:**
   ```bash
   cd api && uvicorn main:app --reload --port 8000
   ```

2. **Start the Nuxt frontend:**
   ```bash
   cd nuxt && npm run dev
   ```

3. **Open your browser:**
   - Frontend: http://localhost:3000
   - API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Testing

**Run Python tests:**
```bash
cd api && python -m pytest tests -v
```

**Run ESLint (Nuxt):**
```bash
cd nuxt && npm run lint
```

**Run all checks:**
```bash
cd api && python -m pytest tests -v
cd ../nuxt && npm run lint
```

### Code Formatting

**Format Python code:**
```bash
cd api && ruff format . tests && ruff check --fix . tests
```

**Format JavaScript/TypeScript:**
```bash
cd nuxt && npm run lint
```

## Pre-commit Hooks

The pre-commit hook automatically runs:
1. **Ruff formatting** - Formats Python code
2. **Ruff linting** - Checks Python code quality
3. **Pytest** - Runs all Python tests
4. **ESLint** - Checks Nuxt code

If any check fails, the commit will be blocked. To bypass (not recommended):
```bash
git commit --no-verify
```

## Project Structure

```
mosaic/
├── api/                    # FastAPI backend
│   ├── main.py             # FastAPI app and routes
│   ├── requirements.txt    # Python dependencies
│   ├── pyproject.toml      # Ruff/mypy/pytest config
│   └── tests/              # Python tests
├── nuxt/                   # Nuxt frontend
│   ├── app/                # Nuxt app source (pages/components/assets)
│   ├── package.json        # Nuxt scripts and deps
│   └── nuxt.config.ts      # Nuxt configuration
├── Dockerfile              # Docker configuration
├── fly.toml                # Fly.io deployment config
├── pre-commit.sh           # Pre-commit hook script
└── README.md
```

## Deployment

Deploy to Fly.io:
```bash
flyctl deploy
```

## License

This project is open source and available for educational purposes.
