# FarmGenius Frontend

This is the frontend for **FarmGenius: AI-powered Agriculture Assistant**.

## Overview
FarmGenius empowers Indian farmers with actionable insights using AI. The frontend is built with React and Tailwind CSS, providing a modern, responsive, and mobile-friendly interface for yield prediction, disease detection, market prices, and AI chat.

## Features
- Yield Predictor with Google Maps integration
- Disease Detector (AI-powered image analysis)
- Real-time Market Prices (AgMarkNet scraping)
- AI Chat Assistant (Gemini-powered)
- Mobile-first, professional UI

## Setup & Installation
```bash
cd frontend
npm install
cp .env.example .env  # Set your VITE_GOOGLE_MAPS_API_KEY
npm run dev
```

## Usage
- Access the app at `http://localhost:5173`
- Use the navigation bar to try all features
- For full documentation, see the main [README.md](../README.md) at the project root

## Tech Stack
- React 19, Tailwind CSS, Vite, React Router, Axios, React Icons

## API Endpoints (via backend)
- `POST /api/v1/yield/predict`
- `POST /api/v1/disease/detect`
- `GET /api/v1/market/prices`
- `POST /api/v1/chat/ask`

## Hackathon Notes
- Built for rapid deployment and real-world impact
- See the main [README.md](../README.md) for backend setup, architecture, and full team acknowledgments
