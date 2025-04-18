"""
Chat assistant API endpoints for FarmGenius
This module provides endpoints for interacting with the general-purpose AI chat assistant.
"""
from fastapi import APIRouter, HTTPException, Depends, Body
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import uuid
import asyncio
import json

from app.core.multi_agent import AgentType, Message, coordinator, context_protocol

router = APIRouter()

class ChatInput(BaseModel):
    """Model for chat input data"""
    message: str = Field(..., min_length=1, description="User's message to the chat assistant")
    session_id: Optional[str] = Field(None, description="Session ID for continuing conversations")
    model: Optional[str] = Field("gemini", description="Model to use (only gemini is supported)")
    language: Optional[str] = Field("en", description="Language code (en, hi, mr)")
    context_data: Optional[Dict[str, Any]] = Field(None, description="Additional context for the chat")

class ChatResponse(BaseModel):
    """Model for chat response data"""
    response: str
    session_id: str
    model_used: str = "gemini-1.5-pro"

class StreamChatInput(ChatInput):
    """Model for streaming chat input, extending ChatInput"""
    pass

@router.post("/message", response_model=ChatResponse, status_code=200)
async def chat_message(chat_input: ChatInput = Body(...)):
    """
    Send a message to the AI chat assistant and get a response.
    This endpoint handles regular (non-streaming) chat interactions.
    """
    try:
        # Create or reuse session ID for context continuity
        session_id = chat_input.session_id or str(uuid.uuid4())
        
        # Set up context with language preference
        context_protocol.set_context(session_id, {
            "language": chat_input.language,
            "last_message": chat_input.message,
            **(chat_input.context_data or {})
        })
        
        # Send the message to the chat assistant agent
        message = await coordinator.route_message(
            Message(
                sender=AgentType.COORDINATOR,
                receiver=AgentType.CHAT_ASSISTANT,
                content={
                    "message": chat_input.message,
                    "model": chat_input.model
                },
                message_type="chat",
                context={"session_id": session_id}
            )
        )
        
        if not message or "error" in message.content:
            error = message.content.get("error", "Unknown error processing chat message") if message else "No response from chat agent"
            raise HTTPException(status_code=503, detail=error)
        
        # Extract response from the message
        response_text = message.content.get("response", "Sorry, I couldn't generate a response.")
        
        return ChatResponse(
            response=response_text,
            session_id=session_id,
            model_used=chat_input.model
        )

    except HTTPException as http_exc:
        # Re-raise HTTP exceptions
        raise http_exc
    except Exception as e:
        # Log the error properly in a real application
        print(f"Unexpected error in /chat/message endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"An internal server error occurred: {str(e)}")

@router.post("/stream", status_code=200)
async def stream_chat(chat_input: StreamChatInput = Body(...)):
    """
    Stream a chat response from the AI assistant.
    This endpoint provides a streaming response for a more interactive experience.
    
    Note: This is a simplified implementation. In a production environment,
    you would implement actual streaming with the Gemini or Groq API.
    """
    try:
        # Create or reuse session ID for context continuity
        session_id = chat_input.session_id or str(uuid.uuid4())
        
        # Set up context with language preference
        context_protocol.set_context(session_id, {
            "language": chat_input.language,
            "last_message": chat_input.message,
            **(chat_input.context_data or {})
        })
        
        # For this simplified demo, we'll process the entire message and simulate streaming
        message = await coordinator.route_message(
            Message(
                sender=AgentType.COORDINATOR,
                receiver=AgentType.CHAT_ASSISTANT,
                content={
                    "message": chat_input.message,
                    "model": chat_input.model
                },
                message_type="chat",  # Note: In a real implementation, we'd use "stream_chat"
                context={"session_id": session_id}
            )
        )
        
        if not message or "error" in message.content:
            error = message.content.get("error", "Unknown error processing chat message") if message else "No response from chat agent"
            raise HTTPException(status_code=503, detail=error)
        
        # Extract response from the message
        response_text = message.content.get("response", "Sorry, I couldn't generate a response.")
        
        # Create a streaming response generator that simulates streaming
        async def fake_stream_generator():
            # Split response into smaller chunks for streaming
            total_length = len(response_text)
            chunk_size = max(5, total_length // 20)  # Divide into ~20 chunks, min 5 chars
            
            # Stream chunks with slight delays
            for i in range(0, total_length, chunk_size):
                end = min(i + chunk_size, total_length)
                chunk = response_text[i:end]
                
                # Just yield the raw text chunk - frontend will append these
                yield chunk
                
                # Small delay to simulate streaming
                await asyncio.sleep(0.05)
        
        return StreamingResponse(
            fake_stream_generator(),
            media_type="application/x-ndjson"
        )
        
    except HTTPException as http_exc:
        # Re-raise HTTP exceptions
        raise http_exc
    except Exception as e:
        # Log the error properly in a real application
        print(f"Unexpected error in /chat/stream endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"An internal server error occurred: {str(e)}")

@router.get("/history/{session_id}", status_code=200)
async def get_chat_history(session_id: str):
    """
    Get the chat history for a specific session.
    This is useful for continuing conversations or displaying chat history.
    """
    try:
        chat_history_key = f"chat_history_{session_id}"
        chat_history = context_protocol.get_context(chat_history_key)
        
        if not chat_history:
            return {"session_id": session_id, "messages": []}
        
        # Transform the chat history into the format expected by the frontend
        messages = []
        for item in chat_history:
            timestamp = item.get("timestamp")
            if isinstance(timestamp, float):
                # Convert timestamp to ISO format string
                from datetime import datetime, timezone
                timestamp = datetime.fromtimestamp(timestamp, tz=timezone.utc).isoformat()
            
            messages.append({
                "id": f"{item['role']}-{int(float(timestamp)) if isinstance(timestamp, float) else timestamp}",
                "role": item["role"],
                "content": item["content"],
                "timestamp": timestamp
            })
        
        return {"session_id": session_id, "messages": messages}
        
    except Exception as e:
        print(f"Error retrieving chat history: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving chat history: {str(e)}")
