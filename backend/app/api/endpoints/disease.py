# backend/app/api/endpoints/disease.py

import logging
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from PIL import UnidentifiedImageError # Specific error if PIL can't open image

# Import AI service, config, and response model
from app.core.ai_services import get_disease_prediction
from app.core.config import get_settings, Settings
# Assuming you create this file: backend/app/models/disease_model.py
from app.models.disease_model import DiseaseResponse

# --- Logging Setup ---
# Configure logging for this module
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Router Setup ---
router = APIRouter()

# --- Dependency for Validated Settings ---
# This checks settings on endpoint call and improves testability
async def get_validated_settings(settings: Settings = Depends(get_settings)) -> Settings:
    """Dependency to get settings and validate necessary API keys."""
    # Specific check for Gemini key needed by this endpoint's service
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "YOUR_GEMINI_API_KEY_NOT_SET":
        logger.error("Gemini API Key is not configured in settings.")
        # Use 503 Service Unavailable as the dependency (AI service) isn't ready
        raise HTTPException(status_code=503, detail="AI Service (Gemini) is not configured correctly.")
    return settings

# --- API Endpoint ---
@router.post(
    "/detect",
    response_model=DiseaseResponse, # Use the Pydantic model for response structure
    status_code=200,
    summary="Detect Crop Disease from Image",
    description="Upload a plant image to get an AI-based analysis of potential diseases or pests. "
                "Supported formats include JPEG, PNG, WEBP etc.",
    tags=["Disease Detection"] # Consistent tagging for OpenAPI docs
)
async def detect_crop_disease(
    *, # Makes following arguments keyword-only, good practice
    settings: Settings = Depends(get_validated_settings), # Inject validated settings
    file: UploadFile = File(..., description="Image file of the plant.") # File is required
) -> DiseaseResponse:
    """
    Handles plant image uploads, validates them, sends for AI analysis,
    and returns the disease prediction results.

    Args:
        settings: Injected application settings.
        file: The uploaded image file.

    Returns:
        A DiseaseResponse object containing the analysis and filename.

    Raises:
        HTTPException: For various errors like invalid file type, size,
                       AI service errors, or internal server errors.
    """
    logger.info(f"Received request to detect disease for file: {file.filename}")

    # 1. Validate File Type (using content_type)
    if not file.content_type or not file.content_type.startswith("image/"):
        logger.warning(f"Invalid file type '{file.content_type}' for file '{file.filename}'.")
        raise HTTPException(
            status_code=400, # Bad Request
            detail=f"Invalid file type: '{file.content_type}'. Please upload a standard image format (JPEG, PNG, WEBP, etc.)."
        )

    # 2. Read File Content and Validate Size
    max_size_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    image_bytes = None
    try:
        # Read the file content into memory. For very large files (>50-100MB),
        # streaming would be better but more complex for API calls.
        # This approach is acceptable for typical image sizes with a limit.
        image_bytes = await file.read()

        if not image_bytes:
            logger.warning(f"Empty file uploaded: {file.filename}")
            raise HTTPException(status_code=400, detail="Received an empty image file. Please upload a valid image.")

        file_size = len(image_bytes)
        if file_size > max_size_bytes:
            logger.warning(f"File too large: {file_size} bytes for file '{file.filename}'. Limit is {max_size_bytes} bytes.")
            raise HTTPException(
                status_code=413, # Payload Too Large
                detail=f"File is too large ({round(file_size/(1024*1024), 2)} MB). Maximum size allowed is {settings.MAX_FILE_SIZE_MB}MB."
            )
        logger.info(f"File '{file.filename}' size validated ({round(file_size/(1024*1024), 2)} MB).")

    except Exception as e:
        # Catch potential errors during file reading
        logger.error(f"Error reading uploaded file '{file.filename}': {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Could not read uploaded file: {str(e)}")
    finally:
        # It's crucial to close the file handle
        await file.close()
        logger.debug(f"File '{file.filename}' closed.")

    # 3. Call AI Service for Analysis
    try:
        logger.info(f"Sending image '{file.filename}' to AI service...")
        # Call the asynchronous function from ai_services
        prediction_result = await get_disease_prediction(image_bytes)
        logger.info(f"Received AI analysis successfully for '{file.filename}'.")

        # Optional: Check if the AI service itself indicated an issue in its text response
        if prediction_result.startswith("Error:"):
            logger.error(f"AI Service returned an error message for '{file.filename}': {prediction_result}")
            # Propagate the error from the service, indicating the service had an issue
            raise HTTPException(status_code=503, detail=prediction_result) # 503 Service Unavailable

        # 4. Return Successful Response using the Pydantic model
        return DiseaseResponse(
            analysis=prediction_result,
            filename=file.filename or "unknown_filename" # Provide a default if filename is None
        )

    except UnidentifiedImageError:
        # Specific error if PIL (likely used in ai_services) cannot identify the image
        logger.warning(f"Cannot identify image format for file '{file.filename}'. It might be corrupt or unsupported.")
        raise HTTPException(status_code=400, detail="Could not identify image format. Please ensure it's a standard, non-corrupted image.")
    except HTTPException as http_exc:
        # Re-raise exceptions that are already HTTPException (like the 503 above)
        raise http_exc
    except Exception as e:
        # Catch any other unexpected errors during the AI call or processing
        # Log the full traceback for debugging
        logger.error(f"Unexpected error during AI analysis for '{file.filename}': {e}", exc_info=True)
        # Return a generic 500 Internal Server Error to the client
        raise HTTPException(
            status_code=500, # Internal Server Error
            detail="An internal server error occurred while analyzing the image. Please try again later."
        )