FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
COPY apps/server/package.json ./apps/server/

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Build
RUN npm run build --workspace=apps/server

# Production
FROM node:20-alpine

WORKDIR /app

# Copier les fichiers nécessaires
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/main.js"]




