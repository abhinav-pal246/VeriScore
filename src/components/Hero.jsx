import { ShieldAlert, CheckCircle2, ArrowUpRight } from "lucide-react";
import TransactionTicker from "./TransactionTicker";

const feed = [
  { status: "cleared", label: "UPI transfer", amount: "₹2,847.99", time: "2 min ago" },
  { status: "flagged", label: "New device detected", amount: "₹9,820.00", time: "5 min ago" },
  { status: "cleared", label: "Bill payment", amount: "₹1,560.20", time: "13 min ago" },
  { status: "flagged", label: "Geo mismatch", amount: "₹14,440.04", time: "22 min ago" },
];

export default function Hero({ onEnter }) {
  return (
    <section className="relative overflow-hidden bg-slate-50">
      <div className="pointer-events-none absolute -top-24 -left-24 w-[28rem] h-[28rem] rounded-full bg-slate-200 opacity-40 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -right-32 w-[26rem] h-[26rem] rounded-full bg-amber-100 opacity-50 blur-3xl" />

      <div className="relative z-10 max-w-3xl mx-auto text-center px-6 pt-16 pb-8">
        <span className="inline-block mb-5 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs text-black tracking-wide">
          Built for UPI &amp; IMPS rails
        </span>
        <h1 className="font-semibold text-4xl md:text-5xl text-black leading-[1.1] tracking-tight">
          Every flagged transaction,
          <br />
          <span className="italic font-normal text-black" style={{fontFamily: 'serif'}}>
            explained in plain language.
          </span>
        </h1>
        <p className="mt-5 text-black text-base md:text-lg max-w-xl mx-auto">
          VeriScore scores every transaction in real time, then tells your
          fraud team exactly why — not just a risk number, a reason.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={onEnter}
            className="px-6 py-3 rounded-full text-sm font-medium inline-flex items-center gap-1.5 transition-colors"
            style={{backgroundColor: '#000000', color: '#ffffff'}}
          >
            View live dashboard
            <ArrowUpRight size={15} />
          </button>
          <a href="#how" className="px-6 py-3 rounded-full text-black text-sm font-medium hover:text-slate-600 transition-colors">
            How it works
          </a>
        </div>
      </div>

      <TransactionTicker />

      <div className="relative z-10 max-w-5xl mx-auto px-6 pb-24 pt-10">
        <div className="relative h-[420px] md:h-[300px]">
          <div className="absolute left-1/2 -translate-x-1/2 md:left-6 md:translate-x-0 top-0 w-72 -rotate-2 bg-white rounded-2xl border border-slate-200 shadow-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert size={16} className="text-red-600" />
              <span className="text-xs font-medium text-red-700">
                Risk detected · 92
              </span>
            </div>
            <p className="text-sm text-black leading-snug">
              New device on ACC10233, sent at 2:15am — 8.4x this account's typical transfer.
            </p>
          </div>

          <div
            className="absolute left-1/2 translate-x-10 md:left-auto md:right-10 md:translate-x-0 top-32 md:top-4 rotate-2 rounded-2xl shadow-xl p-4 w-44"
            style={{backgroundColor: '#000000', color: '#ffffff'}}
          >
            <p className="text-2xl font-semibold">99.8%</p>
            <p className="text-xs mt-1" style={{color: '#cbd5e1'}}>
              legitimate transfers cleared instantly
            </p>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 rotate-1 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 w-80">
            <p className="text-xs font-medium text-black mb-3">Live feed</p>
            <div className="space-y-3">
              {feed.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {f.status === "cleared" ? (
                      <CheckCircle2 size={15} className="text-green-600" />
                    ) : (
                      <ShieldAlert size={15} className="text-red-500" />
                    )}
                    <div>
                      <p className="text-black leading-tight">{f.label}</p>
                      <p className="text-black text-xs">{f.amount}</p>
                    </div>
                  </div>
                  <span className="text-xs text-black shrink-0">{f.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}