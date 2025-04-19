"""
Chat assistant API endpoints for FarmGenius
This module provides endpoints for interacting with the general-purpose AI chat assistant.
"""
from fastapi import APIRouter, HTTPException, Depends, Body, File, UploadFile
from fastapi.responses import StreamingResponse, FileResponse
import io
import tempfile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import speech_recognition as sr
from gtts import gTTS
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
    agent: Optional[str] = Field("general_assistant", description="Expert agent to handle the message")

class ChatResponse(BaseModel):
    """Model for chat response data"""
    response: str
    session_id: str
    model_used: str = "gemini-1.5-pro"

class StreamChatInput(ChatInput):
    """Model for streaming chat input, extending ChatInput"""
    pass

@router.post("/speech-to-text")
async def speech_to_text(file: UploadFile = File(...)):
    """
    Convert uploaded speech audio to text using SpeechRecognition.
    Accepts WAV or MP3 files.
    """
    recognizer = sr.Recognizer()
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
        temp_audio.write(await file.read())
        temp_audio.flush()
        with sr.AudioFile(temp_audio.name) as source:
            audio = recognizer.record(source)
            try:
                text = recognizer.recognize_google(audio)
                return {"text": text}
            except sr.UnknownValueError:
                raise HTTPException(status_code=400, detail="Could not understand audio.")
            except sr.RequestError as e:
                raise HTTPException(status_code=500, detail=f"STT service error: {e}")

@router.post("/text-to-speech")
async def text_to_speech(text: str = Body(..., embed=True), language: str = Body("en", embed=True)):
    """
    Convert text to speech audio using gTTS and return as an MP3 stream.
    """
    try:
        tts = gTTS(text=text, lang=language)
        mp3_fp = io.BytesIO()
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)
        return StreamingResponse(mp3_fp, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS error: {e}")

from google.cloud import speech, texttospeech
import base64
import os

@router.post("/stt")
async def stt(file: UploadFile = File(...), language: str = Body("en-US", embed=True)):
    """
    Accepts an audio file and returns the transcript using Google Cloud Speech-to-Text.
    """
    client = speech.SpeechClient()
    audio_content = await file.read()
    audio = speech.RecognitionAudio(content=audio_content)
    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        language_code=language,
        audio_channel_count=1,
        enable_automatic_punctuation=True
    )
    response = client.recognize(config=config, audio=audio)
    transcript = " ".join([result.alternatives[0].transcript for result in response.results])
    if not transcript:
        raise HTTPException(status_code=400, detail="Could not transcribe audio.")
    return {"transcript": transcript}

@router.post("/speech-chat")
async def speech_chat(file: UploadFile = File(...), language: str = Body("en-US", embed=True)):
    """
    Accepts an audio file, transcribes it with Google Cloud STT, sends to chat AI, and returns the response as audio and text using Google Cloud TTS.
    """
    client_stt = speech.SpeechClient()
    audio_content = await file.read()
    audio = speech.RecognitionAudio(content=audio_content)
    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        language_code=language,
        audio_channel_count=1,
        enable_automatic_punctuation=True
    )
    response = client_stt.recognize(config=config, audio=audio)
    text = " ".join([result.alternatives[0].transcript for result in response.results])
    if not text:
        raise HTTPException(status_code=400, detail="Could not transcribe audio.")

    chat_input = ChatInput(message=text, language=language)
    chat_response = await chat_message(chat_input)
    ai_text = chat_response.response

    # Google Cloud TTS
    tts_client = texttospeech.TextToSpeechClient()
    synthesis_input = texttospeech.SynthesisInput(text=ai_text)
    voice = texttospeech.VoiceSelectionParams(
        language_code=language,
        ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
    )
    audio_config = texttospeech.AudioConfig(audio_encoding=texttospeech.AudioEncoding.MP3)
    tts_response = tts_client.synthesize_speech(
        input=synthesis_input, voice=voice, audio_config=audio_config
    )
    audio_base64 = base64.b64encode(tts_response.audio_content).decode("utf-8")
    return {
        "user_transcript": text,
        "ai_text": ai_text,
        "ai_audio_base64": audio_base64
    }

# ---
# ENVIRONMENT SETUP REQUIRED:
# - Set GOOGLE_APPLICATION_CREDENTIALS to your Google Cloud service account JSON key file.
# - Enable Google Cloud Speech-to-Text and Text-to-Speech APIs in your project.
# ---

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

        # Determine the expert agent to route to
        agent_map = {
            "general_assistant": AgentType.CHAT_ASSISTANT,
            "market_expert": AgentType.MARKET_EXPERT,
            "weather_advisor": AgentType.WEATHER_ADVISOR,
            "crop_doctor": AgentType.CROP_DOCTOR,
        }
        selected_agent = agent_map.get(chat_input.agent or "general_assistant", AgentType.CHAT_ASSISTANT)

        # Use a unique system prompt per agent for demonstration
        system_prompts = {
            AgentType.CHAT_ASSISTANT: "You are FarmGenius, your general agriculture AI assistant across India.",
            AgentType.MARKET_EXPERT: "You are MarketExpert: Provide expert analysis and advice on agricultural markets, prices, and trends across India.",
            AgentType.WEATHER_ADVISOR: "You are WeatherAdvisor: Provide expert advice on weather patterns, forecasts, and climate impact on farming in India.",
            AgentType.CROP_DOCTOR: "You are CropDoctor: Provide expert advice on crop diseases, soil, and crop management for Indian agriculture.",
        }
        system_prompt = system_prompts.get(selected_agent, system_prompts[AgentType.CHAT_ASSISTANT])

        # Send the message to the selected expert agent
        message = await coordinator.route_message(
            Message(
                sender=AgentType.COORDINATOR,
                receiver=selected_agent,
                content={
                    "message": chat_input.message,
                    "model": chat_input.model,
                    "system_prompt": system_prompt
                },
                message_type="chat",
                context={
                    "session_id": session_id,
                    "language": chat_input.language
                }
            )
        )
        response_text = message.content if isinstance(message.content, str) else message.content.get("response", "(No response)")
        return ChatResponse(response=response_text, session_id=session_id, model_used=chat_input.model)


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
