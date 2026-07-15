"""
VeriScore — Brick 3: XGBoost Model Training
=============================================
Run this once before starting the FastAPI service:
    python train.py

Outputs:
    veriscore_model.json  — the trained XGBoost model
    feature_cols.json     — ordered list of feature names (for inference)
"""

import json
import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report, roc_auc_score,
    precision_score, recall_score, f1_score
)
from features import engineer_features_batch, FEATURE_COLS

print("Loading raw data...")
df = pd.read_csv("raw_transactions.csv")
accounts = pd.read_csv("accounts.csv")

print(f"Total transactions: {len(df)}")
print(f"Fraud rate: {df['is_fraud'].mean():.3%}")
print("\nEngineering features (this takes ~2 minutes on 15k rows)...")

feature_df = engineer_features_batch(df, accounts)

X = feature_df[FEATURE_COLS]
y = feature_df["is_fraud"]

print(f"\nFeature matrix shape: {X.shape}")
print(f"Fraud cases: {y.sum()} / {len(y)}")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Class weight to handle imbalance (~5% fraud rate)
scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()
print(f"\nscale_pos_weight: {scale_pos_weight:.1f}")

print("\nTraining XGBoost model...")
model = xgb.XGBClassifier(
    n_estimators=300,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    scale_pos_weight=scale_pos_weight,
    use_label_encoder=False,
    eval_metric="aucpr",
    random_state=42,
)

model.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    verbose=50,
)

y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]

print("\n=== Evaluation ===")
print(f"AUC-ROC:   {roc_auc_score(y_test, y_prob):.4f}")
print(f"Precision: {precision_score(y_test, y_pred):.4f}")
print(f"Recall:    {recall_score(y_test, y_pred):.4f}")
print(f"F1:        {f1_score(y_test, y_pred):.4f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=["legit", "fraud"]))

model.save_model("veriscore_model.json")
with open("feature_cols.json", "w") as f:
    json.dump(FEATURE_COLS, f)

print("\nModel saved to veriscore_model.json")
print("Feature list saved to feature_cols.json")
print("\nDone. You can now start the FastAPI service with:")
print("  uvicorn main:app --reload --port 8000")