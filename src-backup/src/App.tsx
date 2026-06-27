import { useState } from "react";
import LandingPage from "./components/LandingPage";
import DexApp from "./components/DexApp";

export default function App() {
  const [showLanding, setShowLanding] = useState(true);

  if (showLanding) {
    return <LandingPage onLaunch={() => setShowLanding(false)} />;
  }

  return <DexApp onBack={() => setShowLanding(true)} />;
}
