import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import pickle
import joblib
import requests
import os
from datetime import datetime
from dotenv import load_dotenv


# Function to load and preprocess the dataset
def load_and_preprocess_data(file_path):
    # Load the dataset
    df = pd.read_csv(file_path)
    
    # Convert string columns to appropriate types
    numeric_cols = ['production', 'annual_rainfall', 'fertilizer', 'pesticide', 'yield']
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce')
    
    # Extract year from date
    df['year'] = pd.to_datetime(df['year']).dt.year
    
    # Handle missing values
    df = df.dropna()
    
    return df

# Function to build and train the model
def build_model(df):
    # Define features and target
    X = df.drop(['yield', 'production'], axis=1)
    y = df['yield']
    
    # Identify categorical and numerical columns
    categorical_cols = ['crop', 'season', 'state']
    numerical_cols = [col for col in X.columns if col not in categorical_cols]
    
    # Create preprocessor
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numerical_cols),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_cols)
        ])
    
    # Create and train the model pipeline
    model = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=100, random_state=42))
    ])
    
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train the model
    model.fit(X_train, y_train)
    
    # Evaluate the model
    train_score = model.score(X_train, y_train)
    test_score = model.score(X_test, y_test)
    
    print(f"Training R² score: {train_score:.4f}")
    print(f"Testing R² score: {test_score:.4f}")
    
    return model, preprocessor, categorical_cols, numerical_cols

# Function to save the model
def save_model(model, preprocessor, categorical_cols, numerical_cols, model_path='model.pkl', meta_path='model_meta.pkl'):
    # Save the model
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    
    # Save metadata
    meta = {
        'categorical_cols': categorical_cols,
        'numerical_cols': numerical_cols
    }
    with open(meta_path, 'wb') as f:
        pickle.dump(meta, f)
    
    print(f"Model saved to {model_path}")
    print(f"Model metadata saved to {meta_path}")

# Function to fetch Google Earth Engine data (NDVI, LST)
def fetch_gee_data(lat, lon):
    # In a real implementation, this would use the Google Earth Engine API
    # For now, we'll return sample values based on averages from the dataset
    return {
        'ndvi': 0.25,  # Sample NDVI value
        'lst': 30.5    # Sample LST value
    }

def fetch_weather_data(lat, lon, api_key=None):
    if not api_key:
        api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        print("API key for OpenWeather is missing.")
        return None

    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
    
    try:
        response = requests.get(url)
        data = response.json()
        
        if response.status_code == 200:
            return {
                'temperature': data['main']['temp'],
                'humidity': data['main']['humidity'],
                'rainfall': data.get('rain', {}).get('1h', 0)
            }
        else:
            print(f"Error fetching weather data: {data.get('message', 'Unknown error')}")
            return None
    except Exception as e:
        print(f"Exception when fetching weather data: {e}")
        return None

# Function to predict yield with real-time data
def predict_yield(model, input_data, preprocessor, categorical_cols, numerical_cols):
    # Create a DataFrame from input data
    input_df = pd.DataFrame([input_data])
    
    # Ensure all required columns are present
    for col in categorical_cols + numerical_cols:
        if col not in input_df.columns:
            input_df[col] = 0  # Default value
    
    # Make prediction
    prediction = model.predict(input_df)
    
    return prediction[0]

# Main function to train and save the model
def main():
    # URL to the dataset
    dataset_url = r"final_crop_yield_dataset.csv"
    
    # Load and preprocess the data
    df = load_and_preprocess_data(dataset_url)
    
    # Build and train the model
    model, preprocessor, categorical_cols, numerical_cols = build_model(df)
    
    # Save the model
    save_model(model, preprocessor, categorical_cols, numerical_cols)



if __name__ == "__main__":
    main()
