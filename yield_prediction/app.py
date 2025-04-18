from flask import Flask, request, jsonify, render_template
import pickle
import pandas as pd
import numpy as np
import requests
import os
from datetime import datetime
import json
from model import fetch_gee_data, fetch_weather_data

app = Flask(__name__)

# Load the model and metadata
@app.before_first_request
def load_model():
    global model, meta
    
    with open('model.pkl', 'rb') as f:
        model = pickle.load(f)
    
    with open('model_meta.pkl', 'rb') as f:
        meta = pickle.load(f)

# Home route
@app.route('/')
def home():
    # Pass both API keys to the template
    return render_template('index.html', 
                         google_maps_api_key=os.getenv('GOOGLE_MAPS_API_KEY'))

# Add this route to app.py
@app.route('/api/weather')
def get_weather():
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    weather_data = fetch_weather_data(lat, lon)
    if weather_data:
        return jsonify(weather_data)
    else:
        return jsonify({"error": "Could not fetch weather data"}), 500

# Route to get crop options
@app.route('/api/crops', methods=['GET'])
def get_crops():
    # This would typically come from your dataset
    crops = [
        "Rice", "Jowar", "Bajra", "Maize", "Ragi", "Wheat", 
        "Gram", "Tur", "Other Pulses", "Groundnut", "Sunflower", 
        "Soyabean", "Safflower", "Nigerseed", "Other Oilseeds", 
        "Cotton", "Sugarcane", "Tobacco", "Potato", "Onion", 
        "Other Vegetables", "Fruits", "Total Foodgrains"
    ]
    return jsonify(crops)

# Route to get state options
@app.route('/api/states', methods=['GET'])
def get_states():
    # For now, just returning Maharashtra as it's in the dataset
    states = ["Maharashtra"]
    return jsonify(states)

# Route to get season options
@app.route('/api/seasons', methods=['GET'])
def get_seasons():
    seasons = ["Kharif", "Rabi", "Summer"]
    return jsonify(seasons)

# Route to get soil data based on location
@app.route('/api/soil', methods=['POST'])
def get_soil_data():
    data = request.json
    lat = data.get('lat')
    lon = data.get('lon')
    
    # In a real implementation, this would fetch soil data from a database or API
    # For now, returning sample values based on averages from the dataset
    soil_data = {
        'ph': 6.8,
        'n': 300,
        'p': 35,
        'k': 240,
        'organic_carbon': 0.6
    }
    
    return jsonify(soil_data)

# Route to predict yield
@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.json
    
    # Extract location data
    lat = data.get('lat')
    lon = data.get('lon')
    
    # Get current year
    current_year = datetime.now().year
    
    # Fetch GEE data (NDVI, LST)
    gee_data = fetch_gee_data(lat, lon)
    
    # Fetch weather data if API key is provided
    weather_api_key = os.environ.get('OPENWEATHER_API_KEY', '')
    weather_data = fetch_weather_data(lat, lon, weather_api_key) if weather_api_key else None
    
    # Prepare input data for prediction
    input_data = {
        'crop': data.get('crop'),
        'year': current_year,
        'season': data.get('season'),
        'state': data.get('state'),
        'area': data.get('area'),
        'annual_rainfall': weather_data.get('rainfall', data.get('annual_rainfall')) if weather_data else data.get('annual_rainfall'),
        'fertilizer': data.get('fertilizer'),
        'pesticide': data.get('pesticide'),
        'ndvi': gee_data.get('ndvi'),
        'lst': gee_data.get('lst'),
        'ph': data.get('ph'),
        'n': data.get('n'),
        'p': data.get('p'),
        'k': data.get('k'),
        'organic_carbon': data.get('organic_carbon')
    }
    
    # Make prediction
    try:
        # Create a DataFrame from input data
        input_df = pd.DataFrame([input_data])
        
        # Ensure all required columns are present
        for col in meta['categorical_cols'] + meta['numerical_cols']:
            if col not in input_df.columns:
                input_df[col] = 0  # Default value
        
        # Make prediction
        prediction = model.predict(input_df)
        
        # Calculate estimated production
        estimated_production = prediction[0] * float(data.get('area', 0))
        
        # Get recommendations based on crop and conditions
        recommendations = get_recommendations(data.get('crop'), input_data)
        
        return jsonify({
            'success': True,
            'yield': float(prediction[0]),
            'estimated_production': float(estimated_production),
            'recommendations': recommendations
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

# Function to generate recommendations
def get_recommendations(crop, conditions):
    # This would be more sophisticated in a real implementation
    # For now, returning generic recommendations based on crop
    recommendations = {
        "Rice": [
            "Maintain proper water levels in the field",
            "Apply nitrogen fertilizer in split doses",
            "Monitor for pests like stem borers and leaf folders"
        ],
        "Wheat": [
            "Ensure timely irrigation, especially at crown root initiation and flowering stages",
            "Apply balanced fertilizers with emphasis on nitrogen",
            "Watch for rust and powdery mildew diseases"
        ],
        "Cotton": [
            "Implement integrated pest management for bollworms",
            "Maintain optimal soil moisture during flowering and boll formation",
            "Consider foliar application of micronutrients"
        ]
    }
    
    # Default recommendations if crop-specific ones aren't available
    default_recommendations = [
        "Monitor soil moisture regularly",
        "Apply fertilizers based on soil test results",
        "Implement integrated pest management practices",
        "Consider weather forecasts for planning farm operations"
    ]
    
    return recommendations.get(crop, default_recommendations)

# Run the app
if __name__ == '__main__':
    app.run(debug=True)
