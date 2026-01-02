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

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip3 install -r requirements.txt --quiet

# Initialize database
echo "🗄️  Initializing database..."
python3 scripts/db_init.py

# Import themes
echo "🎼 Importing musical themes..."
python3 scripts/import_50_themes.py

# Install UI dependencies
echo "📦 Installing UI dependencies..."
cd music-crossword-ui
npm install --silent
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "  Development:  cd music-crossword-ui && npm run dev"
echo "  Docker:       ./run.sh"

