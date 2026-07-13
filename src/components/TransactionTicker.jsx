const chips = [
  "UPI · ₹1,240",
  "IMPS · ₹8,500",
  "UPI · ₹340",
  "NEFT · ₹22,000",
  "UPI · ₹610",
  "IMPS · ₹4,120",
  "UPI · ₹95",
  "NEFT · ₹1,800",
];

export default function TransactionTicker() {
  const row = [...chips, ...chips]; // duplicated for a seamless loop

  return (
    <div className="relative overflow-hidden py-3">
      <div className="flex gap-3 w-max animate-ticker motion-reduce:animate-none">
        {row.map((c, i) => (
          <span
            key={i}
            className="shrink-0 px-4 py-2 rounded-full bg-white border border-slate-200 text-xs font-plex text-black shadow-sm"
          >
            {c}
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-slate-50 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-slate-50 to-transparent" />
    </div>
  );
}