import { useState } from "react";
import VehicleViewer from "./VehicleViewer";
import HumanViewer from "./HumanViewer";

const tab = (on: boolean): React.CSSProperties => ({
  padding: "8px 14px", borderRadius: 8, border: "none", marginRight: 8, color: "#fff", fontSize: 14,
  background: on ? "#4f7cff" : "rgba(255,255,255,0.14)",
});

// KHOEM-AI 3D: vehicles (360° turn, colour, LED, wheels) and people (360° turn, idle/walk/wave).
export default function Vehicles3D({ onClose }: { onClose?: () => void }) {
  const [t, setT] = useState<"cars" | "people">("cars");
  return (
    <div style={{ padding: 8, color: "#fff" }}>
      <b>KHOEM-AI 3D</b>
      <div style={{ margin: "8px 0" }}>
        <button style={tab(t === "cars")} onClick={() => setT("cars")}>🚗 ឡាន · Vehicles</button>
        <button style={tab(t === "people")} onClick={() => setT("people")}>🧍 មនុស្ស · People</button>
      </div>
      {t === "cars" ? <VehicleViewer onClose={onClose} /> : <HumanViewer />}
    </div>
  );
}
