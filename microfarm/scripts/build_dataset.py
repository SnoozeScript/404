import pandas as pd
import json
import os
import numpy as np

# Get absolute path to data directory
script_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(os.path.dirname(script_dir), 'data')

# 1) Market prices (average price per crop)
prices_path = os.path.join(data_dir, 'agmarknet_prices.csv')
print(f"Reading prices from {prices_path}")
prices = pd.read_csv(prices_path, parse_dates=['date'])
price_feat = (prices
    .groupby('crop')
    ['price_per_quintal'].mean()  # Use price_per_quintal instead of modal_price
    .rename('avg_price')
    .reset_index()
)
print(f"Processed {len(price_feat)} unique crops")

# 2) System costs
costs_path = os.path.join(data_dir, 'system_costs.csv')
print(f"Reading system costs from {costs_path}")
costs = pd.read_csv(costs_path)
print(f"Loaded {len(costs)} farming systems")

# 3) Subsidies (average % by category)
subsidies_path = os.path.join(data_dir, 'subsidies.json')
print(f"Reading subsidies from {subsidies_path}")
with open(subsidies_path, 'r', encoding='utf-8') as f:
    subs_data = json.load(f)

# Convert to DataFrame
subs = pd.DataFrame(subs_data)

# If subsidy_pct is None in some rows, replace with 0
subs['subsidy_pct'] = subs['subsidy_pct'].fillna(0)

# Calculate average subsidy percentage by category
subs_feat = (subs
    .groupby('category')
    ['subsidy_pct'].mean()
    .rename('avg_subsidy_pct')
    .reset_index()
)
print(f"Processed subsidies for {len(subs_feat)} categories")

# 4) Map crops to system categories
# Complete mapping for all crops in our dataset
crop_to_cat = {
    # Leafy greens and herbs - typically grown in hydroponics
    'Romaine Lettuce': 'hydroponics',
    'Lettuce': 'hydroponics',
    'Kale': 'hydroponics',
    'Spinach': 'hydroponics',
    'Basil': 'hydroponics',
    'Mint': 'hydroponics',
    'Cilantro': 'hydroponics',
    
    # Vegetables that grow well in protected cultivation
    'Tomatoes': 'protected cultivation',
    'Bell Peppers': 'protected cultivation',
    'Cucumber': 'protected cultivation',
    'Cauliflower': 'protected cultivation',
    
    # Exotic/specialty crops
    'Broccoli': 'protected cultivation',
    'Asparagus': 'specialty',
    'Artichoke': 'specialty',
    'Zucchini': 'protected cultivation',
    'Brussels Sprout': 'protected cultivation',
    'Leek': 'specialty',
    
    # Fruits
    'Strawberries': 'aquaponics',
    
    # Microgreens
    'Microgreens': 'microgreens',
    'Microgreens (Mixed)': 'microgreens',
}

# Add category mapping to price feature table
print("Mapping crops to farming system categories...")
price_feat['category'] = price_feat.crop.map(crop_to_cat)

# Drop any rows where we couldn't map to a category
pre_drop_count = len(price_feat)
price_feat = price_feat.dropna(subset=['category'])
post_drop_count = len(price_feat)
if pre_drop_count > post_drop_count:
    print(f"Warning: Dropped {pre_drop_count - post_drop_count} crops that couldn't be mapped to a category")

# 5) Join the datasets
print("Merging datasets...")
# System costs join
df = price_feat.merge(costs, on='category', how='left')

# Get unique categories for subsidy mapping
unique_categories = df['category'].unique()
print(f"Dataset contains {len(unique_categories)} unique farming system categories")

# Subsidy join - only keep certain columns to avoid duplicates
df = df.merge(subs_feat[['category', 'avg_subsidy_pct']], on='category', how='left')

# Fill missing subsidy percentages with 0
df['avg_subsidy_pct'] = df['avg_subsidy_pct'].fillna(0)

# 6) Calculate ROI (simplified for demonstration)
print("Calculating ROI metrics...")
# Base revenue per sqft per month (price * productivity)
df['revenue_per_sqft_month'] = df['avg_price'] * df['productivity_kg_per_sqft_per_month'] / 100  # Convert from per quintal to per kg

# Monthly costs per sqft (opex + amortized capex)
df['monthly_cost_per_sqft'] = df['opex_per_month'] + (df['capex_per_sqft'] / (df['expected_life_years'] * 12))

# ROI calculation - monthly return percentage
df['roi_percent'] = ((df['revenue_per_sqft_month'] - df['monthly_cost_per_sqft']) / df['monthly_cost_per_sqft']) * 100

# Adjusted ROI with subsidy (assuming subsidy reduces capex)
df['subsidized_capex'] = df['capex_per_sqft'] * (1 - df['avg_subsidy_pct']/100)
df['subsidized_monthly_cost'] = df['opex_per_month'] + (df['subsidized_capex'] / (df['expected_life_years'] * 12))
df['subsidized_roi_percent'] = ((df['revenue_per_sqft_month'] - df['subsidized_monthly_cost']) / df['subsidized_monthly_cost']) * 100

# 7) Export for training
training_data_path = os.path.join(data_dir, 'training_data.csv')
df.to_csv(training_data_path, index=False)
print(f"Built training_data.csv with {len(df)} rows at {training_data_path}")

# Create a summary view for inspection
summary = df[[
    'crop', 'system', 'category', 'avg_price', 'productivity_kg_per_sqft_per_month',
    'capex_per_sqft', 'opex_per_month', 'expected_life_years', 'avg_subsidy_pct',
    'roi_percent', 'subsidized_roi_percent'
]]

# Round numeric values for readability
summary = summary.round(2)

# Sort by subsidized ROI (descending)
summary = summary.sort_values('subsidized_roi_percent', ascending=False)

# Export summary for easy inspection
summary_path = os.path.join(data_dir, 'roi_summary.csv')
summary.to_csv(summary_path, index=False)
print(f"Created ROI summary at {summary_path}")

