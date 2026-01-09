#!/bin/bash

# Script to stop, remove, and restart Docker containers

set -e

# Allow custom port via environment variable
PORT=${PORT:-4173}

echo "🐳 Stopping and removing existing containers..."
docker-compose down -v || true

echo "🔍 Checking for processes using port $PORT..."
# Force remove container by name if it exists (in case it wasn't managed by docker-compose)
if docker ps -a --format '{{.Names}}' | grep -q "^music-crossword-ui$"; then
    echo "🗑️  Removing existing container 'music-crossword-ui'..."
    docker rm -f music-crossword-ui || true
fi
# Check if port is in use
if command -v lsof >/dev/null 2>&1; then
    PORT_PID=$(lsof -ti:$PORT 2>/dev/null || true)
    if [ ! -z "$PORT_PID" ]; then
        echo "⚠️  Found process using port $PORT (PID: $PORT_PID)"
        echo "💡 You may need to stop your dev server first:"
        echo "   Press Ctrl+C in the terminal running 'npm run dev'"
        echo "   Or run: kill $PORT_PID"
        echo "   Or use a different port: PORT=5174 ./run.sh"
        echo ""
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "❌ Aborted. Please free port $PORT and try again."
            exit 1
        fi
    fi
elif command -v netstat >/dev/null 2>&1; then
    if netstat -tuln 2>/dev/null | grep -q ":$PORT "; then
        echo "⚠️  Port $PORT appears to be in use"
        echo "💡 Please stop any process using port $PORT and try again"
        echo "   Or use a different port: PORT=5174 ./run.sh"
    fi
fi

echo "🧹 Cleaning up old images (optional)..."
# Uncomment the next line if you want to rebuild from scratch every time
# docker-compose build --no-cache

echo "🔨 Building and starting containers..."
# Export PORT for docker-compose if different
export PORT
if ! docker-compose up --build -d; then
    echo ""
    echo "❌ Failed to start containers!"
    echo "💡 Common issues:"
    echo "   - Port $PORT is already in use (stop your dev server)"
    echo "   - Docker daemon is not running"
    echo "   - Insufficient permissions (try without sudo, or add user to docker group)"
    echo ""
    echo "💡 Try using a different port:"
    echo "   PORT=5174 ./run.sh"
    echo ""
    exit 1
fi

echo "⏳ Waiting for services to be ready..."
sleep 5

echo "📊 Container status:"
docker-compose ps

echo ""
echo "✅ Containers started!"
echo "🌐 Application should be available at: http://localhost:$PORT"
echo "   (Note: vite preview uses port 4173 by default)"
echo ""
echo "📝 Useful commands:"
echo "   View logs:        docker-compose logs -f"
echo "   Stop containers:  docker-compose down"
echo "   Restart:          ./run.sh"
echo "   Use different port: PORT=5174 ./run.sh"
echo ""
