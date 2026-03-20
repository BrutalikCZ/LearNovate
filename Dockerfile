# ── Node.js frontend + API server ────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (cache layer)
COPY package.json ./
RUN npm install --omit=dev

# Copy all frontend & server files
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
