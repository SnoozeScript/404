from fastapi import APIRouter, Depends, HTTPException
from app.models.yield_model import YieldInput, YieldPredictionResponse
from app.services.yield_prediction_service import predict_yield, get_weather_data

router = APIRouter()

@router.post("/predict", response_model=YieldPredictionResponse, status_code=200)
async def predict_farm_yield(
    yield_input: YieldInput
):
    """
    Receives farm details and returns a yield prediction with recommendations.
    """
    try:
        # Handle legacy field mapping if needed
        if yield_input.crop_type and not yield_input.crop:
            yield_input.crop = yield_input.crop_type
        
        # Get weather data if location is provided
        weather_data = None
        if hasattr(yield_input, 'latitude') and hasattr(yield_input, 'longitude') and \
           yield_input.latitude and yield_input.longitude:
            weather_data = get_weather_data(yield_input.latitude, yield_input.longitude)
        
        # Call the prediction service
        yield_per_hectare, total_production, recommendations = predict_yield(yield_input)
        
        # Create response - explicitly use the field name (yield_) instead of the alias (yield)
        response_data = {
            "success": True,
            "yield_": yield_per_hectare,  # Use the field name, not the alias
            "estimated_production": total_production,
            "recommendations": recommendations
        }
        
        # Add weather data to response if available
        if weather_data:
            response_data["weather_data"] = weather_data
        
        # Create the response object
        return YieldPredictionResponse(**response_data)
    except Exception as e:
        # Log the error properly in a real application
        print(f"Unexpected error in /predict endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"An internal server error occurred while generating the yield prediction: {str(e)}")