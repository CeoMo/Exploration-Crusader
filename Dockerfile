FROM node:24-slim AS frontend
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY frontend ./frontend
RUN npm run build

FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt
COPY backend ./backend
COPY --from=frontend /app/frontend/dist ./frontend/dist
RUN useradd --create-home app && mkdir -p /app/data && chown -R app:app /app
USER app
ENV DATABASE_URL=sqlite:////app/data/crusader.db
EXPOSE 8001
CMD ["sh", "-c", "exec uvicorn backend.app:app --host 0.0.0.0 --port ${PORT:-8001}"]
