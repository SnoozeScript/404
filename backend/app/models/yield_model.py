from pydantic import BaseModel
from typing import Optional # Use Optional for fields that might not be provided

class YieldInput(BaseModel):
    crop_type: str
    area: str # Could be like "2 acres" or "5 hectares"
    region: str # e.g., "Near Baramati MIDC", "Village Name"
    soil: Optional[str] = None # e.g., "Medium black", "Loamy"
    weather: Optional[str] = None # e.g., "Good monsoon predicted", "Recent heavy rain"

class YieldPredictionResponse(BaseModel):
    prediction_text: str
    # Potential future structured fields:
    # estimated_range_low: Optional[float] = None
    # estimated_range_high: Optional[float] = None
    # unit: Optional[str] = None # e.g., "quintals", "tonnes per acre"