FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json
RUN npm ci --workspace frontend --include-workspace-root=false

COPY frontend/. ./frontend/
# `frontend/public/cards` and `frontend/public/field` are symlinks in repo.
# In this image we only copy `frontend/`, so these links can become dangling
# and break Vite `prepare-out-dir` phase.
RUN rm -rf ./frontend/public/cards ./frontend/public/field \
  && mkdir -p ./frontend/public/cards ./frontend/public/field
RUN npm run build --workspace frontend

FROM nginx:1.27-alpine AS runtime
WORKDIR /usr/share/nginx/html

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist .

EXPOSE 80
