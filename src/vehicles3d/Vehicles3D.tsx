import { useState } from "react";
import VehicleViewer from "./VehicleViewer";
import HumanViewer from "./HumanViewer";
import ModelStudio from "./ModelStudio";
import PeopleStudio from "./PeopleStudio";
import ImageTo3D from "./ImageTo3D";
import { TabIcon } from "./icons";

// KHOEM-AI 3D: vehicles (360° turn, colour, LED, wheels) and people (360° turn, idle/walk/wave).
export default function Vehicles3D({ onClose }: { onClose?: () => void }) {
  const [t, setT] = useState<"cars" | "people" | "models" | "studio" | "image">("cars");
  return (
    <div style={{ padding: 8 }}>
      <b>KHOEM-AI 3D</b>
      <div className="filters">
        <button className={t === "cars" ? "filter active" : "filter"} onClick={() => setT("cars")}><TabIcon name="car" /> ឡាន · Vehicles</button>
        <button className={t === "people" ? "filter active" : "filter"} onClick={() => setT("people")}><TabIcon name="people" /> មនុស្ស · People</button>
        <button className={t === "models" ? "filter active" : "filter"} onClick={() => setT("models")}><TabIcon name="car" /> ម៉ូដែល · Models</button>
        <button className={t === "studio" ? "filter active" : "filter"} onClick={() => setT("studio")}><TabIcon name="video" /> ស្ទូឌីយោ · Studio</button>
        <button className={t === "image" ? "filter active" : "filter"} onClick={() => setT("image")}><TabIcon name="car" /> រូបភាព → 3D · Image to 3D</button>
      </div>
      {t === "cars" ? <VehicleViewer onClose={onClose} /> : t === "people" ? <HumanViewer /> : t === "models" ? <ModelStudio /> : t === "studio" ? <PeopleStudio /> : <ImageTo3D endpoint="/api/image-to-3d" />}
    </div>
  );
}
