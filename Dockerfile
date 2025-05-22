# Stage 1: Build React app
FROM node:20-alpine as frontend-build

WORKDIR /app/frontend

# Install dependencies and build React for production
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Build Flask backend and serve React build files
FROM python:3.11-slim

WORKDIR /weather-device-tracker/backend

# Install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ ./

# Copy React build from frontend-build stage
COPY --from=frontend-build /app/frontend/build ./static

# Expose port Flask will run on
EXPOSE 5000

# Set environment variable for Flask to know static files path
ENV STATIC_FOLDER=static

# Run the Flask app (assumes your main file is app.py)
CMD ["python", "app.py"]
