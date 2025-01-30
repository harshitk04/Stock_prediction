from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from datetime import date, timedelta
import yfinance as yf
from tensorflow.keras.models import load_model
import joblib
import os
import pickle 

app = Flask(__name__)
CORS(app)

MODEL_DIR = 'trained_models'
SCALER_DIR = 'scalers'
LOOK_BACK = 60

def get_model_path(stock):
    return os.path.join(MODEL_DIR, f"{stock}_model.h5")

def get_scaler_path(stock):
    return os.path.join(SCALER_DIR, f"{stock}_scaler.pkl")

@app.route('/predict', methods=['GET'])
def predict():
    stock_symbol = request.args.get('symbol', '').upper()
    if not stock_symbol:
        return jsonify({"error": "Please provide a stock symbol"}), 400
    
    try:
        if not os.path.exists(get_model_path(stock_symbol)):
            return jsonify({"error": f"No trained Model for {stock_symbol}"}), 404
        if not os.path.exists(get_scaler_path(stock_symbol)):
            return jsonify({"error": f"No Scaler found for {stock_symbol}"}), 404
        
        model = load_model(get_model_path(stock_symbol))
        with open(get_scaler_path(stock_symbol), 'rb') as f:
            scaler = pickle.load(f)
    
        end_date = date.today()
        start_date = end_date - timedelta(days=LOOK_BACK + 10)
        
        df = yf.download(stock_symbol, start=start_date, end=end_date)
        if df.empty:
            return jsonify({"error": "Failed to fetch stock data"}), 500
    
        data = df['Close'].values.reshape(-1, 1)
        scaled_data = scaler.transform(data)
        
        inputs = scaled_data[-LOOK_BACK:].reshape(1, LOOK_BACK, 1)
        
        predictions = []
        for _ in range(7):
            pred = model.predict(inputs, verbose=0)
            predictions.append(pred[0][0])
            inputs = np.append(inputs[:, 1:, :], pred.reshape(1, 1, 1), axis=1)
        
        predictions = scaler.inverse_transform(np.array(predictions).reshape(-1, 1))
        
        prediction_dates = [date.today() + timedelta(days=i+1) for i in range(7)]
        
        return jsonify({
            "stock": stock_symbol,
            "predictions": [float(x) for x in predictions.flatten()],
            "dates": [d.strftime("%Y-%m-%d") for d in prediction_dates]
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)