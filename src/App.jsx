import { useState } from "react";
import NavBar from "./components/NavBar";
import Hero from "./components/Hero";
import Footer from "./components/Footer";
import Dashboard from "./components/Dashboard";

function App() {
  const [view, setView] = useState("landing");

  if (view === "dashboard") {
    return <Dashboard onBack={() => setView("landing")} />;
  }

  return (
    <>
      <NavBar onEnter={() => setView("dashboard")} />
      <Hero onEnter={() => setView("dashboard")} />
      <Footer />
    </>
  );
}

export default App;