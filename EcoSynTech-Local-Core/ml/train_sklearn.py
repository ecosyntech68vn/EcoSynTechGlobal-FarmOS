# -*- coding: utf-8 -*-
"""
Train Yield Prediction Model using sklearn (alternative to LightGBM)
Much lighter, no C++ dependencies required
"""

import sys
import json
import os
import numpy as np
import pandas as pd
from datetime import datetime

try:
    from sklearn.ensemble import GradientBoostingRegressor
    from sklearn.preprocessing import StandardScaler
    from skl2onnx import convert_sklearn
    from skl2onnx.common.data_types import FloatTensorType
except ImportError:
    print("Installing sklearn...")
    os.system("pip install scikit-learn skl2onnx --break-system-packages -q")
    from sklearn.ensemble import GradientBoostingRegressor
    from sklearn.preprocessing import StandardScaler
    from skl2onnx import convert_sklearn
    from skl2onnx.common.data_types import FloatTensorType


def generate_training_data(n_samples=500):
    """Generate realistic training data for yield prediction"""
    np.random.seed(42)
    
    data = {
        'temperature_avg': np.random.uniform(18, 35, n_samples),
        'rainfall_mm': np.random.uniform(0, 300, n_samples),
        'fertilizer_kg': np.random.uniform(30, 200, n_samples),
        'soil_ph': np.random.uniform(5.0, 8.0, n_samples),
        'sun_hours': np.random.uniform(4, 12, n_samples),
        'humidity_avg': np.random.uniform(40, 90, n_samples),
        'pest_presence': np.random.uniform(0, 0.5, n_samples),
        'disease_presence': np.random.uniform(0, 0.3, n_samples)
    }
    
    base_yield = 8.5
    data['yield_tons_per_ha'] = (
        base_yield
        + 0.15 * (data['temperature_avg'] - 25)
        + 0.003 * data['rainfall_mm']
        + 0.01 * data['fertilizer_kg']
        + 0.5 * (data['soil_ph'] - 6.5)
        + 0.3 * data['sun_hours']
        - 5 * data['pest_presence']
        - 8 * data['disease_presence']
        + np.random.normal(0, 0.5, n_samples)
    )
    
    data['yield_tons_per_ha'] = np.clip(data['yield_tons_per_ha'], 0, 50)
    
    return pd.DataFrame(data)


def train_model():
    """Train Gradient Boosting model"""
    print("Generating training data...")
    df = generate_training_data(500)
    
    feature_cols = ['temperature_avg', 'rainfall_mm', 'fertilizer_kg', 'soil_ph', 
                   'sun_hours', 'humidity_avg', 'pest_presence', 'disease_presence']
    target_col = 'yield_tons_per_ha'
    
    X = df[feature_cols]
    y = df[target_col]
    
    print(f"Training with {len(X)} samples, {len(feature_cols)} features...")
    
    model = GradientBoostingRegressor(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.1,
        random_state=42
    )
    model.fit(X, y)
    
    train_score = model.score(X, y)
    print(f"Training R² score: {train_score:.4f}")
    
    return model, feature_cols


def export_to_onnx(model, feature_cols, output_path):
    """Export model to ONNX format"""
    print(f"Exporting to ONNX...")
    
    initial_type = [('float_input', FloatTensorType([None, len(feature_cols)]))]
    
    onnx_model = convert_sklearn(
        model,
        initial_types=initial_type,
        target_opset=12
    )
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'wb') as f:
        f.write(onnx_model.SerializeToString())
    
    file_size = os.path.getsize(output_path) / (1024 * 1024)
    print(f"Model saved to {output_path} ({file_size:.2f} MB)")
    
    return output_path


if __name__ == '__main__':
    output_path = 'models/lightgbm_yield.onnx'
    
    print("="*50)
    print("Training Yield Prediction Model")
    print("="*50)
    
    model, feature_cols = train_model()
    onnx_path = export_to_onnx(model, feature_cols, output_path)
    
    print("="*50)
    print(f"SUCCESS! Model: {onnx_path}")
    print("="*50)