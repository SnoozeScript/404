from pydantic import BaseModel, Field
from typing import Optional, List, Dict

class YieldInput(BaseModel):
    crop: str
    area: float
    season: str
    state: str
    annual_rainfall: float
    fertilizer: float
    pesticide: float
    ph: float
    n: float  # Nitrogen
    p: float  # Phosphorus
    k: float  # Potassium
    organic_carbon: float
    
    # Location data
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = None
    
    # Legacy fields for backward compatibility
    crop_type: Optional[str] = None
    region: Optional[str] = None
    soil: Optional[str] = None
    weather: Optional[str] = None

class WeatherData(BaseModel):
    current_temp: float
    current_humidity: float
    current_conditions: str
    monthly_rainfall_estimate: float

class YieldPredictionResponse(BaseModel):
    success: bool = True
    yield_: float = Field(alias="yield")  # Using alias because 'yield' is a Python keyword
    estimated_production: float
    recommendations: List[str]
    weather_data: Optional[Dict] = None
    
    class Config:
        populate_by_name = True  # Allow populating model using both alias and field name