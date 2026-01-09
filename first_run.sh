#!/bin/bash
# First run setup for Music Crossword
# Initializes database and imports themes

set -e
cd "$(dirname "$0")"

echo "🎵 Music Crossword - First Run Setup"
echo "====================================="

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required. Please install it first."
    exit 1
fi

# Install Python dependencies (if any)
if [ -f requirements.txt ]; then
    # Check if requirements.txt has any actual dependencies (not just comments/whitespace)
    if grep -v '^#' requirements.txt | grep -v '^$' | grep -q .; then
        echo "📦 Installing Python dependencies..."
        # Use virtual environment to avoid externally-managed-environment error
        python3 -m venv venv 2>/dev/null || true
        if [ -d venv ]; then
            source venv/bin/activate
            pip install -r requirements.txt --quiet
            deactivate
        else
            pip3 install -r requirements.txt --quiet
        fi
    else
        echo "📦 No Python dependencies to install (requirements.txt contains only comments)"
    fi
fi

# Initialize database
echo "🗄️  Initializing database..."
python3 scripts/db_init.py

# Import themes
echo "🎼 Importing musical themes..."
python3 scripts/import_50_themes.py

# Install root dependencies (for crossword generator)
if [ -f package.json ]; then
    echo "📦 Installing root dependencies (for crossword generator)..."
    npm install --silent
fi

# Install UI dependencies
echo "📦 Installing UI dependencies..."
cd music-crossword-ui
npm install --silent
cd ..

# Generate easy crosswords
echo "🎵 Generating easy crosswords..."
if command -v node &> /dev/null; then
    # Generate 3 easy crosswords
    for i in {1..3}; do
        echo "   Generating crossword $i/3..."
        node crossword_generator.js || echo "   ⚠️  Failed to generate crossword $i (this is okay if database is still being set up)"
    done
    echo "✅ Crossword generation complete!"
else
    echo "⚠️  Node.js not found, skipping crossword generation"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "  Development:  cd music-crossword-ui && npm run dev"
echo "  Docker:       ./run.sh"

