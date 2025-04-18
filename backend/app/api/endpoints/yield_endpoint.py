from fastapi import APIRouter, Depends, HTTPException
# Ensure model import uses the new filename
from app.models.yield_model import YieldInput, YieldPredictionResponse
# Correctly import the function from ai_services
from app.core.ai_services import get_yield_estimate

router = APIRouter()

@router.post("/predict", response_model=YieldPredictionResponse, status_code=200)
async def predict_farm_yield(
    yield_input: YieldInput # FastAPI uses pydantic model for request body validation
):
    """
    Receives farm details and returns an AI-based yield prediction.
    """
    try:
        # Call the AI service function
        prediction_text = await get_yield_estimate(yield_input)

        # Check if AI service returned an error message
        if prediction_text.startswith("Error:"):
            # Use 503 for service unavailable/failed
            raise HTTPException(status_code=503, detail=prediction_text)

        # Return the successful prediction within the response model
        return YieldPredictionResponse(prediction_text=prediction_text)

    except HTTPException as http_exc:
        # Re-raise HTTP exceptions
        raise http_exc
    except Exception as e:
        # Log the error properly in a real application
        print(f"Unexpected error in /predict endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"An internal server error occurred while generating the yield prediction.")