import { useState, useEffect } from "react";
import { ShieldCheck, ArrowLeft } from "lucide-react";

const FRAUD_SIGNAL_MAP = {
  velocity_burst:   { label: "Velocity burst" },
  new_device_spike: { label: "New device" },
  geo_mismatch:     { label: "Geo mismatch" },
  mule_fan_in:      { label: "Mule fan-in" },
  mule_fan_out:     { label: "Mule fan-out" },
  amount_deviation: { label: "Amount deviation" },
  unknown:          { label: "Flagged" },
};

function riskColor(score) {
  if (score >= 85) return { badge: "bg-red-50 text-red-700", bar: "#dc2626" };
  if (score >= 65) return { badge: "bg-amber-50 text-amber-700", bar: "#d97706" };
  return { badge: "bg-slate-100 text-slate-700", bar: "#475569" };
}

function mapRow(row) {
  const signal = FRAUD_SIGNAL_MAP[row.fraud_pattern] || FRAUD_SIGNAL_MAP.unknown;
  const factors = (
    typeof row.top_features === "string"
      ? JSON.parse(row.top_features)
      : row.top_features || []
  ).map((f) => ({ label: f.label, value: f.contribution_pct }));

  return {
    id: row.transaction_id,
    sender: row.sender_account,
    receiver: row.receiver_account,
    amount: parseFloat(row.amount),
    score: row.risk_score,
    signal: signal.label,
    explanation: row.analyst_explanation,
    factors,
  };
}

function DetailPanel({ transaction }) {
  if (!transaction) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 text-slate-400 text-sm">
        Select a transaction to see its explanation.
      </div>
    );
  }
  const maxVal = Math.max(...transaction.factors.map((f) => f.value), 1);
  const { bar } = riskColor(transaction.score);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-baseline justify-between mb-3">
        <p className="font-medium text-black">{transaction.id} — analyst explanation</p>
        <span className="text-xl font-semibold text-black">{transaction.score}</span>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed mb-4">
        {transaction.explanation}
      </p>
      {transaction.factors.map((f) => (
        <div key={f.label} className="mb-2">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>{f.label}</span>
            <span>{f.value}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full">
            <div
              className="h-full rounded-full"
              style={{ width: `${(f.value / maxVal) * 100}%`, backgroundColor: bar }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard({ onBack }) {
  const [transactions, setTransactions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:4000/api/transactions")
      .then((r) => r.json())
      .then((data) => {
        const mapped = data.map(mapRow);
        setTransactions(mapped);
        if (mapped.length > 0) setSelectedId(mapped[0].id);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not connect to server.");
        setLoading(false);
      });
  }, []);

  function handleDecision(id, action) {
    fetch("http://localhost:4000/api/decisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transaction_id: id, action }),
    }).then(() => {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      if (selectedId === id) setSelectedId(null);
    });
  }

  const selected = transactions.find((t) => t.id === selectedId) || null;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <ShieldCheck size={18} className="text-slate-700" />
            </div>
            <div>
              <p className="font-semibold text-black leading-tight">VeriScore</p>
              <p className="text-xs text-slate-500">Fraud analyst console</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-sm text-slate-600 hover:text-black inline-flex items-center gap-1 transition-colors"
            >
              <ArrowLeft size={14} /> Back to site
            </button>
            <span className="text-sm px-3 py-1 rounded-full bg-red-50 text-red-700">
              {transactions.length} pending alerts
            </span>
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Scored today", value: "1,842" },
            { label: "Flagged", value: transactions.length },
            { label: "Avg risk score", value: transactions.length ? Math.round(transactions.reduce((s, t) => s + t.score, 0) / transactions.length) : 0 },
            { label: "Blocked", value: "—" },
          ].map((m) => (
            <div key={m.label} className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">{m.label}</p>
              <p className="text-2xl font-semibold text-black">{m.value}</p>
            </div>
          ))}
        </div>

        {loading && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
            Loading transactions...
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mb-4">
            {error} Make sure Express is running on port 4000.
          </div>
        )}

        {!loading && !error && transactions.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
            No pending alerts. Run the seed script to populate transactions.
          </div>
        )}

        {!loading && transactions.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-2 mb-6 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="py-2 px-3 font-medium">Transaction</th>
                  <th className="py-2 px-3 font-medium">Amount</th>
                  <th className="py-2 px-3 font-medium">Risk</th>
                  <th className="py-2 px-3 font-medium">Signal</th>
                  <th className="py-2 px-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => {
                  const { badge } = riskColor(t.score);
                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedId(t.id)}
                      className={`border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${selectedId === t.id ? "bg-slate-50" : ""}`}
                    >
                      <td className="py-3 px-3">
                        <div className="font-medium text-black">{t.id}</div>
                        <div className="text-xs text-slate-400">{t.sender} → {t.receiver}</div>
                      </td>
                      <td className="py-3 px-3 text-black">₹{t.amount.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge}`}>{t.score}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs">{t.signal}</span>
                      </td>
                      <td className="py-3 px-3 space-x-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDecision(t.id, "approve"); }}
                          className="px-3 py-1 text-xs rounded border border-slate-200 text-slate-500 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors"
                        >✓</button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDecision(t.id, "block"); }}
                          className="px-3 py-1 text-xs rounded border border-slate-200 text-slate-500 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors"
                        >✗</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <DetailPanel transaction={selected} />
      </div>
    </div>
  );
}