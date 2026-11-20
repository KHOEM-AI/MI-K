import { useState } from "react";
import VehicleViewer from "./VehicleViewer";
import HumanViewer from "./HumanViewer";

// KHOEM-AI 3D: vehicles (360° turn, colour, LED, wheels) and people (360° turn, idle/walk/wave).
export default function Vehicles3D({ onClose }: { onClose?: () => void }) {
  const [t, setT] = useState<"cars" | "people">("cars");
  return (
    <div style={{ padding: 8 }}>
      <b>KHOEM-AI 3D</b>
      <div className="filters">
        <button className={t === "cars" ? "filter active" : "filter"} onClick={() => setT("cars")}>🚗 ឡាន · Vehicles</button>
        <button className={t === "people" ? "filter active" : "filter"} onClick={() => setT("people")}>🧍 មនុស្ស · People</button>
      </div>
      {t === "cars" ? <VehicleViewer onClose={onClose} /> : <HumanViewer />}
    </div>
  );
}
