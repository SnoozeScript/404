from fastapi import APIRouter

# Ensure the imported module names match the filenames
from app.api.endpoints import disease, yield_endpoint, market, voice

api_router = APIRouter()

# Include routers from endpoint modules with prefixes
api_router.include_router(disease.router, prefix="/disease", tags=["Disease Detection"])
api_router.include_router(yield_endpoint.router, prefix="/yield", tags=["Yield Prediction"])
api_router.include_router(market.router, prefix="/market", tags=["Market Access"])
api_router.include_router(voice.router, prefix="/voice", tags=["Voice Interaction"])

# Health check endpoint remains useful
@api_router.get("/health", tags=["Health Check"])
async def health_check():
    return {"status": "ok", "message": "FarmGenius backend is running"}