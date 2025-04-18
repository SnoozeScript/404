import google.generativeai as genai
from groq import Groq, RateLimitError, APIError
from PIL import Image
import io
from typing import TYPE_CHECKING

# Import settings using the function
from .config import get_settings

# Conditional import for type hinting to avoid circular dependency issues
if TYPE_CHECKING:
    from app.models.yield_model import YieldInput

# Load settings
settings = get_settings()

# --- Configure APIs ---
try:
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "YOUR_GEMINI_API_KEY_NOT_SET":
        genai.configure(api_key=settings.GEMINI_API_KEY)
        # For image analysis (ensure you use a model supporting vision)
        gemini_vision_model = genai.GenerativeModel('gemini-1.5-flash') # Or 'gemini-pro-vision' etc.
        # For text generation if needed separately
        gemini_text_model = genai.GenerativeModel('gemini-1.5-flash') # Or 'gemini-pro'
    else:
        print("AI_SERVICES: Gemini API key not configured. Gemini features will not work.")
        gemini_vision_model = None
        gemini_text_model = None
except Exception as e:
    print(f"AI_SERVICES: Error configuring Gemini: {e}")
    gemini_vision_model = None
    gemini_text_model = None


try:
    if settings.GROQ_API_KEY and settings.GROQ_API_KEY != "YOUR_GROQ_API_KEY_NOT_SET":
        groq_client = Groq(api_key=settings.GROQ_API_KEY)
        # Specify model for Groq, e.g., Llama3 8b
        groq_chat_model_id = "llama3-8b-8192"
    else:
        print("AI_SERVICES: Groq API key not configured. Groq features will not work.")
        groq_client = None
except Exception as e:
    print(f"AI_SERVICES: Error configuring Groq: {e}")
    groq_client = None


# --- Disease Prediction Function ---
async def get_disease_prediction(image_bytes: bytes) -> str:
    """
    Analyzes an image using Gemini Vision model to detect crop diseases.
    """
    if not gemini_vision_model:
        return "Error: Gemini Vision model is not configured."

    try:
        img = Image.open(io.BytesIO(image_bytes))
        # Specific prompt for disease detection
        # Including location context might help if model supports it
        prompt = f"""Analyze the attached image of a plant leaf from the Baramati, Maharashtra region.
        Identify potential diseases or pests. Describe the visible symptoms clearly.
        Suggest 1-2 brief, practical, and sustainable management/treatment options suitable for a local farmer.
        If the image is unclear or not a plant, state that clearly.
        Format the response clearly, perhaps using bullet points for symptoms and suggestions.
        Respond in English.
        """

        # Generate content
        # Note: Check Gemini API documentation for latest recommended methods
        # Using generate_content which works for multimodal models
        response = gemini_vision_model.generate_content([prompt, img])

        # Check for safety ratings or blocks if necessary (depends on API version/config)
        # if response.prompt_feedback and response.prompt_feedback.block_reason:
        #     return f"Error: Content blocked due to {response.prompt_feedback.block_reason}"

        return response.text

    except Exception as e:
        print(f"Error in Gemini disease prediction: {e}")
        # Consider more specific error handling based on potential Gemini exceptions
        return f"Error analyzing image with Gemini: {str(e)}"


# --- Yield Prediction Function ---
async def get_yield_estimate(yield_input: 'YieldInput') -> str:
    """
    Generates a yield estimate using Groq based on farmer's input.
    """
    if not groq_client:
        return "Error: Groq client is not configured."

    try:
        # Include regional context in the prompt
        location_context = "Baramati, Maharashtra, India"
        prompt = f"""Act as an agricultural assistant for a farmer in {location_context}.
        Based on the following inputs:
        - Crop: {yield_input.crop_type}
        - Area: {yield_input.area}
        - Region Details: {yield_input.region} (within {location_context})
        - Soil Type: {yield_input.soil or 'Not specified'}
        - Recent/Expected Weather: {yield_input.weather or 'Not specified'}

        Provide a realistic estimated yield range (e.g., in quintals per acre or tonnes per hectare, specify the unit clearly).
        Briefly explain the key factors (like weather, soil, crop type in this region) influencing this estimate in 2-3 short bullet points.
        Keep the explanation simple and practical for a farmer.
        Respond in English.
        """

        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful agricultural assistant providing yield estimates for farmers in the Baramati region of Maharashtra, India."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model=groq_chat_model_id,
            temperature=0.6, # Adjust creativity/factuality
            max_tokens=150,
        )
        result = chat_completion.choices[0].message.content
        return result.strip()

    except RateLimitError:
        print("Error in Groq yield prediction: Rate limit exceeded.")
        return "Error: The prediction service is currently busy. Please try again later."
    except APIError as e:
        print(f"Error in Groq yield prediction: {e}")
        return f"Error communicating with prediction service: {str(e)}"
    except Exception as e:
        print(f"Unexpected error in Groq yield prediction: {e}")
        return f"An unexpected error occurred while generating the yield estimate: {str(e)}"


# --- Voice Command Processing Function ---
async def process_voice_command_ai(transcript: str, language: str = "en") -> str:
    """
    Processes a voice transcript using Groq to understand intent and generate a response.
    """
    if not groq_client:
        return "Error: Groq client is not configured."

    # Basic language code mapping (expand as needed)
    lang_map = {"en": "English", "hi": "Hindi", "mr": "Marathi"}
    language_name = lang_map.get(language, "English") # Default to English if code unknown

    # Context about the app's capabilities
    app_capabilities = """
    The FarmGenius app can:
    1. Analyze an uploaded image of a plant to detect diseases (triggered by asking about the 'last image' or 'this picture').
    2. Predict crop yield based on inputs like crop type, area, region, soil, weather.
    3. Provide mock information about local market prices for crops like Wheat and Onion in Baramati.
    """

    try:
        prompt = f"""You are the voice interface for the FarmGenius agricultural app, assisting a farmer in Baramati, Maharashtra.
        The user, speaking {language_name}, said: "{transcript}"

        App Capabilities:
        {app_capabilities}

        Your tasks:
        1. Understand the user's intent based on their statement. Does the user want to:
            - Get analysis of the last uploaded image?
            - Ask for a yield prediction (they might mention crop, area etc.)?
            - Ask about market prices (they might mention crop names)?
            - Something else (greet, ask for help)?
        2. Generate a concise and helpful response **in {language_name}**.
        3. If the intent is clear and relates to an app capability:
            - For image analysis: Respond like "Okay, analyzing the last uploaded image..." or ask for the image if needed. (The actual analysis happens separately).
            - For yield prediction: If they provided details, acknowledge them. If not, ask for necessary details like crop type, area, etc.
            - For market prices: Provide the mock data if they ask for Wheat/Onion prices in Baramati, otherwise state which prices are available.
        4. If the intent is unclear or unrelated to app capabilities, politely state what the app can do or ask for clarification.
        5. Keep the response relatively short and easy to understand for a voice interaction.
        """

        chat_completion = groq_client.chat.completions.create(
            messages=[
                 {
                    "role": "system",
                    "content": f"You are the FarmGenius voice assistant for farmers in Baramati. Respond concisely in {language_name}."
                },
                {
                    "role": "user",
                    "content": prompt
                 }
            ],
            model=groq_chat_model_id,
            temperature=0.7,
            max_tokens=100,
        )
        result = chat_completion.choices[0].message.content
        return result.strip()

    except RateLimitError:
        print("Error in Groq voice processing: Rate limit exceeded.")
        # Provide response in the requested language if possible, otherwise English
        error_msg = "Seva abhi vyast hai, kripya baad mein prayas karen." if language == "hi" else \
                    "Seva sadhya vyasta आहे, कृपया नंतर प्रयत्न करा." if language == "mr" else \
                    "The service is currently busy. Please try again later."
        return error_msg
    except APIError as e:
        print(f"Error in Groq voice processing: {e}")
        error_msg = f"Seva se sampark karne mein truti: {str(e)}" if language == "hi" else \
                    f"Seveshi sampark karnyat truti: {str(e)}" if language == "mr" else \
                    f"Error communicating with the service: {str(e)}"
        return error_msg
    except Exception as e:
        print(f"Unexpected error in Groq voice processing: {e}")
        error_msg = f"Ek anapekshit truti aayi: {str(e)}" if language == "hi" else \
                    f"Ek anapekshit truti aali: {str(e)}" if language == "mr" else \
                    f"An unexpected error occurred: {str(e)}"
        return error_msg

# --- (Optional) Market Data AI Summary ---
async def get_market_summary_ai(market_data: list) -> str:
    """
    Generates a brief summary of market data using Groq.
    """
    if not groq_client:
         return "Error: Groq client is not configured."
    if not market_data:
        return "No market data available to summarize."

    try:
        data_string = "\n".join([f"- {item['crop']}: {item['price_per_quintal']} INR/quintal at {item['location']}" for item in market_data])

        prompt = f"""Here is some recent market data from Baramati Mandi:
        {data_string}

        Provide a very brief (1-2 sentence) summary highlighting any notable price points or trends based ONLY on this data.
        Respond in English.
        """
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {"role": "user", "content": prompt}
            ],
            model=groq_chat_model_id,
            temperature=0.5,
            max_tokens=60,
        )
        result = chat_completion.choices[0].message.content
        return result.strip()

    except Exception as e:
        print(f"Error generating market summary: {e}")
        return "Could not generate market summary."