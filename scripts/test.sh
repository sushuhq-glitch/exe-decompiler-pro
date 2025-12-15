#!/bin/bash
# Test runner script

set -e

echo "Running tests..."

# Activate virtual environment
source venv/bin/activate

# Run pytest with coverage
pytest tests/ -v --cov=. --cov-report=html --cov-report=term

echo "✅ Tests complete"
echo "Coverage report: htmlcov/index.html"
