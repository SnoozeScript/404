from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import pickle
import pandas as pd
import numpy as np
from typing import List, Optional, Dict, Any
import os
import json
import difflib

# Get absolute paths
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(script_dir))
models_dir = os.path.join(project_root, 'models')
data_dir = os.path.join(project_root, 'data')
# Load the trained model
model_path = os.path.join(models_dir, 'model.pkl')
print(f"Loading model from {model_path}")
with open(model_path, "rb") as f:
    model = pickle.load(f)
    
# Load model metadata to get features
meta_path = os.path.join(models_dir, 'model_meta.pkl')
with open(meta_path, "rb") as f:
    model_meta = pickle.load(f)
    
model_features = model_meta['features']
print(f"Model features: {model_features}")

# Load system costs data for recommendations
system_costs_path = os.path.join(data_dir, 'system_costs.csv')
system_costs = pd.read_csv(system_costs_path)

# Load soil pH ranges for crop compatibility
soil_ph_path = os.path.join(data_dir, 'soil_ph_ranges.json')
with open(soil_ph_path, 'r', encoding='utf-8') as f:
    soil_data = json.load(f)

# Load crop prices data
prices_path = os.path.join(data_dir, 'agmarknet_prices.csv')
prices_data = pd.read_csv(prices_path)
print("Price data columns:", prices_data.columns.tolist())

# Load subsidies data
subsidies_path = os.path.join(data_dir, 'subsidies.json')
try:
    with open(subsidies_path, 'r', encoding='utf-8') as f:
        subsidies_data = json.load(f)
    print(f"Successfully loaded {len(subsidies_data)} subsidy records")
except Exception as e:
    print(f"Error loading subsidies: {e}")
    subsidies_data = []

# Initialize the APIRouter
router = APIRouter()

# Input schema
class RecommendationRequest(BaseModel):
    plot_size: float
    budget: float
    district: Optional[str] = "Kolhapur"
    soil_type: Optional[str] = "loam"
    soil_ph: Optional[float] = 6.5
    water_source: Optional[str] = "well"
    sunlight_hours: Optional[int] = 6
    preferred_crops: Optional[List[str]] = None
    preferred_systems: Optional[List[str]] = None
    risk_appetite: Optional[int] = 5
    labor_availability: Optional[int] = 5
    state: Optional[str] = "Maharashtra"

# Subsidy schema
class Subsidy(BaseModel):
    name: str
    subsidy_pct: float
    max_cap: Optional[float] = None
    eligibility: Optional[str] = None
    apply_url: Optional[str] = None
    category: Optional[str] = None
    state: Optional[str] = None

# Market price schema
class MarketPrice(BaseModel):
    location: str
    price_per_quintal: float
    date: str

# Response models
class SystemRecommendation(BaseModel):
    system: str
    category: str
    expected_roi_percent: float
    setup_cost_total: float
    monthly_cost: float
    payback_period_months: int
    suitable_crops: List[str]
    water_usage_per_day: float
    electricity_usage_per_day: float
    market_prices: Optional[List[Dict[str, Any]]] = None
    subsidies: Optional[List[Dict[str, Any]]] = None
    compatibility_score: float

class RecommendationResponse(BaseModel):
    success: bool
    recommendations: List[SystemRecommendation]
    crop_suggestions: List[str]
    message: str

# Filter systems by plot size and budget
def filter_suitable_systems(data: RecommendationRequest):
    size_filtered = system_costs[
        (system_costs['min_area_sqft'] <= data.plot_size) & 
        (system_costs['max_area_sqft'] >= data.plot_size)
    ]
    
    budget_filtered = size_filtered[
        (size_filtered['capex_per_sqft'] * data.plot_size <= data.budget * 1.2)
    ]
    
    if len(budget_filtered) == 0:
        print("No systems matched constraints. Returning most affordable options.")
        return system_costs.sort_values('capex_per_sqft').head(3)
    
    return budget_filtered

# Get crop suggestions
def get_crop_recommendations(system_type: str, soil_type: str, soil_ph: float):
    system_row = system_costs[system_costs['system'] == system_type]
    if len(system_row) == 0:
        return []
        
    system_crops = [crop.strip() for crop in system_row.iloc[0]['suitable_crops'].split(',')]
    compatible_crops = []

    for crop_data in soil_data['crops']:
        crop_name = crop_data['name']
        if crop_name not in system_crops:
            continue
        
        if soil_type in crop_data['soil_types']:
            min_ph = crop_data['optimal_ph_range']['min']
            max_ph = crop_data['optimal_ph_range']['max']
            if min_ph <= soil_ph <= max_ph:
                compatible_crops.append(crop_name)
    
    return compatible_crops

# Helper function to get top subsidies - IMPROVED
def get_top_subsidies(state):
    """Get subsidies applicable to the user's state"""
    if not subsidies_data:
        print("No subsidies data available")
        return []
        
    # Filter by state (case insensitive) - include national/general subsidies too
    state_subsidies = []
    state_lower = state.strip().lower()
    
    for subsidy in subsidies_data:
        subsidy_state = subsidy.get('state', '').strip().lower()
        # Include if subsidy is for this state, or is national (empty/null state)
        if not subsidy_state or subsidy_state == 'all' or subsidy_state == state_lower:
            state_subsidies.append(subsidy)
    
    print(f"Found {len(state_subsidies)} subsidies applicable for {state}")
    
    # Sort by subsidy percentage (descending), fallback to 0 if missing
    sorted_subsidies = sorted(
        state_subsidies,
        key=lambda s: s.get('subsidy_pct', 0),
        reverse=True
    )
    
    return sorted_subsidies

# Match subsidies specific to farming system - IMPROVED
def match_subsidies_for_system(system_name, category, subsidies):
    """Match subsidies specifically relevant to this farming system"""
    if not subsidies:
        return []
        
    system_name_std = system_name.strip().lower()
    category_std = category.strip().lower()
    
    # Keywords for each farming system type
    system_keywords = {
        'hydroponics': ['hydroponics', 'hydroponic', 'soilless', 'nft', 'dwc', 'water culture'],
        'aquaponics': ['aquaponics', 'aquaponic', 'fish', 'aquaculture'],
        'microgreens': ['microgreens', 'micro greens', 'sprout', 'seedling'],
        'vertical': ['vertical', 'tower', 'garden tower'],
        'greenhouse': ['greenhouse', 'protected cultivation', 'polyhouse', 'shadenet'],
        'aeroponics': ['aeroponics', 'aeroponic', 'mist', 'fog'],
        'organic': ['organic', 'natural farming', 'jaivik']
    }
    
    # Determine which keyword sets apply to this system
    applicable_keywords = []
    for key, keywords in system_keywords.items():
        if key in system_name_std or key in category_std:
            applicable_keywords.extend(keywords)
    
    # Also add system name and category words as keywords
    system_words = system_name_std.split() + category_std.split()
    applicable_keywords.extend(system_words)
    
    # For exact matches (high relevance)
    exact_matches = []
    # For partial/keyword matches (medium relevance)
    partial_matches = []
    # For general agriculture subsidies (low relevance)
    general_matches = []
    
    for subsidy in subsidies:
        subsidy_name = subsidy.get('name', '').strip().lower()
        subsidy_category = subsidy.get('category', '').strip().lower()
        subsidy_description = subsidy.get('description', '').strip().lower()
        
        # Check various fields for matches
        text_to_check = f"{subsidy_name} {subsidy_category} {subsidy_description}"
        
        # Check for exact system/category match
        if system_name_std in text_to_check or category_std in text_to_check:
            exact_matches.append(subsidy)
            continue
            
        # Check for keyword matches
        if any(keyword in text_to_check for keyword in applicable_keywords):
            partial_matches.append(subsidy)
            continue
            
        # Check for general agriculture terms
        general_terms = ['farming', 'agriculture', 'cultivation', 'crop', 'farm']
        if any(term in text_to_check for term in general_terms):
            general_matches.append(subsidy)
    
    # Combine results with priority to exact matches
    result = exact_matches + partial_matches + general_matches
    
    # Return unique subsidies (avoid duplicates) - take top 5
    seen = set()
    unique_subsidies = []
    for subsidy in result:
        subsidy_id = subsidy.get('name', '')  # Use name as unique identifier
        if subsidy_id not in seen:
            seen.add(subsidy_id)
            unique_subsidies.append(subsidy)
            if len(unique_subsidies) >= 5:  # Limit to 5 subsidies
                break
    
    return unique_subsidies

# Get market prices for crops
def get_market_prices(crops, district, prices_data):
    if not crops:
        return []
        
    # Standardize crops and district
    standardized_crops = [c.strip().lower() for c in crops]
    prices_data['crop_std'] = prices_data['crop'].str.strip().str.lower()
    prices_data['location_std'] = prices_data['location'].str.strip().str.lower()
    district_std = district.strip().lower()
    
    # Get exact and fuzzy matches
    matched_crops = []
    all_market_crops = prices_data['crop_std'].unique().tolist()
    
    for c in standardized_crops:
        if c in all_market_crops:
            matched_crops.append(c)
        else:
            fuzzy = difflib.get_close_matches(c, all_market_crops, n=1, cutoff=0.7)
            if fuzzy:
                matched_crops.append(fuzzy[0])
    
    # Filter prices by matched crops and district
    if not matched_crops:
        return []
        
    crop_prices = prices_data[
        (prices_data['crop_std'].isin(matched_crops)) &
        (prices_data['location_std'].str.contains(district_std))
    ]
    
    if crop_prices.empty:
        # Try again without district constraint if no matches
        crop_prices = prices_data[prices_data['crop_std'].isin(matched_crops)]
    
    # Return formatted price data
    if not crop_prices.empty:
        return crop_prices[['location', 'price_per_quintal', 'date']].to_dict('records')
    else:
        return []

# Main API endpoint
@router.post("/recommend", response_model=RecommendationResponse)
async def recommend_system(data: RecommendationRequest):
    try:
        print(f"Received request for {data.plot_size} sqft & ₹{data.budget} budget in {data.district}")
        
        # 1. Filter systems by plot size and budget
        suitable_systems = filter_suitable_systems(data)
        print(f"{len(suitable_systems)} systems matched initial constraints")
        
        if suitable_systems.empty:
            return RecommendationResponse(
                success=False,
                recommendations=[],
                crop_suggestions=[],
                message="No suitable farming systems found for your constraints. Please try increasing your budget or reducing plot size."
            )
            
        # 2. Get subsidies for the user's state
        user_state = data.state.strip() if data.state else "Maharashtra"
        available_subsidies = get_top_subsidies(user_state)
        print(f"Found {len(available_subsidies)} applicable subsidies for {user_state}")
        
        # 3. Process each suitable system
        recommendations = []
        for _, system in suitable_systems.iterrows():
            # Calculate basic metrics
            total_setup_cost = system['capex_per_sqft'] * data.plot_size
            monthly_cost = system['opex_per_month']
            
            # Get suitable crops for this system and user's soil
            suitable_crops = get_crop_recommendations(system['system'], data.soil_type, data.soil_ph)
            if not suitable_crops:
                suitable_crops = [crop.strip() for crop in system['suitable_crops'].split(',')]
            
            # Filter crops by user preferences if specified
            if data.preferred_crops:
                user_crops = [crop.lower().strip() for crop in data.preferred_crops]
                suitable_crops = [crop for crop in suitable_crops 
                                 if any(user_crop in crop.lower() for user_crop in user_crops)]
                if not suitable_crops:  # If filter eliminated all crops, restore originals
                    suitable_crops = [crop.strip() for crop in system['suitable_crops'].split(',')]
            
            # Calculate resource usage
            water_usage = system['water_use_litres_per_day_per_sqft'] * data.plot_size
            electricity_usage = system['electricity_use_kwh_per_day_per_sqft'] * data.plot_size
            
            # Apply model prediction for ROI if available features match
            try:
                input_features = {
                    'plot_size': data.plot_size,
                    'budget': data.budget,
                    'system_type': system['category'],
                    'soil_type': data.soil_type,
                    'water_source': data.water_source,
                    'sunlight_hours': data.sunlight_hours,
                    'risk_appetite': data.risk_appetite,
                    'labor_availability': data.labor_availability
                }
                # Check if we have necessary features for prediction
                if set(input_features.keys()).issubset(set(model_features)):
                    # Create feature vector as expected by model
                    X = pd.DataFrame([input_features])[model_features]
                    predicted_roi = model.predict(X)[0]
                    print(f"Model predicted ROI for {system['system']}: {predicted_roi:.2f}%")
                    expected_roi = predicted_roi
                else:
                    # Fallback to system defaults
                    expected_roi = 100 / system['payback_period_months'] * 12
            except Exception as e:
                print(f"Error predicting ROI: {e}")
                expected_roi = 100 / system['payback_period_months'] * 12
            
            # Calculate compatibility score based on multiple factors
            labor_match = 1 - abs((system['labour_per_month'] / 100) - (data.labor_availability / 10))
            risk_match = 1 - abs((system['payback_period_months'] / 24) - (data.risk_appetite / 10))
            
            # Water source compatibility
            water_source_scores = {
                "well": {"hydroponics": 0.9, "aquaponics": 0.8, "microgreens": 1.0, "aeroponics": 0.9},
                "canal": {"hydroponics": 0.8, "aquaponics": 0.9, "microgreens": 0.9, "aeroponics": 0.7},
                "rainwater": {"hydroponics": 0.6, "aquaponics": 0.6, "microgreens": 0.8, "aeroponics": 0.5},
                "municipal": {"hydroponics": 1.0, "aquaponics": 0.8, "microgreens": 1.0, "aeroponics": 1.0}
            }
            
            water_score = water_source_scores.get(data.water_source.lower(), {}).get(
                system['category'].lower(), 0.7)
                
            # Final compatibility score calculation
            compatibility_score = (
                labor_match * 0.25 + 
                risk_match * 0.25 + 
                water_score * 0.2 +
                (expected_roi / 100) * 0.3
            ) * 100

            compatibility_score = max(0, min(100, compatibility_score))
            
            # Boost score for preferred systems
            if data.preferred_systems and system['system'] in data.preferred_systems:
                compatibility_score *= 1.2

                compatibility_score = min(100, compatibility_score)
                
            # Get market prices for crops
            market_prices_list = get_market_prices(suitable_crops, data.district, prices_data)
            
            # Match specific subsidies for this farming system - IMPROVED
            system_subsidies = match_subsidies_for_system(system['system'], system['category'], available_subsidies)
            
            # Calculate subsidy impact on ROI if applicable
            if system_subsidies:
                total_subsidy_pct = sum(s.get('subsidy_pct', 0) for s in system_subsidies[:3])
                # Cap total subsidy at 70%
                total_subsidy_pct = min(total_subsidy_pct, 70)
                
                # Apply subsidy to setup cost
                subsidized_setup_cost = total_setup_cost * (1 - total_subsidy_pct/100)
                subsidy_savings = total_setup_cost - subsidized_setup_cost
                
                # Adjust ROI based on reduced setup cost
                if subsidized_setup_cost > 0:
                    adjustment_factor = total_setup_cost / subsidized_setup_cost
                    expected_roi *= adjustment_factor
                    
                print(f"Applied {total_subsidy_pct}% subsidies to {system['system']}, ROI adjusted to {expected_roi:.2f}%")
            
            # Create recommendation object
            recommendations.append(SystemRecommendation(
                system=system['system'],
                category=system['category'],
                expected_roi_percent=round(expected_roi, 2),
                setup_cost_total=round(total_setup_cost, 2),
                monthly_cost=round(monthly_cost, 2),
                payback_period_months=round(system['payback_period_months'], 0),
                suitable_crops=suitable_crops[:5],  # Show top 5 crops only
                water_usage_per_day=round(water_usage, 2),
                electricity_usage_per_day=round(electricity_usage, 2),
                compatibility_score=round(compatibility_score, 2),
                market_prices=market_prices_list[:3],  # Keep only top 3 prices
                subsidies=system_subsidies
            ))

        # Sort recommendations by compatibility score and take top results
        recommendations.sort(key=lambda x: x.compatibility_score, reverse=True)
        top_recommendations = recommendations[:3]  # Keep only top 3 recommendations

        # Get unique crop suggestions from top recommendations
        crop_suggestions = []
        for r in top_recommendations:
            if r.suitable_crops and len(r.suitable_crops) > 0:
                for crop in r.suitable_crops:
                    if crop not in crop_suggestions:
                        crop_suggestions.append(crop)
                        if len(crop_suggestions) >= 5:  # Limit to 5 suggestions
                            break
        
        # Success response with top recommendations
        return RecommendationResponse(
            success=True,
            recommendations=top_recommendations,
            crop_suggestions=crop_suggestions[:5],  # Ensure max 5 crop suggestions
            message=f"Found {len(top_recommendations)} best micro-farming systems for your {data.plot_size} sqft plot in {data.district}."
        )

    except Exception as e:
        print(f"Error generating recommendations: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# Debug endpoint to check all available subsidies
@router.get("/debug/subsidies")
async def list_all_subsidies():
    """Debug endpoint to view all loaded subsidies"""
    try:
        if not subsidies_data:
            return {"message": "No subsidies data available", "subsidies": []}
            
        return {
            "message": f"Found {len(subsidies_data)} subsidies",
            "subsidies": subsidies_data
        }
    except Exception as e:
        return {"error": str(e)}