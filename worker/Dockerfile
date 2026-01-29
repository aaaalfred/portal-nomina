FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Build
COPY . .
RUN npm run build

# Create storage directory
RUN mkdir -p /app/storage

CMD ["node", "dist/index.js"]
