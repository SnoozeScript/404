# Use official Python image
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for PyAudio
RUN apt-get update && apt-get install -y gcc portaudio19-dev && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY app ./app
COPY .env ./

# Expose port
EXPOSE 8000

# Run the app with Uvicorn (production settings)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
