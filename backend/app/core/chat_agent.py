"""
General-purpose AI Chat Agent for FarmGenius
This module provides a sophisticated chat agent that can engage in general conversations
while having specialized knowledge about agriculture.
"""
import logging
from typing import Dict, List, Any, Optional
import json
import asyncio

from app.core.config import get_settings
from app.core.multi_agent import Agent, AgentType, Message, coordinator, context_protocol
import google.generativeai as genai

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load settings
settings = get_settings()

class ChatAgent(Agent):
    """
    General-purpose AI chat agent that can have extended conversations
    with users about any topic, with specialized knowledge about agriculture.
    """
    
    def __init__(self):
        super().__init__(AgentType.CHAT_ASSISTANT)
        self.register_handler("chat", self.handle_chat)
        self.register_handler("stream_chat", self.handle_stream_chat)
        
        # Initialize AI models
        self._init_ai_models()
        
        # System prompts
        self.general_system_prompt = """You are FarmGenius, an advanced AI assistant specialized in helping farmers across India.
You have extensive knowledge about:
- Crop cultivation techniques for all regions of India
- Pest and disease management for various climatic zones
- Weather patterns and climate adaptation across different Indian states
- Agricultural market trends throughout India's major agricultural markets
- Sustainable farming practices suited to diverse Indian conditions
- Knowledge of agriculture across different states of India including crop varieties, local practices and market information

While you specialize in agricultural topics, you can also have general conversations
and answer questions on other topics. Always be helpful, accurate, and respectful.
Provide practical, actionable advice when possible.

When you don't know something, admit it clearly rather than making up information.
"""
        
    def _init_ai_models(self):
        """Initialize the AI models for chat"""
        # Gemini setup - using only Gemini as requested
        if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "YOUR_GEMINI_API_KEY_NOT_SET":
            try:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                # Using Gemini 1.5 Pro for more capabilities and context window
                self.gemini_model = genai.GenerativeModel('gemini-1.5-pro')
                logger.info("Gemini chat model initialized successfully")
            except Exception as e:
                logger.error(f"Error initializing Gemini model: {e}")
                self.gemini_model = None
        else:
            logger.warning("Gemini API key not configured, chat will not be available")
            self.gemini_model = None
    
    async def handle_chat(self, message: Message) -> Optional[Message]:
        """
        Handle a chat message from the user and generate a response
        """
        try:
            # Extract message content and context
            user_message = message.content.get("message", "")
            if not user_message:
                return Message(
                    sender=self.agent_type,
                    receiver=message.sender,
                    content={"error": "No message provided"},
                    message_type="error"
                )
            
            # Get session ID from context
            session_id = message.context.get("session_id") if message.context else None
            if not session_id:
                logger.warning("No session ID provided for chat")
                session_id = "default_session"
            
            # Get chat history from context
            chat_history = await self._get_chat_history(session_id)
            
            # Always use Gemini as requested
            if self.gemini_model:
                response = await self._chat_with_gemini(user_message, chat_history)
            else:
                return Message(
                    sender=self.agent_type,
                    receiver=message.sender,
                    content={"error": "Gemini model is not available for chat"},
                    message_type="error"
                )
            
            # Update chat history in context
            await self._update_chat_history(session_id, user_message, response)
            
            return Message(
                sender=self.agent_type,
                receiver=message.sender,
                content={"response": response},
                message_type="chat_response",
                context=message.context
            )
                
        except Exception as e:
            logger.error(f"Error in chat handler: {e}")
            return Message(
                sender=self.agent_type,
                receiver=message.sender,
                content={"error": f"Error processing chat: {str(e)}"},
                message_type="error"
            )
    
    async def handle_stream_chat(self, message: Message) -> Optional[Message]:
        """
        Handle a streaming chat message from the user
        """
        # This is just a placeholder - in a real implementation
        # this would use the streaming capabilities of Gemini
        return await self.handle_chat(message)
    
    async def _chat_with_gemini(self, user_message: str, chat_history: List[Dict[str, Any]]) -> str:
        """Generate a response using Gemini model"""
        try:
            # Convert chat history to Gemini format
            gemini_chat = []
            for message in chat_history:
                role = "user" if message["role"] == "user" else "model"
                gemini_chat.append({"role": role, "parts": [message["content"]]})
            
            # Add the system prompt as a model message if there's no history
            if not gemini_chat:
                gemini_chat.append({"role": "model", "parts": [self.general_system_prompt]})
            
            # Add the new user message
            gemini_chat.append({"role": "user", "parts": [user_message]})
            
            # Generate response
            response = await self.gemini_model.generate_content_async(gemini_chat)
            return response.text
            
        except Exception as e:
            logger.error(f"Error generating Gemini response: {e}")
            return f"I'm having trouble processing that request with Gemini. Error: {str(e)}"
    

    
    async def _get_chat_history(self, session_id: str) -> List[Dict[str, Any]]:
        """Get chat history from context"""
        chat_history_key = f"chat_history_{session_id}"
        chat_history = context_protocol.get_context(chat_history_key)
        return chat_history or []
    
    async def _update_chat_history(self, session_id: str, user_message: str, ai_response: str):
        """Update chat history in context"""
        chat_history_key = f"chat_history_{session_id}"
        chat_history = context_protocol.get_context(chat_history_key) or []
        
        # Add user message
        chat_history.append({
            "role": "user",
            "content": user_message,
            "timestamp": asyncio.get_event_loop().time()
        })
        
        # Add AI response
        chat_history.append({
            "role": "assistant",
            "content": ai_response,
            "timestamp": asyncio.get_event_loop().time()
        })
        
        # Limit history length to prevent context overflow
        # Keep the most recent 20 messages (10 exchanges)
        if len(chat_history) > 20:
            chat_history = chat_history[-20:]
        
        # Update context
        context_protocol.set_context(chat_history_key, chat_history)

# Function to create and register the chat agent
def init_chat_agent():
    """Initialize and register the chat agent"""
    chat_agent = ChatAgent()
    coordinator.register_agent(chat_agent)
    return chat_agent
