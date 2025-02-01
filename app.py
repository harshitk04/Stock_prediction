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
    
    try:
        # Load model and scaler
        model = load_model(get_model_path(stock_symbol))
        with open(get_scaler_path(stock_symbol), 'rb') as f:
            scaler = pickle.load(f)

        # Get historical data
        end_date = date.today()
        start_date = end_date - timedelta(days=LOOK_BACK * 2)
        df = yf.download(stock_symbol, start=start_date, end=end_date)
        
        if df.empty:
            return jsonify({"error": "Failed to fetch stock data"}), 500

        # Prepare data
        data = df[['Close']].values
        scaled_data = scaler.transform(data)

        # Generate past predictions
        past_predictions = []
        for i in range(LOOK_BACK, len(scaled_data)):
            inputs = scaled_data[i-LOOK_BACK:i].reshape(1, LOOK_BACK, 1)
            pred = model.predict(inputs, verbose=0)
            past_predictions.append(pred[0][0])

        # Generate future predictions
        future_predictions = []
        inputs = scaled_data[-LOOK_BACK:].reshape(1, LOOK_BACK, 1)
        for _ in range(7):
            pred = model.predict(inputs, verbose=0)
            future_predictions.append(pred[0][0])
            inputs = np.append(inputs[:, 1:, :], pred.reshape(1, 1, 1), axis=1)

        # Inverse transform
        past_predictions = scaler.inverse_transform(np.array(past_predictions).reshape(-1, 1))
        future_predictions = scaler.inverse_transform(np.array(future_predictions).reshape(-1, 1))

        # Prepare dates
        past_dates = df.index[LOOK_BACK:].strftime('%Y-%m-%d').tolist()
        future_dates = [(date.today() + timedelta(days=i+1)).strftime('%Y-%m-%d') 
                       for i in range(7)]

        return jsonify({
            "stock": stock_symbol,
            "actual": {
                "dates": df.index.strftime('%Y-%m-%d').tolist(),
                "prices": data.flatten().tolist()
            },
            "past_predictions": {
                "dates": past_dates,
                "prices": past_predictions.flatten().tolist()
            },
            "future_predictions": {
                "dates": future_dates,
                "prices": future_predictions.flatten().tolist()
            }
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
if __name__ == '__main__':
    app.run(debug=True)