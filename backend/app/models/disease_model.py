# backend/app/models/disease_model.py
from pydantic import BaseModel, Field

class DiseaseResponse(BaseModel):
    analysis: str = Field(..., description="The text analysis result from the AI model regarding potential diseases or pests.")
    filename: str = Field(..., description="The original filename of the uploaded image.")

    class Config:
        # Example for OpenAPI documentation generation
        schema_extra = {
            "example": {
                "analysis": "The image shows signs of Powdery Mildew. Symptoms include white, powdery spots on leaves. Suggested management: Improve air circulation and consider using approved fungicides.",
                "filename": "plant_image_01.jpg"
            }
        }