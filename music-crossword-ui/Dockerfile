FROM node:18-alpine

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++ sqlite

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port (vite preview default is 4173)
EXPOSE 4173

# Start the application in preview mode on port 4173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]

