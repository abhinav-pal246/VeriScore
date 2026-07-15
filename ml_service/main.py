"""
VeriScore — Brick 4: FastAPI ML Microservice
=============================================
Uses Groq (free) instead of OpenAI for explanation generation.

Start with:
    uvicorn main:app --reload --port 8000
"""

import json
import os
import pandas as pd
import numpy as np
import xgboost as xgb
import shap
from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from features import engineer_features_single, FEATURE_COLS

load_dotenv()

app = FastAPI(title="VeriScore ML Service")

print("Loading model...")
model = xgb.XGBClassifier()
model.load_model("veriscore_model.json")

with open("feature_cols.json") as f:
    FEATURE_COLS_ORDERED = json.load(f)

explainer = shap.TreeExplainer(model)
accounts_df = pd.read_csv("accounts.csv")

llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0.3,
    api_key=os.getenv("GROQ_API_KEY"),
)

FEATURE_LABELS = {
    "velocity_15m":    "transactions in last 15 minutes",
    "velocity_1h":     "transactions in last hour",
    "amount_ratio":    "amount vs account average",
    "is_new_device":   "device never seen before",
    "is_geo_mismatch": "city mismatch from home",
    "hour_of_day":     "hour of day",
    "is_odd_hour":     "odd hour (midnight–5am)",
    "fan_in_count":    "distinct senders to receiver in 24h",
    "channel_enc":     "payment channel",
    "merchant_enc":    "merchant category",
}

PATTERN_MAP = {
    "velocity_15m":    "velocity_burst",
    "velocity_1h":     "velocity_burst",
    "is_new_device":   "new_device_spike",
    "is_geo_mismatch": "geo_mismatch",
    "fan_in_count":    "mule_fan_in",
    "amount_ratio":    "amount_deviation",
}


class TransactionIn(BaseModel):
    transaction_id: str
    timestamp: str
    sender_account: str
    receiver_account: str
    amount: float
    channel: str
    sender_city: str
    device_id: str
    merchant_category: str


def get_top_features(shap_vals, n=3):
    abs_vals = np.abs(shap_vals)
    top_idx = np.argsort(abs_vals)[::-1][:n]
    total = abs_vals.sum()
    return [
        {
            "feature": FEATURE_COLS_ORDERED[i],
            "label": FEATURE_LABELS.get(FEATURE_COLS_ORDERED[i], FEATURE_COLS_ORDERED[i]),
            "shap_value": round(float(shap_vals[i]), 4),
            "contribution_pct": round(float(abs_vals[i]) / float(total) * 100, 1),
        }
        for i in top_idx
    ]


def generate_explanations(txn: dict, risk_score: int, top_features: list):
    summary = "; ".join(
        f"{f['label']} (impact {f['contribution_pct']}%)" for f in top_features
    )

    analyst_text = llm.invoke([HumanMessage(content=
        f"You are a fraud analyst AI for an Indian bank. "
        f"A transaction has been flagged with risk score {risk_score}/100. "
        f"Transaction: ₹{txn['amount']:,.2f} from {txn['sender_account']} "
        f"to {txn['receiver_account']} via {txn['channel']} at {txn['timestamp']}. "
        f"Top risk signals: {summary}. "
        f"Write a 2-sentence technical explanation for a fraud analyst. Be specific."
    )]).content.strip()

    customer_text = llm.invoke([HumanMessage(content=
        f"You are a bank's customer service AI. "
        f"A transaction of ₹{txn['amount']:,.2f} via {txn['channel']} was flagged "
        f"with risk score {risk_score}/100. "
        f"Write a single reassuring sentence for the customer. No jargon."
    )]).content.strip()

    return analyst_text, customer_text


@app.get("/health")
def health():
    return {"status": "ok", "model": "veriscore_xgboost_v1"}


@app.post("/score")
def score_transaction(txn: TransactionIn):
    txn_dict = txn.dict()

    history_df = pd.DataFrame(columns=[
        "transaction_id", "timestamp", "sender_account", "receiver_account",
        "amount", "channel", "sender_city", "device_id", "merchant_category",
    ])

    features = engineer_features_single(txn_dict, history_df, accounts_df)
    X = pd.DataFrame([features])[FEATURE_COLS_ORDERED]

    prob = float(model.predict_proba(X)[0][1])
    risk_score = int(round(prob * 100))

    shap_vals = explainer.shap_values(X)
    if isinstance(shap_vals, list):
        shap_vals = shap_vals[1]
    top_features = get_top_features(shap_vals[0], n=3)

    fraud_pattern = PATTERN_MAP.get(top_features[0]["feature"], "unknown")

    try:
        analyst_explanation, customer_explanation = generate_explanations(
            txn_dict, risk_score, top_features
        )
    except Exception as e:
        print(f"LLM error: {e}")
        analyst_explanation = (
            f"Risk score {risk_score}. "
            f"Top signals: {', '.join(f['label'] for f in top_features)}."
        )
        customer_explanation = (
            "This transaction was flagged for unusual activity and is under review."
        )

    return {
        "risk_score": risk_score,
        "fraud_pattern": fraud_pattern,
        "top_features": top_features,
        "analyst_explanation": analyst_explanation,
        "customer_explanation": customer_explanation,
    }