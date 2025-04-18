from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field  # Import Field for validation
import uuid
from typing import Optional, Dict, Any, List

# Import multi-agent system components
from app.core.multi_agent import AgentType, Message, coordinator, context_protocol
from app.core.ai_services import process_voice_command_ai

router = APIRouter()

class VoiceCommandInput(BaseModel):
    transcript: str = Field(..., min_length=1, description="The transcribed text from the user's speech.")
    # Add basic validation for language code (e.g., allow common ones)
    language: str = Field(default="en", pattern="^(en|hi|mr)$", description="Language code (e.g., 'en', 'hi', 'mr')")
    session_id: Optional[str] = Field(None, description="Optional session ID for continuing conversations")
    location: Optional[str] = Field("Baramati", description="User's location for contextual responses")
    context_data: Optional[Dict[str, Any]] = Field(None, description="Additional context for the voice command")

class VoiceCommandResponse(BaseModel):
    response_text: str
    audio_url: Optional[str] = None
    session_id: str
    detected_intent: Optional[str] = None
    requires_followup: bool = False
    followup_type: Optional[str] = None

@router.post("/command", response_model=VoiceCommandResponse, status_code=200)
async def handle_voice_command(
    command_input: VoiceCommandInput = Body(...)
):
    """
    Receives transcribed text, processes the command using the multi-agent system,
    and returns a text response in the specified language.
    """
    try:
        # Create or reuse session ID for context continuity
        session_id = command_input.session_id or str(uuid.uuid4())
        
        # Set up context with language preference and location
        context_protocol.set_context(session_id, {
            "language": command_input.language,
            "location": command_input.location or "Baramati",
            "last_transcript": command_input.transcript,
            **(command_input.context_data or {})
        })
        
        # Send the voice command to the voice assistant agent
        message = await coordinator.route_message(
            Message(
                sender=AgentType.COORDINATOR,
                receiver=AgentType.VOICE_ASSISTANT,
                content={
                    "transcript": command_input.transcript
                },
                message_type="process_command",
                context={"session_id": session_id}
            )
        )
        
        if not message or "error" in message.content:
            error = message.content.get("error", "Unknown error processing voice command") if message else "No response from voice agent"
            raise HTTPException(status_code=503, detail=error)
        
        # Extract response from the message
        response_text = message.content.get("response", "Sorry, I couldn't process that command.")
        
        # Check if we should route to another agent based on intent detection
        should_route = message.content.get("should_route", False)
        target_agent = message.content.get("target_agent")
        detected_intent = target_agent if target_agent else "general_query"
        
        # For now, we're using the voice agent's processed response
        # In a more sophisticated system, we might route to other agents here
        # based on the detected intent and get specialized responses
        
        # Generate audio for the response if needed (handled by frontend in this version)
        audio_url = None  # In production, this could be a URL to synthesized audio
        
        return VoiceCommandResponse(
            response_text=response_text,
            audio_url=audio_url,
            session_id=session_id,
            detected_intent=detected_intent,
            requires_followup=should_route,
            followup_type=detected_intent if should_route else None
        )

    except HTTPException as http_exc:
        # Re-raise HTTP exceptions
        raise http_exc
    except Exception as e:
        # Log the error properly in a real application
        print(f"Unexpected error in /command endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"An internal server error occurred: {str(e)}")