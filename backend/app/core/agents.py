"""
Specialized agents for the FarmGenius multi-agent system.
Each agent is responsible for a specific domain of expertise.
"""
import asyncio
from typing import Dict, List, Any, Optional, Callable, Union
import logging
import json
import io
from PIL import Image
from datetime import datetime, timedelta
import random

from app.core.multi_agent import Agent, AgentType, Message, coordinator, context_protocol
from app.core.ai_services import (
    get_disease_prediction, 
    get_yield_estimate, 
    process_voice_command_ai, 
    get_market_summary_ai,
    gemini_vision_model,
    gemini_text_model
)
from app.services.market_scraper import get_all_prices, get_scraper
from app.core.config import get_settings

# Initialize settings
settings = get_settings()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DiseaseDetectorAgent(Agent):
    """Agent specializing in crop disease detection from images"""
    
    def __init__(self):
        super().__init__(AgentType.DISEASE_DETECTOR)
        self.register_handler("analyze_image", self.handle_analyze_image)
        self.register_handler("get_treatment", self.handle_get_treatment)
        
    async def handle_analyze_image(self, message: Message) -> Optional[Message]:
        """Analyze image to detect crop diseases"""
        try:
            # Extract image data from message
            image_bytes = message.content.get("image_bytes")
            if not image_bytes:
                return Message(
                    sender=self.agent_type,
                    receiver=message.sender,
                    content={"error": "No image data provided"},
                    message_type="error"
                )
                
            # Call AI service for disease detection
            result = await get_disease_prediction(image_bytes)
            
            # If needed, we could also request market info for treatment options
            if not result.startswith("Error:"):
                # Get context for additional processing if needed
                context_id = message.context.get("session_id") if message.context else None
                if context_id:
                    # Save disease detection result to context
                    context_protocol.update_context(context_id, {
                        "last_disease_detection": result
                    })
                    
                    # We could enhance this by asking the market agent for product prices
                    # if treatments are mentioned
            
            return Message(
                sender=self.agent_type,
                receiver=message.sender,
                content={"result": result},
                message_type="analysis_result",
                context=message.context
            )
                
        except Exception as e:
            logger.error(f"Error in disease detection: {e}")
            return Message(
                sender=self.agent_type,
                receiver=message.sender,
                content={"error": f"Error analyzing image: {str(e)}"},
                message_type="error"
            )
            
    async def handle_get_treatment(self, message: Message) -> Optional[Message]:
        """Get treatment recommendations for detected disease"""
        disease_name = message.content.get("disease_name")
        crop_type = message.content.get("crop_type", "unknown crop")
        
        # Use context if available
        context_id = message.context.get("session_id") if message.context else None
        language = "en"
        
        if context_id:
            context = context_protocol.get_context(context_id)
            if context:
                language = context.get("language", "en")
        
        # Generate treatment recommendation using Gemini
        try:
            prompt = f"""Provide organic and conventional treatment options for {disease_name} in {crop_type}. 
            Include locally available options common in Maharashtra, India. Keep it brief and practical."""
            
            result = await gemini_text_model(prompt)
            
            treatment = result
            
            return Message(
                sender=self.agent_type,
                receiver=message.sender,
                content={"treatment": treatment},
                message_type="treatment_recommendation",
                context=message.context
            )
                
        except Exception as e:
            logger.error(f"Error getting treatment recommendation: {e}")
            return Message(
                sender=self.agent_type,
                receiver=message.sender,
                content={"error": f"Error getting treatment recommendation: {str(e)}"},
                message_type="error"
            )

class YieldPredictorAgent(Agent):
    """Agent specializing in crop yield predictions"""
    
    def __init__(self):
        super().__init__(AgentType.YIELD_PREDICTOR)
        self.register_handler("predict_yield", self.handle_predict_yield)
        
    async def handle_predict_yield(self, message: Message) -> Optional[Message]:
        """Generate yield prediction from farmer input"""
        try:
            # The content should contain the YieldInput model data
            yield_input = message.content.get("yield_input")
            if not yield_input:
                return Message(
                    sender=self.agent_type,
                    receiver=message.sender,
                    content={"error": "No yield input data provided"},
                    message_type="error"
                )
                
            # Call AI service for yield prediction
            result = await get_yield_estimate(yield_input)
            
            # Store the result in context if session_id is provided
            context_id = message.context.get("session_id") if message.context else None
            if context_id:
                context_protocol.update_context(context_id, {
                    "last_yield_prediction": {
                        "crop": yield_input.crop_type,
                        "area": yield_input.area_size,
                        "prediction": result
                    }
                })
            
            return Message(
                sender=self.agent_type,
                receiver=message.sender,
                content={"result": result},
                message_type="prediction_result",
                context=message.context
            )
                
        except Exception as e:
            logger.error(f"Error in yield prediction: {e}")
            return Message(
                sender=self.agent_type,
                receiver=message.sender,
                content={"error": f"Error making yield prediction: {str(e)}"},
                message_type="error"
            )

class MarketAnalyzerAgent(Agent):
    """Agent specializing in market data analysis and price tracking"""
    
    def __init__(self):
        super().__init__(AgentType.MARKET_ANALYZER)
        self.register_handler("get_prices", self.handle_get_prices)
        self.register_handler("analyze_trends", self.handle_analyze_trends)
        self.register_handler("get_summary", self.handle_get_summary)
        self.last_update = None
        self.cached_prices = []
        
    async def handle_get_prices(self, message: Message) -> Optional[Message]:
        """Get current market prices for crops"""
        try:
            # Check if specific crop is requested
            crop = message.content.get("crop")
            location = message.content.get("location", "Baramati")
            force_refresh = message.content.get("force_refresh", False)
            
            # Get live prices using the scraper
            if crop:
                # Get specific crop prices
                scraper = get_scraper("agmarknet")
                prices = await scraper.get_prices(crop, district=location)
            else:
                # Get all prices (potentially from cache)
                if not self.cached_prices or force_refresh:
                    self.cached_prices = await get_all_prices()
                    self.last_update = asyncio.get_event_loop().time()
                    
                prices = self.cached_prices
            
            # Store the result in context if session_id is provided
            context_id = message.context.get("session_id") if message.context else None
            if context_id:
                context_protocol.update_context(context_id, {
                    "last_market_query": {
                        "crop": crop,
                        "location": location,
                        "prices": prices
                    }
                })
            
            return Message(
                sender=self.agent_type,
                receiver=message.sender,
                content={"prices": prices},
                message_type="price_data",
                context=message.context
            )
                
        except Exception as e:
            logger.error(f"Error getting market prices: {e}")
            return Message(
                sender=self.agent_type,
                receiver=message.sender,
                content={"error": f"Error getting market prices: {str(e)}"},
                message_type="error"
            )
    
    async def handle_analyze_trends(self, message: Message) -> Optional[Message]:
        """Analyze market trends for specific crops (Simulated)"""
        try:
            crop = message.content.get("crop", "unknown crop")
            logger.info(f"Generating simulated trend analysis for: {crop}")

            # Simulate fetching historical data (replace with real data later)
            # Generate some plausible fake historical prices for the last 30 days
            today = datetime.now()
            historical_prices = []
            base_price = random.randint(1500, 5000) # Base price for the crop
            for i in range(30, 0, -1):
                date = (today - timedelta(days=i)).strftime("%Y-%m-%d")
                # Simulate price fluctuation around the base price with a slight upward trend
                price_fluctuation = random.uniform(-0.05, 0.07) # +/- 5-7% fluctuation
                price = base_price * (1 + price_fluctuation + (0.001 * (30-i))) # Slight upward trend factor
                price = round(price, 2)
                historical_prices.append({"date": date, "price": price})
                base_price = price # Next day's price starts from previous day

            # Generate a simple trend summary based on simulated data
            start_price = historical_prices[0]["price"]
            end_price = historical_prices[-1]["price"]
            trend_percentage = ((end_price - start_price) / start_price) * 100
            
            if trend_percentage > 5:
                trend_summary = f"Prices for {crop} have shown a noticeable upward trend over the past month (approx. {trend_percentage:.1f}% increase)."
            elif trend_percentage < -5:
                trend_summary = f"Prices for {crop} have shown a noticeable downward trend over the past month (approx. {trend_percentage:.1f}% decrease)."
            else:
                trend_summary = f"Prices for {crop} have remained relatively stable over the past month (change of {trend_percentage:.1f}%)."

            # Store result in context if needed
            context_id = message.context.get("session_id") if message.context else None
            if context_id:
                context_protocol.update_context(context_id, {
                    f"trend_analysis_{crop}": {
                        "summary": trend_summary,
                        "historical_data": historical_prices # Include historical data for potential future use (e.g., charting)
                    }
                })

            return Message(
                sender=self.agent_type,
                receiver=message.sender,
                content={
                    "message": trend_summary, 
                    "historical_data": historical_prices # Optionally return historical data too
                },
                message_type="trend_analysis_result",
                context=message.context
            )

        except Exception as e:
            logger.error(f"Error generating simulated trends for {crop}: {e}")
            return Message(
                sender=self.agent_type,
                receiver=message.sender,
                content={"error": f"Error analyzing trends for {crop}: {str(e)}"},
                message_type="error"
            )
    
    async def handle_get_summary(self, message: Message) -> Optional[Message]:
        """Get a summary of current market conditions"""
        try:
            # Ensure we have fresh prices
            if not self.cached_prices:
                self.cached_prices = await get_all_prices()
                self.last_update = asyncio.get_event_loop().time()
                
            # Get AI-generated summary
            summary = await get_market_summary_ai(self.cached_prices)
            
            return Message(
                sender=self.agent_type,
                receiver=message.sender,
                content={"summary": summary},
                message_type="market_summary",
                context=message.context
            )
                
        except Exception as e:
            logger.error(f"Error getting market summary: {e}")
            return Message(
                sender=self.agent_type,
                receiver=message.sender,
                content={"error": f"Error getting market summary: {str(e)}"},
                message_type="error"
            )

class VoiceAssistantAgent(Agent):
    """Agent specializing in voice interaction and language processing"""
    
    def __init__(self):
        super().__init__(AgentType.VOICE_ASSISTANT)
        self.register_handler("process_command", self.handle_process_command)
        self.register_handler("text_to_speech", self.handle_text_to_speech)
        
        # Supported languages
        self.languages = {
            "en": "English",
            "hi": "Hindi",
            "mr": "Marathi"
        }
        
    async def handle_process_command(self, message: Message) -> Optional[Message]:
        """Process voice command transcripts"""
        try:
            transcript = message.content.get("transcript")
            if not transcript:
                return Message(
                    sender=self.agent_type,
                    receiver=message.sender,
                    content={"error": "No transcript provided"},
                    message_type="error"
                )
                
            # Get language preference from context if available
            context_id = message.context.get("session_id") if message.context else None
            language = "en"  # Default to English
            
            if context_id:
                context = context_protocol.get_context(context_id)
                if context:
                    language = context.get("language", "en")
            
            # Call AI service to process the voice command
            result = await process_voice_command_ai(transcript, language)
            
            # Analyze the command to determine if we need to route to other agents
            # For a sophisticated implementation, we could use an intent classifier here
            
            # Simple keyword-based routing for demo purposes
            should_route = False
            target_agent = None
            
            if any(word in transcript.lower() for word in ["disease", "infection", "spots", "leaf", "analyze"]):
                # This is likely a disease-related question
                should_route = True
                target_agent = AgentType.DISEASE_DETECTOR
                # We'd need image data for a real analysis though
                
            elif any(word in transcript.lower() for word in ["yield", "harvest", "production", "how much"]):
                # This is likely a yield prediction question
                should_route = True
                target_agent = AgentType.YIELD_PREDICTOR
                
            elif any(word in transcript.lower() for word in ["price", "market", "sell", "cost", "mandi"]):
                # This is likely a market-related question
                should_route = True
                target_agent = AgentType.MARKET_ANALYZER
                
                # Extract crop name if present
                # This is simplified - would need better NLP in production
                common_crops = ["wheat", "onion", "soybean", "sugarcane", "rice", "cotton"]
                crop = next((crop for crop in common_crops if crop in transcript.lower()), None)
                
                if crop and target_agent == AgentType.MARKET_ANALYZER:
                    # Route to market agent asking for specific crop price
                    market_response = await self.send_message(
                        receiver=AgentType.MARKET_ANALYZER,
                        content={"crop": crop},
                        message_type="get_prices",
                        context=message.context
                    )
                    
                    if market_response:
                        # Format the market response nicely for voice
                        prices = market_response.content.get("prices", [])
                        if prices:
                            price_texts = []
                            for price in prices:
                                if "price_per_quintal" in price:
                                    price_texts.append(f"{price['crop']} is {price['price_per_quintal']} rupees per quintal")
                                elif "price_per_tonne" in price:
                                    price_texts.append(f"{price['crop']} is {price['price_per_tonne']} rupees per tonne")
                            
                            if price_texts:
                                result = f"Here are the current prices: {', '.join(price_texts)}"
            
            return Message(
                sender=self.agent_type,
                receiver=message.sender,
                content={
                    "response": result,
                    "should_route": should_route,
                    "target_agent": target_agent.value if target_agent else None
                },
                message_type="voice_response",
                context=message.context
            )
                
        except Exception as e:
            logger.error(f"Error processing voice command: {e}")
            return Message(
                sender=self.agent_type,
                receiver=message.sender,
                content={"error": f"Error processing voice command: {str(e)}"},
                message_type="error"
            )
    
    async def handle_text_to_speech(self, message: Message) -> Optional[Message]:
        """Generate text-to-speech audio (mock implementation)"""
        text = message.content.get("text")
        if not text:
            return Message(
                sender=self.agent_type,
                receiver=message.sender,
                content={"error": "No text provided for speech synthesis"},
                message_type="error"
            )
            
        # Get language preference from context if available
        context_id = message.context.get("session_id") if message.context else None
        language = "en"  # Default to English
        
        if context_id:
            context = context_protocol.get_context(context_id)
            if context:
                language = context.get("language", "en")
        
        # In a real implementation, this would call a TTS service
        # For the hackathon, we'll return a mock response
        return Message(
            sender=self.agent_type,
            receiver=message.sender,
            content={
                "message": f"Text-to-speech synthesis would happen here in {self.languages.get(language, 'English')}"
            },
            message_type="tts_response",
            context=message.context
        )

class TranslatorAgent(Agent):
    """Agent specializing in language translation for multilingual support"""
    
    def __init__(self):
        super().__init__(AgentType.TRANSLATOR)
        self.register_handler("translate", self.handle_translate)
        
        # Supported languages
        self.languages = {
            "en": "English",
            "hi": "Hindi",
            "mr": "Marathi"
        }
        
    async def handle_translate(self, message: Message) -> Optional[Message]:
        """Translate text between languages"""
        try:
            text = message.content.get("text")
            target_language = message.content.get("target_language", "en")
            source_language = message.content.get("source_language")
            
            if not text:
                return Message(
                    sender=self.agent_type,
                    receiver=message.sender,
                    content={"error": "No text provided for translation"},
                    message_type="error"
                )
            
            # Validate language codes
            if target_language not in self.languages:
                return Message(
                    sender=self.agent_type,
                    receiver=message.sender,
                    content={"error": f"Unsupported target language: {target_language}"},
                    message_type="error"
                )
            
            # Use Gemini for translation
            try:
                source_lang_name = self.languages.get(source_language, "the source language")
                target_lang_name = self.languages.get(target_language, "English")
                
                prompt = f"""Translate the following text from {source_lang_name} to {target_lang_name}.
                Only return the translated text, nothing else.
                
                Text to translate: {text}"""
                
                result = await gemini_text_model(prompt)
                
                translated_text = result
                
                return Message(
                    sender=self.agent_type,
                    receiver=message.sender,
                    content={"translated_text": translated_text},
                    message_type="translation_result",
                    context=message.context
                )
                    
            except Exception as e:
                logger.error(f"Error in translation: {e}")
                return Message(
                    sender=self.agent_type,
                    receiver=message.sender,
                    content={"error": f"Error in translation: {str(e)}"},
                    message_type="error"
                )
                
        except Exception as e:
            logger.error(f"Error in translation: {e}")
            return Message(
                sender=self.agent_type,
                receiver=message.sender,
                content={"error": f"Error in translation: {str(e)}"},
                message_type="error"
            )

# Initialize all agents
def init_agents():
    """Initialize and register all specialized agents"""
    disease_agent = DiseaseDetectorAgent()
    coordinator.register_agent(disease_agent)
    
    yield_agent = YieldPredictorAgent()
    coordinator.register_agent(yield_agent)
    
    market_agent = MarketAnalyzerAgent()
    coordinator.register_agent(market_agent)
    
    voice_agent = VoiceAssistantAgent()
    coordinator.register_agent(voice_agent)
    
    translator_agent = TranslatorAgent()
    coordinator.register_agent(translator_agent)
    
    return coordinator
