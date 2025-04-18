from fastapi import APIRouter, HTTPException
from app.core.ai_services import get_market_summary_ai # Import the new function

router = APIRouter()

# Using a simple in-memory list for mock data during the hackathon
# In a real app, this would come from a database or external source
mock_market_data = [
    {"id": 1, "crop": "Wheat (Gehu)", "price_per_quintal": 2350, "location": "Baramati Mandi", "date": "2025-04-17"},
    {"id": 2, "crop": "Onion (Kanda)", "price_per_quintal": 1400, "location": "Baramati Mandi", "date": "2025-04-17"},
    {"id": 3, "crop": "Soybean", "price_per_quintal": 4500, "location": "Baramati Mandi", "date": "2025-04-17"},
    {"id": 4, "crop": "Sugarcane (Oos)", "price_per_tonne": 3150, "location": "Factory Gate Rate (Approx)", "date": "2025-04-18"},
]

@router.get("/prices", status_code=200)
async def get_market_prices():
    """Returns mock market prices for common crops in Baramati."""
    return {"market_data": mock_market_data}

@router.get("/summary", status_code=200)
async def get_market_summary():
    """Generates a brief AI summary of the current mock market data."""
    try:
        summary = await get_market_summary_ai(mock_market_data)
        if summary.startswith("Error:"):
            raise HTTPException(status_code=503, detail=summary)
        return {"summary": summary}
    except Exception as e:
        print(f"Error getting market summary: {e}")
        raise HTTPException(status_code=500, detail="Could not generate market summary.")


# --- Placeholder for adding listings (Not fully implemented) ---
# from pydantic import BaseModel
# class MarketListing(BaseModel):
#     crop: str
#     quantity: str # e.g., "10 quintals"
#     price_expected: int
#     contact: str

# @router.post("/listings", status_code=201)
# async def add_market_listing(listing: MarketListing):
#     """Allows adding a mock listing (stores in memory for demo)."""
#     new_id = max([item.get('id', 0) for item in mock_market_data] + [0]) + 1
#     listing_dict = listing.dict()
#     listing_dict["id"] = new_id
#     listing_dict["type"] = "User Listing" # Differentiate from mandi prices
#     # In a real app, save to DB. Here, just add to list (won't persist server restarts)
#     # mock_market_data.append(listing_dict)
#     print(f"Received listing (not saved): {listing_dict}")
#     return {"message": "Listing received (demo only, not saved)", "listing_id": new_id}