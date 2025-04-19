from google.generativeai import configure as genai_configure, GenerativeModel
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai_model = None
if GEMINI_API_KEY:
    try:
        genai_configure(api_key=GEMINI_API_KEY)
        genai_model = GenerativeModel('gemini-2.0-flash')
    except Exception as e:
        print(f"Failed to initialize Gemini: {str(e)}")

# In-memory conversation history per session (can be replaced with Redis, DB, etc.)
conversation_histories = {}

class ChatInput(BaseModel):
    message: str = Field(..., min_length=1, description="User's message to the chat assistant")
    session_id: Optional[str] = Field(None, description="Session ID for continuing conversations")
    language: Optional[str] = Field("en", description="Language code (en, hi, mr, etc.)")

class ChatResponse(BaseModel):
    response: str
    session_id: str
    model_used: str = "gemini-2.0-flash"
    history: list

@router.post("/message", response_model=ChatResponse, status_code=200)
async def chat_message(chat_input: ChatInput = Body(...)):
    """
    Multilingual Gemini chat endpoint using google-generativeai SDK.
    Stores and uses conversation history per session.
    """
    if not genai_model:
        raise HTTPException(status_code=500, detail="Gemini model not initialized")
    try:
        session_id = chat_input.session_id or str(uuid.uuid4())
        history = conversation_histories.get(session_id, [])
        # Add system prompt if first message
        if not history:
            history.append({
                'role': 'user',
                'parts': [{
                    'text': (
                        f"You are FarmGenius, a professional multilingual AI assistant for Indian agriculture. "
                        f"You ONLY answer questions related to farming, crops, weather, agri-markets, government schemes, or rural livelihoods. "
                        f"If a question is not about agriculture, politely refuse and ask the user to ask a farming-related question.\n"
                        f"Always answer in the user's selected language: {chat_input.language}. "
                        f"Never answer in English unless the user selected English.\n"
                        f"Be friendly, clear, and provide detailed, actionable advice for Indian farmers."
                    )
                }]
            })
        # Add user message
        history.append({'role': 'user', 'parts': [{'text': chat_input.message}]})
        # Start chat and get response
        chat_session = genai_model.start_chat(history=history)
        response = chat_session.send_message(chat_input.message)
        ai_response = response.text
        # Add AI response to history
        history.append({'role': 'model', 'parts': [{'text': ai_response}]})
        conversation_histories[session_id] = history
        return ChatResponse(
            response=ai_response,
            session_id=session_id,
            model_used="gemini-2.0-flash",
            history=history
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini error: {str(e)}")
