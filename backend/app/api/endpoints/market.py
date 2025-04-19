from fastapi import APIRouter, HTTPException, Depends
from app.core.ai_services import get_market_summary_ai
from app.services.market_scraper import get_all_prices, get_scraper
from app.core.multi_agent import AgentType, Message, coordinator, context_protocol
import uuid
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

router = APIRouter()

# Pydantic model for market listings
class MarketListing(BaseModel):
    crop: str
    quantity: str  # e.g., "10 quintals"
    price_expected: int
    contact: str
    location: Optional[str] = "Baramati"
    notes: Optional[str] = None

@router.get("/prices", status_code=200)
async def get_market_prices(crop: Optional[str] = None, location: Optional[str] = None):
    """Returns market prices from scraped sources for crops in specified locations."""
    try:
        # Create a session ID for context tracking
        session_id = str(uuid.uuid4())
        
        # Set up request context
        context_protocol.set_context(session_id, {
            "request_type": "market_prices",
            "crop": crop,
            "location": location or "Baramati"
        })
        
        # Send message to market agent
        message = await coordinator.route_message(
            Message(
                sender=AgentType.COORDINATOR,
                receiver=AgentType.MARKET_ANALYZER,
                content={
                    "crop": crop,
                    "location": location or "Baramati",
                    "force_refresh": True  # Always get fresh data for API calls
                },
                message_type="get_prices",
                context={"session_id": session_id}
            )
        )
        
        if not message or "error" in message.content:
            error = message.content.get("error", "Unknown error fetching prices") if message else "No response from market agent"
            raise HTTPException(status_code=500, detail=error)
            
        return {"market_data": message.content.get("prices", [])}
        
    except Exception as e:
        print(f"Error fetching market prices: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/summary", status_code=200)
async def get_market_summary():
    """Generates a brief AI summary of current market data using multi-agent system."""
    try:
        # Create a session ID for context tracking
        session_id = str(uuid.uuid4())
        context_protocol.set_context(session_id, {"request_type": "market_summary"})
        
        # Send message to market agent
        message = await coordinator.route_message(
            Message(
                sender=AgentType.COORDINATOR,
                receiver=AgentType.MARKET_ANALYZER,
                content={},
                message_type="get_summary",
                context={"session_id": session_id}
            )
        )
        
        if not message or "error" in message.content:
            error = message.content.get("error", "Unknown error generating summary") if message else "No response from market agent"
            raise HTTPException(status_code=500, detail=error)
            
        return {"summary": message.content.get("summary", "No market summary available")}
        
    except Exception as e:
        print(f"Error getting market summary: {e}")
        raise HTTPException(status_code=500, detail=f"Could not generate market summary: {str(e)}")

@router.post("/listings", status_code=201)
async def add_market_listing(listing: MarketListing):
    """Allows farmers to create market listings for their crops."""
    try:
        # Create a unique ID for the listing
        new_id = str(uuid.uuid4())[:8]  # Use first 8 chars of UUID for readability
        
        # Create a session ID for context tracking
        session_id = str(uuid.uuid4())
        
        # Store the listing in context for now (in production, this would go to a database)
        listing_dict = listing.dict()
        listing_dict["id"] = new_id
        listing_dict["type"] = "User Listing"  # Differentiate from mandi prices
        
        # Store in context (in memory)
        context_protocol.set_context(f"listing_{new_id}", listing_dict)
        
        # In production, we could analyze the listing using the market agent
        # For example, we could check if the price is reasonable compared to market rates
        
        print(f"Received listing: {listing_dict}")
        return {
            "message": "Listing created successfully",
            "listing_id": new_id,
            "details": listing_dict
        }
        
    except Exception as e:
        print(f"Error creating market listing: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/trends/{crop}", status_code=200)
async def get_market_trends(crop: str):
    """Analyze market trends for a specific crop."""
    try:
        # Create a session ID for context tracking
        session_id = str(uuid.uuid4())
        context_protocol.set_context(session_id, {"request_type": "market_trends", "crop": crop})
        
        # Send message to market agent
        message = await coordinator.route_message(
            Message(
                sender=AgentType.COORDINATOR,
                receiver=AgentType.MARKET_ANALYZER,
                content={"crop": crop},
                message_type="analyze_trends",
                context={"session_id": session_id}
            )
        )
        
        if not message or "error" in message.content:
            error = message.content.get("error", "Unknown error analyzing trends") if message else "No response from market agent"
            raise HTTPException(status_code=500, detail=error)
            
        # Return both the trend message and the historical data
        return {
            "message": message.content.get("message", "No trend data available"),
            "historical_data": message.content.get("historical_data", [])
        }
        
    except Exception as e:
        print(f"Error analyzing market trends: {e}")
        raise HTTPException(status_code=500, detail=str(e))