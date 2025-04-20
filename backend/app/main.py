from fastapi import FastAPI
from app.api.api import api_router # Import the main router
from app.core.config import get_settings
import asyncio

# Import multi-agent system
from app.core.multi_agent import coordinator, context_protocol
from app.core.agents import init_agents
from app.core.chat_agent import init_chat_agent

# --- CORS ---
# Allow frontend to call backend (important for development)
# pip install fastapi[all] includes 'python-multipart' and 'cors' support
# Or pip install python-multipart uvicorn[standard] fastapi starlette aiofiles Jinja2 itsdangerous pyyaml email_validator
# pip install starlette httpx==0.23.0 # Example specific version if needed
from fastapi.middleware.cors import CORSMiddleware


settings = get_settings() # Load settings

app = FastAPI(
    title=settings.PROJECT_NAME, # Use title from settings
    description="AI Assistant for Sustainable Agriculture (Baramati Focus)",
    version="0.1.0"
    # You can add more metadata here like contact info, license
)

# --- CORS Middleware ---
# Adjust origins as needed. "*" is insecure for production.
# For development, allow your Vite dev server origin (usually http://localhost:5173)
origins = [
    "http://localhost:5173", # Default Vite React dev server
    "http://localhost:3000", # Common React dev server port
    "http://127.0.0.1:5173",
    "http://localhost:5182",
    # Production frontend URL
    "https://404-snowy.vercel.app",
    # Add other origins if needed (e.g., deployed frontend URL)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods (GET, POST, etc.)
    allow_headers=["*"], # Allows all headers
)


# Include the main API router with a prefix (e.g., /api/v1)
app.include_router(api_router, prefix="/api/v1")

# Simple root endpoint
@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Welcome to the FarmGenius API!"}

# Health endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok"}

# Add startup/shutdown events if needed later
@app.on_event("startup")
async def startup_event():
    # This is a good place to check API key configuration again
    print("Starting up FarmGenius API...")
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "YOUR_GEMINI_API_KEY_NOT_SET":
        print("STARTUP WARNING: Gemini API key is not configured!")
    if not settings.GROQ_API_KEY or settings.GROQ_API_KEY == "YOUR_GROQ_API_KEY_NOT_SET":
        print("STARTUP WARNING: Groq API key is not configured!")
    print(f"CORS allowed origins: {origins}")
    
    # Initialize the multi-agent system
    print("Initializing multi-agent system...")
    coord = init_agents()
    await coord.start()
    
    # Initialize the chat agent
    print("Initializing AI chat assistant...")
    chat_agent = init_chat_agent()
    print("AI chat assistant initialized")
    
    print("Multi-agent system initialized")
    
    # Set up global context with supported languages
    context_protocol.set_context("supported_languages", {
        "en": "English",
        "hi": "Hindi",
        "mr": "Marathi"
    })

# @app.on_event("shutdown")
# async def shutdown_event():
#     print("Shutting down FarmGenius API...")

# Running with uvicorn from command line is standard:
# uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000