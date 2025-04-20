import pandas as pd
import joblib
import os
from sklearn.model_selection import train_test_split
from xgboost import XGBRegressor

# Get absolute paths
script_dir = os.path.dirname(os.path.abspath(__file__))
app_dir = os.path.dirname(script_dir)  # This is the 'app' directory
data_dir = os.path.join(app_dir, 'data')

training_data_path = os.path.join(data_dir, 'training_data.csv')
print(f"Loading training data from {training_data_path}")
df = pd.read_csv(training_data_path)

# Print column names for debugging
print(f"Available columns: {df.columns.tolist()}")

# Select features - using the correct column names from our training data
# Note: We use 'avg_price' instead of 'avg_modal_price' based on our generated data
features = [
    'avg_price',             # Average crop price per quintal
    'capex_per_sqft',        # Capital expenditure per square foot
    'opex_per_month',        # Operating expenses per month
    'productivity_kg_per_sqft_per_month',  # Productivity in kg per sqft per month
    'avg_subsidy_pct'        # Average subsidy percentage
]

# Make sure all features exist in the dataframe
for feature in features:
    if feature not in df.columns:
        print(f"Warning: Feature '{feature}' not found in dataset. Available columns: {df.columns.tolist()}")

# Use only features that exist in the dataset
valid_features = [f for f in features if f in df.columns]
print(f"Using features: {valid_features}")

# Extract features and target
X = df[valid_features]

# Our target is the subsidized ROI percentage - this is what we want to predict
y = df['subsidized_roi_percent']

print(f"Training on {len(df)} samples with {len(valid_features)} features")

# Train/Test split
X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)

# Fit model
print("Training XGBoost model...")
model = XGBRegressor(n_estimators=100, random_state=42, objective='reg:squarederror')

# Handle different versions of XGBoost API
try:
    # Newer XGBoost API with eval_set and early_stopping_rounds
    model.fit(X_train, y_train, eval_set=[(X_val, y_val)], early_stopping_rounds=10, verbose=False)
    print("Used newer XGBoost API with early stopping")
except TypeError:
    try:
        # Alternative approach with older XGBoost API
        model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)
        print("Used older XGBoost API with eval_set")
    except TypeError:
        # Fallback to basic fit method
        model.fit(X_train, y_train)
        print("Used basic XGBoost API without eval_set")

# Create feature importance dataframe
feature_importance = pd.DataFrame({
    'feature': valid_features,
    'importance': model.feature_importances_
})
feature_importance = feature_importance.sort_values('importance', ascending=False)
print("Feature importance:")
for idx, row in feature_importance.iterrows():
    print(f"  {row['feature']}: {row['importance']:.4f}")

# Save model
model_path = os.path.join(models_dir, 'model.pkl')
joblib.dump(model, model_path)
print(f"Model trained and saved to {model_path}")

# Save model metadata (feature names, etc.)
model_meta = {
    'features': valid_features,
    'target': 'subsidized_roi_percent',
    'feature_importance': feature_importance.to_dict(),
    'n_samples': len(df)
}

model_meta_path = os.path.join(models_dir, 'model_meta.pkl')
joblib.dump(model_meta, model_meta_path)
print(f"Model metadata saved to {model_meta_path}")

