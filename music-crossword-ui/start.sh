#!/bin/bash

# Musical Crossword - Quick Start Script
# Automatically sets up and starts the development server

echo "🎵 Musical Crossword - Starting..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if database exists
if [ ! -f "music_crossword.db" ]; then
    echo "🔗 Linking database..."
    if [ -f "../music_crossword.db" ]; then
        ln -s ../music_crossword.db ./music_crossword.db
        echo "✅ Database linked successfully"
    else
        echo "⚠️  Warning: Database not found at ../music_crossword.db"
        echo "   Please create puzzles first: cd .. && node crossword_generator.js"
    fi
    echo ""
fi

# Start the development server
echo "🚀 Starting development server..."
echo "📍 Open your browser to: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev

