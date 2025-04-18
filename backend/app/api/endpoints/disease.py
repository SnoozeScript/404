from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
# Correctly import the function from ai_services
from app.core.ai_services import get_disease_prediction
# from app.models.disease import DiseasePredictionResponse # Define if needed later

router = APIRouter()

@router.post("/detect", status_code=200)
async def detect_crop_disease(
    file: UploadFile = File(...)
):
    """
    Receives a plant image and returns AI-based disease analysis.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image.")

    # Optional: Add file size check
    # file_size = len(await file.read()) # Be careful reading large files into memory
    # await file.seek(0) # Reset file pointer if you read it
    # if file_size > MAX_FILE_SIZE: # Define MAX_FILE_SIZE
    #    raise HTTPException(status_code=413, detail="File too large")

    try:
        image_bytes = await file.read()
        if not image_bytes:
             raise HTTPException(status_code=400, detail="Received an empty image file.")

        # Call the AI service function
        prediction_result = await get_disease_prediction(image_bytes)

        # Check if AI service returned an error message
        if prediction_result.startswith("Error:"):
             # You might want different status codes based on the error type
             raise HTTPException(status_code=503, detail=prediction_result) # Service unavailable or failed

        return {"analysis": prediction_result}

    except HTTPException as http_exc:
        # Re-raise HTTP exceptions directly
        raise http_exc
    except Exception as e:
        # Log the error properly in a real application
        print(f"Unexpected error in /detect endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"An internal server error occurred while processing the image.")
    finally:
        # Ensure the file is closed
        await file.close()