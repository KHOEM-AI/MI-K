import * as THREE from "three";

/* ============================================================
   Time of Day — វដ្តពេលវេលា ២៤ ម៉ោង
   ============================================================ */
export interface TimeOfDay {
  hour: number;       // ០-២៤
  sunIntensity: number;
  sunColor: THREE.Color;
  skyColor: THREE.Color;
  ambientIntensity: number;
  fogColor: THREE.Color;
  fogNear: number;
  fogFar: number;
  isNight: boolean;
  isGoldenHour: boolean; // ម៉ោងមាស (ព្រឹក/ល្ងាច)
}

/* ពណ៌មេឃតាមម៉ោង */
const SKY_COLORS = {
  midnight: new THREE.Color("#0a1128"),    // ០-៤ យប់ជ្រៅ
  dawn: new THREE.Color("#ff9966"),        // ៥-៦ ព្រឹកព្រលឹម
  morning: new THREE.Color("#87ceeb"),     // ៧-១០ ព្រឹក
  noon: new THREE.Color("#5dade2"),        // ១១-១៤ ថ្ងៃត្រង់
  afternoon: new THREE.Color("#87ceeb"),   // ១៥-១៧ រសៀល
  sunset: new THREE.Color("#ff6b6b"),      // ១៨-១៩ ល្ងាច
  dusk: new THREE.Color("#2c3e50"),        // ២០-២១ ព្រលប់
  night: new THREE.Color("#0a1128"),       // ២២-២៣ យប់
};

const SUN_COLORS = {
  midnight: new THREE.Color("#4466aa"),
  dawn: new THREE.Color("#ffaa66"),
  noon: new THREE.Color("#ffffff"),
  sunset: new THREE.Color("#ff8866"),
  night: new THREE.Color("#334488"),
};

export function getTimeOfDay(hour: number): TimeOfDay {
  // Normalize 0-24
  const h = ((hour % 24) + 24) % 24;
  const isNight = h < 5.5 || h >= 20;
  const isGoldenHour = (h >= 5 && h < 7) || (h >= 17.5 && h < 19);

  let skyColor: THREE.Color;
  let sunColor: THREE.Color;
  let sunIntensity: number;

  if (h >= 5 && h < 6) {
    // ព្រឹកព្រលឹម
    skyColor = SKY_COLORS.dawn.clone();
    sunColor = SUN_COLORS.dawn.clone();
    sunIntensity = 0.6;
  } else if (h >= 6 && h < 11) {
    // ព្រឹក
    skyColor = SKY_COLORS.morning.clone();
    sunColor = SUN_COLORS.noon.clone();
    sunIntensity = 1.0 + (h - 6) * 0.1;
  } else if (h >= 11 && h < 15) {
    // ថ្ងៃត្រង់
    skyColor = SKY_COLORS.noon.clone();
    sunColor = SUN_COLORS.noon.clone();
    sunIntensity = 1.5;
  } else if (h >= 15 && h < 18) {
    // រសៀល
    skyColor = SKY_COLORS.afternoon.clone();
    sunColor = SUN_COLORS.noon.clone();
    sunIntensity = 1.5 - (h - 15) * 0.15;
  } else if (h >= 18 && h < 20) {
    // ល្ងាច
    skyColor = SKY_COLORS.sunset.clone();
    sunColor = SUN_COLORS.sunset.clone();
    sunIntensity = 0.8 - (h - 18) * 0.3;
  } else if (h >= 20 && h < 22) {
    // ព្រលប់
    skyColor = SKY_COLORS.dusk.clone();
    sunColor = SUN_COLORS.night.clone();
    sunIntensity = 0.2;
  } else {
    // យប់
    skyColor = SKY_COLORS.night.clone();
    sunColor = SUN_COLORS.midnight.clone();
    sunIntensity = 0.05;
  }

  // Fog
  const fogNear = isNight ? 150 : 250;
  const fogFar = isNight ? 400 : 700;

  return {
    hour: h,
    sunIntensity,
    sunColor,
    skyColor,
    ambientIntensity: isNight ? 0.15 : 0.65,
    fogColor: skyColor.clone(),
    fogNear,
    fogFar,
    isNight,
    isGoldenHour,
  };
}

/* ============================================================
   Sun Position — គណនាទីតាំងព្រះអាទិត្យតាមម៉ោង
   ============================================================ */
export function getSunPosition(hour: number, distance = 200): THREE.Vector3 {
  // ព្រះអាទិត្យឡើងពីខាងកើត (hour 6) → ថ្ងៃត្រង់ (hour 12) → លិចខាងលិច (hour 18)
  const angle = ((hour - 6) / 24) * Math.PI * 2;
  // ខ្ពស់បំផុតពេលថ្ងៃត្រង់
  const elevation = Math.sin(((hour - 6) / 12) * Math.PI); // 0-1-0

  const x = Math.cos(angle) * distance;
  const y = Math.max(0.1, elevation * distance) + 20;
  const z = Math.sin(angle) * distance * 0.5;

  return new THREE.Vector3(x, y, z);
}

/* ============================================================
   Time Controller
   ============================================================ */
export class TimeController {
  private hour: number;
  private speed: number; // hours per second
  private running: boolean;

  constructor(startHour = 10, speed = 0.5) {
    this.hour = startHour;
    this.speed = speed;
    this.running = true;
  }

  update(deltaSeconds: number): number {
    if (this.running) {
      this.hour = (this.hour + this.speed * deltaSeconds) % 24;
    }
    return this.hour;
  }

  getHour(): number {
    return this.hour;
  }

  setHour(h: number): void {
    this.hour = ((h % 24) + 24) % 24;
  }

  setSpeed(s: number): void {
    this.speed = s;
  }

  getSpeed(): number {
    return this.speed;
  }

  toggle(): void {
    this.running = !this.running;
  }

  isRunning(): boolean {
    return this.running;
  }

  formatTime(): string {
    const h = Math.floor(this.hour);
    const m = Math.floor((this.hour - h) * 60);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }
}

/* ============================================================
   Update Scene — អនុវត្ត Time of Day ទៅ Scene
   ============================================================ */
export function applyTimeOfDay(
  scene: THREE.Scene,
  sun: THREE.DirectionalLight,
  ambient: THREE.AmbientLight,
  time: TimeOfDay
): void {
  // មេឃ
  if (scene.background instanceof THREE.Color) {
    scene.background.lerp(time.skyColor, 0.1);
  } else {
    scene.background = time.skyColor.clone();
  }

  // Fog
  if (scene.fog) {
    scene.fog.color.lerp(time.fogColor, 0.1);
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.near = time.fogNear;
      scene.fog.far = time.fogFar;
    }
  }

  // ពន្លឺថ្ងៃ
  sun.intensity += (time.sunIntensity - sun.intensity) * 0.1;
  sun.color.lerp(time.sunColor, 0.1);

  // ទីតាំងព្រះអាទិត្យ
  const sunPos = getSunPosition(time.hour);
  sun.position.lerp(sunPos, 0.1);

  // ពន្លឺបរិស្ថាន
  ambient.intensity += (time.ambientIntensity - ambient.intensity) * 0.1;
}
