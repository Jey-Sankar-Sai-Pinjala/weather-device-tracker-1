# Step 1: Build React frontend
FROM node:20 AS frontend-build
WORKDIR /app/frontend
COPY frontend/ .
RUN npm install && npm run build

# Step 2: Set up Python Flask backend
FROM python:3.11-slim
WORKDIR /app

# Install dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend and frontend build
COPY backend/ ./backend/
COPY --from=frontend-build /app/frontend/build/ ./backend/build/

# Set working directory to backend
WORKDIR /app/backend

# Set environment port and expose
ENV PORT=5000
EXPOSE 5000

# Run app
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
