"""
VeriScore — Brick 2: Feature Engineering
==========================================
Turns a raw transaction + account history into the model-ready feature
vector that XGBoost scores. Called both during training (batch) and at
inference time (single transaction from FastAPI).

Features built:
  velocity_15m       — how many txns the sender sent in the last 15 minutes
  velocity_1h        — how many txns the sender sent in the last 1 hour
  amount_ratio       — amount ÷ account's typical_amount
  is_new_device      — 1 if device_id not seen before on this account
  is_geo_mismatch    — 1 if sender_city ≠ account home_city
  hour_of_day        — 0–23
  is_odd_hour        — 1 if hour between 0–5
  fan_in_count       — how many distinct senders paid into receiver in last 24h
  channel_enc        — UPI=0, IMPS=1, NEFT=2
  merchant_enc       — P2P=0, grocery=1, utility=2, fuel=3, ecommerce=4,
                       food_delivery=5, travel=6
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta

CHANNEL_MAP = {"UPI": 0, "IMPS": 1, "NEFT": 2}
MERCHANT_MAP = {
    "P2P": 0, "grocery": 1, "utility": 2, "fuel": 3,
    "ecommerce": 4, "food_delivery": 5, "travel": 6,
}


def engineer_features_batch(df: pd.DataFrame, accounts: pd.DataFrame) -> pd.DataFrame:
    """
    Build features for the entire training dataset at once.
    df        — raw_transactions.csv as a DataFrame
    accounts  — accounts.csv as a DataFrame
    Returns a DataFrame of features + the is_fraud label.
    """
    df = df.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values("timestamp").reset_index(drop=True)

    acc = accounts.set_index("account_id")

    rows = []
    for i, row in df.iterrows():
        ts = row["timestamp"]
        sender = row["sender_account"]
        receiver = row["receiver_account"]

        # velocity windows
        window_15m = df[
            (df["sender_account"] == sender) &
            (df["timestamp"] >= ts - timedelta(minutes=15)) &
            (df["timestamp"] < ts)
        ]
        window_1h = df[
            (df["sender_account"] == sender) &
            (df["timestamp"] >= ts - timedelta(hours=1)) &
            (df["timestamp"] < ts)
        ]

        # amount ratio vs typical
        typical = acc.loc[sender, "typical_amount"] if sender in acc.index else 1000.0
        amount_ratio = float(row["amount"]) / max(float(typical), 1.0)

        # device novelty — has this device appeared before for this sender?
        prior = df[
            (df["sender_account"] == sender) &
            (df["timestamp"] < ts)
        ]
        known_devices = set(prior["device_id"].unique())
        is_new_device = int(row["device_id"] not in known_devices)

        # geo mismatch
        home_city = acc.loc[sender, "home_city"] if sender in acc.index else ""
        is_geo_mismatch = int(row["sender_city"] != home_city)

        # time features
        hour = ts.hour
        is_odd_hour = int(hour <= 5)

        # fan-in count for receiver
        fan_in = df[
            (df["receiver_account"] == receiver) &
            (df["timestamp"] >= ts - timedelta(hours=24)) &
            (df["timestamp"] < ts)
        ]["sender_account"].nunique()

        rows.append({
            "velocity_15m": len(window_15m),
            "velocity_1h": len(window_1h),
            "amount_ratio": round(amount_ratio, 4),
            "is_new_device": is_new_device,
            "is_geo_mismatch": is_geo_mismatch,
            "hour_of_day": hour,
            "is_odd_hour": is_odd_hour,
            "fan_in_count": fan_in,
            "channel_enc": CHANNEL_MAP.get(row["channel"], 0),
            "merchant_enc": MERCHANT_MAP.get(row["merchant_category"], 0),
            "is_fraud": int(row["is_fraud"]),
        })

    return pd.DataFrame(rows)


def engineer_features_single(txn: dict, history_df: pd.DataFrame, accounts: pd.DataFrame) -> dict:
    """
    Build features for a single incoming transaction at inference time.
    txn         — dict with keys matching raw_transactions columns
    history_df  — recent transactions from PostgreSQL (last 24h minimum)
    accounts    — full accounts DataFrame
    Returns a flat dict of feature values (no label).
    """
    ts = pd.to_datetime(txn["timestamp"])
    sender = txn["sender_account"]
    receiver = txn["receiver_account"]

    history_df = history_df.copy()
    history_df["timestamp"] = pd.to_datetime(history_df["timestamp"])

    window_15m = history_df[
        (history_df["sender_account"] == sender) &
        (history_df["timestamp"] >= ts - timedelta(minutes=15)) &
        (history_df["timestamp"] < ts)
    ]
    window_1h = history_df[
        (history_df["sender_account"] == sender) &
        (history_df["timestamp"] >= ts - timedelta(hours=1)) &
        (history_df["timestamp"] < ts)
    ]

    acc = accounts.set_index("account_id")
    typical = acc.loc[sender, "typical_amount"] if sender in acc.index else 1000.0
    amount_ratio = float(txn["amount"]) / max(float(typical), 1.0)

    prior_devices = set(
        history_df[history_df["sender_account"] == sender]["device_id"].unique()
    )
    is_new_device = int(txn["device_id"] not in prior_devices)

    home_city = acc.loc[sender, "home_city"] if sender in acc.index else ""
    is_geo_mismatch = int(txn["sender_city"] != home_city)

    hour = ts.hour
    is_odd_hour = int(hour <= 5)

    fan_in = history_df[
        (history_df["receiver_account"] == receiver) &
        (history_df["timestamp"] >= ts - timedelta(hours=24)) &
        (history_df["timestamp"] < ts)
    ]["sender_account"].nunique()

    return {
        "velocity_15m": len(window_15m),
        "velocity_1h": len(window_1h),
        "amount_ratio": round(amount_ratio, 4),
        "is_new_device": is_new_device,
        "is_geo_mismatch": is_geo_mismatch,
        "hour_of_day": hour,
        "is_odd_hour": is_odd_hour,
        "fan_in_count": fan_in,
        "channel_enc": CHANNEL_MAP.get(txn.get("channel", "UPI"), 0),
        "merchant_enc": MERCHANT_MAP.get(txn.get("merchant_category", "P2P"), 0),
    }


FEATURE_COLS = [
    "velocity_15m", "velocity_1h", "amount_ratio",
    "is_new_device", "is_geo_mismatch", "hour_of_day",
    "is_odd_hour", "fan_in_count", "channel_enc", "merchant_enc",
]