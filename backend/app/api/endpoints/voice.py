from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field # Import Field for validation
from app.core.ai_services import process_voice_command_ai

router = APIRouter()

class VoiceCommandInput(BaseModel):
    transcript: str = Field(..., min_length=1, description="The transcribed text from the user's speech.")
    # Add basic validation for language code (e.g., allow common ones)
    language: str = Field(default="en", pattern="^(en|hi|mr)$", description="Language code (e.g., 'en', 'hi', 'mr')")

class VoiceCommandResponse(BaseModel):
    response_text: str

@router.post("/command", response_model=VoiceCommandResponse, status_code=200)
async def handle_voice_command(
    command_input: VoiceCommandInput = Body(...)
):
    """
    Receives transcribed text, processes the command using AI,
    and returns a text response in the specified language.
    """
    try:
        # Call the AI service function
        response_text = await process_voice_command_ai(
            transcript=command_input.transcript,
            language=command_input.language
        )

        # Check if AI service returned an error message
        if response_text.startswith("Error:"):
             # Use 503 for service unavailable/failed
            raise HTTPException(status_code=503, detail=response_text)

        return VoiceCommandResponse(response_text=response_text)

    except HTTPException as http_exc:
        # Re-raise HTTP exceptions
        raise http_exc
    except Exception as e:
        # Log the error properly in a real application
        print(f"Unexpected error in /command endpoint: {e}")
        raise HTTPException(status_code=500, detail="An internal server error occurred while processing the voice command.")