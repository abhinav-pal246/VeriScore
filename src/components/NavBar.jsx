export default function NavBar() {
  return (
    <nav className="relative z-20 flex items-center justify-between px-8 py-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{backgroundColor: '#0B2226'}}>
          <span className="italic text-sm" style={{color: '#C9A227', fontFamily: 'serif'}}>V</span>
        </div>
        <span className="font-semibold text-black tracking-tight">VeriScore</span>
      </div>

      <div className="hidden md:flex items-center gap-8 text-sm text-black">
        <a href="#how" className="hover:text-slate-600 transition-colors">How it works</a>
        <a href="#security" className="hover:text-slate-600 transition-colors">Security</a>
        <a href="#" className="hover:text-slate-600 transition-colors">About</a>
      </div>

      <button
        className="px-5 py-2.5 rounded-full text-sm font-medium transition-colors"
        style={{backgroundColor: '#0B2226', color: '#ffffff'}}
      >
        See it in action
      </button>
    </nav>
  );
}