FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY backend/tsconfig.json backend/tsconfig.json
COPY backend/src backend/src

RUN npm ci --workspace backend --include-workspace-root=false
RUN npm run build --workspace backend

FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY backend/package.json ./backend/package.json
RUN npm install --omit=dev --prefix ./backend
COPY --from=build /app/backend/dist ./backend/dist
COPY cards ./cards
COPY field ./field

USER node
EXPOSE 3001

CMD ["node", "backend/dist/index.js"]
