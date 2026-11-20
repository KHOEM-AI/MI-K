import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { 
  createHospitalBuilding, createHospitalBed, createTree, createBench, 
  createAmbulance, createDoctor, createGarden, createPatient, 
  createHospitalSign, createFlower, createSirenLight, createNurse, 
  createWheelchair, createStreetLamp, createHelipad, createDriveway,
  createHelicopter, createCar, createSurgeryRoom, createVisitor,
  createStars, createRain, createTrafficSign, createColorfulLights,
  createFence, createStringLights, createACUnit, createStretcher,
  createVIPRoom, createReception, createDigitalTV, createLongBench, createGuardBooth
} from "./hospitalGeometry";

const SvgSoundOn = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>);
const SvgSoundOff = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>);
const SvgHelicopter = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M12 3v18M5 5l14 14M19 5L5 19"/><circle cx="12" cy="12" r="4"/></svg>);
const SvgCamera = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>);
const SvgMusic = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>);
const SvgEye = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>);
const SvgFollow = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>);

export default function Hospital3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const helicopterRef = useRef<THREE.Group | null>(null);

  const [isNight, setIsNight] = useState(false);
  const [isFlying, setIsFlying] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const [isRaining, setIsRaining] = useState(false);
  const [isFollow, setIsFollow] = useState(false);

  const nightRef = useRef(isNight);
  const flyingRef = useRef(isFlying);
  const soundRef = useRef(soundOn);
  const rainRef = useRef(isRaining);
  const followRef = useRef(isFollow);

  nightRef.current = isNight; flyingRef.current = isFlying; soundRef.current = soundOn; rainRef.current = isRaining; followRef.current = isFollow;

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sirenOscRef = useRef<OscillatorNode | null>(null);
  const musicOscRef = useRef<OscillatorNode[]>([]);

  const toggleSound = () => {
    if (!soundOn) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = "sawtooth"; osc.frequency.value = 600;
      const lfo = ctx.createOscillator(); lfo.type = "sine"; lfo.frequency.value = 2;
      const lfoGain = ctx.createGain(); lfoGain.gain.value = 200;
      lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
      gain.gain.value = 0.05;
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); lfo.start();
      sirenOscRef.current = osc; setSoundOn(true);
    } else {
      if (sirenOscRef.current) sirenOscRef.current.stop();
      setSoundOn(false);
    }
  };

  const toggleMusic = () => {
    if (!musicOn) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      const freqs = [261.63, 329.63, 392.00];
      musicOscRef.current = [];
      freqs.forEach(freq => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.type = "sine"; osc.frequency.value = freq; gain.gain.value = 0.02;
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); musicOscRef.current.push(osc);
      });
      setMusicOn(true);
    } else {
      musicOscRef.current.forEach(o => o.stop()); musicOscRef.current = [];
      setMusicOn(false);
    }
  };

  const takeScreenshot = () => {
    if (!rendererRef.current) return;
    const link = document.createElement("a");
    link.download = `hospital-${Date.now()}.png`;
    link.href = rendererRef.current.domElement.toDataURL("image/png");
    link.click();
  };

  const setBirdEye = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 70, 0.1);
      controlsRef.current.target.set(0, 0, 0);
    }
  };

  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 40, 100);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(30, 20, 45); camera.lookAt(0, 10, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
    sunLight.position.set(30, 50, 30); sunLight.castShadow = true; scene.add(sunLight);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); scene.add(ambientLight);

    // ធាតុមូលដ្ឋាន
    scene.add(createGarden());
    const driveway = createDriveway(); driveway.position.set(0, 0, 5); scene.add(driveway);
    const hospital = createHospitalBuilding(); hospital.position.set(0, 0, -5); scene.add(hospital);
    
    // AC Units
    for (let i = -2; i <= 2; i++) {
      const ac = createACUnit(); ac.position.set(i * 4, 15, 1.2); scene.add(ac);
      const ac2 = createACUnit(); ac2.position.set(i * 4, 25, 1.2); scene.add(ac2);
    }

    const helipad = createHelipad(); helipad.position.set(0, 30.2, -5); scene.add(helipad);
    const sign = createHospitalSign(THREE); sign.position.set(0, 32.5, -5); scene.add(sign);
    
    const helicopter = createHelicopter(); helicopter.position.set(0, 30.8, -5); scene.add(helicopter);
    helicopterRef.current = helicopter;

    // ធម្មជាតិ របង ភ្លើងអាលីបាបា
    [{ x: -12, z: 5, big: true }, { x: -10, z: 10, big: false }, { x: 12, z: 5, big: true }, { x: 10, z: 10, big: false }].forEach(pos => {
      const tree = createTree(pos.big); tree.position.set(pos.x, 0, pos.z); scene.add(tree);
    });
    for (let i = 0; i < 20; i++) {
      const f = createFlower([0xff69b4, 0xff0000, 0xffff00, 0xffa500][i%4]);
      f.position.set((Math.random() - 0.5) * 30, 0, Math.random() * 15); scene.add(f);
    }
    const fence = createFence(); fence.position.set(0, 0, 0); scene.add(fence);
    const stringLights = createStringLights(); scene.add(stringLights);

    // ធាតុផ្សេងៗ
    const bench1 = createBench(); bench1.position.set(-6, 0, 12); bench1.rotation.y = Math.PI / 2; scene.add(bench1);
    const bench2 = createBench(); bench2.position.set(6, 0, 12); bench2.rotation.y = -Math.PI / 2; scene.add(bench2);
    const lamp1 = createStreetLamp(); lamp1.position.set(-8, 0, 6); scene.add(lamp1);
    const lamp2 = createStreetLamp(); lamp2.position.set(8, 0, 6); lamp2.rotation.y = Math.PI; scene.add(lamp2);
    const ambulance = createAmbulance(); ambulance.position.set(-8, 0, 18); scene.add(ambulance);
    const siren = createSirenLight(); siren.position.set(-8.6, 2.6, 20.5); scene.add(siren);
    
    // ឡានចត
    const car1 = createCar(0xff0000); car1.position.set(10, 0, 22); car1.rotation.y = Math.PI / 2; scene.add(car1);
    const car2 = createCar(0x0000ff); car2.position.set(13, 0, 22); car2.rotation.y = Math.PI / 2; scene.add(car2);
    const car3 = createCar(0x00ff00); car3.position.set(16, 0, 22); car3.rotation.y = Math.PI / 2; scene.add(car3);
    
    // បន្ទប់វះកាត់, VIP, ទីស្នាក់ការគិតលុយ
    const surgeryRoom = createSurgeryRoom(); surgeryRoom.position.set(-15, 0, -5); scene.add(surgeryRoom);
    const vipRoom = createVIPRoom(); vipRoom.position.set(15, 0, -5); scene.add(vipRoom);
    const reception = createReception(); reception.position.set(0, 0, 8); scene.add(reception);

    // បន្ថែមកៅអីអង្គុយវែង តាមទីតាំងផ្សេងៗ
    // 1. នៅតាមសួនច្បារ (អង្គុយលេង)
    const gardenBench1 = createLongBench(5); gardenBench1.position.set(-13, 0, 8); gardenBench1.rotation.y = Math.PI / 2; scene.add(gardenBench1);
    const gardenBench2 = createLongBench(3); gardenBench2.position.set(13, 0, 8); gardenBench2.rotation.y = -Math.PI / 2; scene.add(gardenBench2);
    
    // 2. នៅកន្លែងសង្គ្រោះបន្ទាន់ (ក្បែរឡានសង្គ្រោះ)
    const emergencyBench = createLongBench(3); emergencyBench.position.set(-3, 0, 19); emergencyBench.rotation.y = Math.PI / 2; scene.add(emergencyBench);
    
    // 3. នៅកន្លែងគិតប្រាក់ (Reception)
    const receptionBench1 = createLongBench(6); receptionBench1.position.set(-5, 0, 10); scene.add(receptionBench1);
    const receptionBench2 = createLongBench(5); receptionBench2.position.set(5, 0, 10); scene.add(receptionBench2);
    
    // 4. កន្លែងយាម (បន្ទប់យាម និងកៅអីអង្គុយយាម)
    const guardBooth = createGuardBooth(); guardBooth.position.set(-15, 0, 18); scene.add(guardBooth);
    const guardBench = createLongBench(3); guardBench.position.set(-11, 0, 18); guardBench.rotation.y = -Math.PI / 2; scene.add(guardBench);

    // បន្ថែមទូរទស្សន៍អក្សររត់
    const digitalTV = createDigitalTV(); digitalTV.position.set(0, 2.8, 7.2); digitalTV.rotation.y = Math.PI; scene.add(digitalTV);

    // មនុស្ស និងរទេះ
    [{ x: 12, z: -2 }, { x: 12, z: -6 }].forEach(pos => {
      const bed = createHospitalBed(); bed.position.set(pos.x, 0, pos.z); scene.add(bed);
      const patient = createPatient(); patient.position.set(pos.x, 0, pos.z); scene.add(patient);
    });
    const doc1 = createDoctor(false); doc1.position.set(-2, 0, 12); scene.add(doc1);
    const doc2 = createDoctor(true); doc2.position.set(2, 0, 12); scene.add(doc2);
    const nurse1 = createNurse(); nurse1.position.set(4, 0, 6); scene.add(nurse1);
    const wc = createWheelchair(); wc.position.set(-4, 0, 6); scene.add(wc);
    
    // រទេះរុញគ្រែ និងគិលានុបដ្ឋាយិការុញ
    const stretcher = createStretcher(); stretcher.position.set(0, 0, 15); scene.add(stretcher);
    const stretcherNurse = createNurse(); stretcherNurse.position.set(0.8, 0, 14); scene.add(stretcherNurse);

    const visitor1 = createVisitor(0xffaa00); visitor1.position.set(-5, 0, 15); scene.add(visitor1);
    const visitor2 = createVisitor(0x9900ff); visitor2.position.set(5, 0, 16); scene.add(visitor2);

    // ភ្លៀង, ផ្កាយ, ផ្លាកសញ្ញា
    const stars = createStars(); scene.add(stars);
    const rain = createRain(); rain.visible = false; scene.add(rain);
    const sign1 = createTrafficSign(); sign1.position.set(-12, 0, 20); scene.add(sign1);
    const sign2 = createTrafficSign(); sign2.position.set(12, 0, 20); sign2.rotation.y = Math.PI; scene.add(sign2);
    const colorfulLights = createColorfulLights(); colorfulLights.position.set(0, 0, 12); scene.add(colorfulLights);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.target.set(0, 10, 0);
    controls.maxPolarAngle = Math.PI / 2.1;
    controlsRef.current = controls;

    const windowMat = hospital.userData.windowMaterial;
    const neonLight = sign.userData.neonLight;
    const rainPositions = (rain.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;
    
    let animationId: number;
    const clock = new THREE.Clock();
    
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const isNightMode = nightRef.current;
      const isFlyingMode = flyingRef.current;
      const isFollowMode = followRef.current;

      // ភ្លើងសង្គ្រោះ
      if (siren.material instanceof THREE.MeshStandardMaterial) {
        siren.material.emissiveIntensity = 1 + ((Math.sin(elapsed * 8) + 1) / 2) * 3;
      }

      // កង្ហារ & ហោះហើរ
      if (helicopter.userData.rotorGroup) helicopter.userData.rotorGroup.rotation.y += isFlyingMode ? 2.5 : 0.8;
      if (isFlyingMode) {
        helicopter.position.y += (45 - helicopter.position.y) * 0.02;
        helicopter.position.x = Math.sin(elapsed * 0.4) * 15;
        helicopter.position.z = Math.cos(elapsed * 0.4) * 15 - 5;
        helicopter.rotation.y += 0.02;
      } else {
        helicopter.position.y += (30.8 - helicopter.position.y) * 0.05;
        helicopter.position.x += (0 - helicopter.position.x) * 0.05;
        helicopter.position.z += (-5 - helicopter.position.z) * 0.05;
      }

      // Follow Helicopter
      if (isFollowMode) {
        controls.target.lerp(helicopter.position, 0.1);
        const offset = new THREE.Vector3(15, 10, 15);
        const targetCamPos = helicopter.position.clone().add(offset);
        camera.position.lerp(targetCamPos, 0.05);
      }

      // ចលនារទេះរុញគ្រែ និងគិលានុបដ្ឋាយិកា
      const stretcherX = Math.sin(elapsed * 0.8) * 8;
      stretcher.position.x = stretcherX;
      stretcherNurse.position.x = stretcherX + 0.8;
      stretcherNurse.rotation.y = Math.cos(elapsed * 0.8) > 0 ? Math.PI/2 : -Math.PI/2;

      // មនុស្សផ្សេងទៀត
      doc1.position.z = 12 + Math.sin(elapsed * 1.5) * 3;
      doc1.rotation.y = Math.cos(elapsed * 1.5) > 0 ? 0 : Math.PI;
      doc2.position.x = 2 + Math.cos(elapsed * 1.2) * 2; doc2.position.z = 6 + Math.sin(elapsed * 1.2) * 2;
      nurse1.position.z = 6 + Math.sin(elapsed * 2 + 2) * 4;
      nurse1.rotation.y = Math.cos(elapsed * 2 + 2) > 0 ? 0 : Math.PI;
      wc.position.x = -4 + Math.sin(elapsed * 0.8) * 5;
      visitor1.position.z = 15 + Math.sin(elapsed * 1.2) * 5;
      visitor1.rotation.y = Math.cos(elapsed * 1.2) > 0 ? 0 : Math.PI;
      visitor2.position.x = 5 + Math.cos(elapsed * 1) * 4;
      visitor2.rotation.y = Math.cos(elapsed * 1) > 0 ? -Math.PI / 2 : Math.PI / 2;

      // អក្សររត់លើទូរទស្សន៍
      if (digitalTV.userData.ctx && digitalTV.userData.texture) {
        const ctx = digitalTV.userData.ctx;
        ctx.fillStyle = '#001122';
        ctx.fillRect(0, 0, 512, 256);
        
        ctx.fillStyle = '#00ffcc';
        ctx.font = 'bold 40px sans-serif';
        ctx.textAlign = 'center';
        
        const textX = 512 - ((elapsed * 100) % 1000);
        ctx.fillText('Welcome to KHOEM-AI Hospital', textX, 128);
        ctx.font = 'bold 20px sans-serif';
        ctx.fillStyle = '#ffaa00';
        ctx.fillText('Emergency: 119', 256, 200);
        
        digitalTV.userData.texture.needsUpdate = true;
      }

      // Day/Night
      const targetBg = isNightMode ? new THREE.Color(0x0a1128) : new THREE.Color(0x87ceeb);
      if (scene.background instanceof THREE.Color) {
        scene.background.lerp(targetBg, 0.05);
        if (scene.fog instanceof THREE.Fog) scene.fog.color.copy(scene.background);
      }
      sunLight.intensity += ((isNightMode ? 0.1 : 2.5) - sunLight.intensity) * 0.05;
      ambientLight.intensity += ((isNightMode ? 0.2 : 0.5) - ambientLight.intensity) * 0.05;

      // ភ្លើងអាលីបាបា
      if (isNightMode) {
        stringLights.children.forEach(child => {
          if (child instanceof THREE.PointLight) child.intensity = 1.5 + Math.sin(elapsed * 3 + child.position.x) * 0.5;
        });
      } else {
        stringLights.children.forEach(child => {
          if (child instanceof THREE.PointLight) child.intensity = 0;
        });
      }

      if (stars.material instanceof THREE.PointsMaterial) {
        stars.material.opacity += ((isNightMode ? 1 : 0) - stars.material.opacity) * 0.05;
        stars.rotation.y += 0.0002;
      }
      if (rainRef.current) {
        rain.visible = true;
        for (let i = 1; i < rainPositions.length; i += 3) {
          rainPositions[i] -= 0.6;
          if (rainPositions[i] < 0) rainPositions[i] = 50;
        }
        (rain.geometry as THREE.BufferGeometry).attributes.position.needsUpdate = true;
      } else {
        rain.visible = false;
      }

      if (isNightMode && colorfulLights.userData.lights) {
        (colorfulLights.userData.lights as THREE.PointLight[]).forEach((light, i) => {
          light.intensity = 1.5 + Math.sin(elapsed * 3 + i) * 1.5;
        });
      } else if (colorfulLights.userData.lights) {
        (colorfulLights.userData.lights as THREE.PointLight[]).forEach(light => { light.intensity = 0; });
      }

      if (neonLight) neonLight.intensity += ((isNightMode ? 3 : 0) - neonLight.intensity) * 0.05;
      if (windowMat) windowMat.emissiveIntensity += ((isNightMode ? 2.5 : 0.6) - windowMat.emissiveIntensity) * 0.05;
      
      [lamp1, lamp2].forEach(lamp => {
        lamp.traverse(child => { if (child instanceof THREE.PointLight) child.intensity += ((isNightMode ? 2 : 0) - child.intensity) * 0.05; });
      });
      if (surgeryRoom.userData.surgeryLight) surgeryRoom.userData.surgeryLight.intensity = 5 + Math.sin(elapsed * 10) * 0.5;

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      renderer.dispose();
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
      if (sirenOscRef.current) sirenOscRef.current.stop();
      musicOscRef.current.forEach(o => o.stop());
    };
  }, []);

  const btnStyle: React.CSSProperties = { padding: "10px 15px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px", color: "#fff" };

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
      <div style={{ position: "absolute", top: "20px", right: "20px", display: "flex", flexDirection: "column", gap: "10px", zIndex: 10 }}>
        <button onClick={() => setIsNight(!isNight)} style={{ ...btnStyle, backgroundColor: isNight ? "#f1c40f" : "#2c3e50", color: isNight ? "#000" : "#fff" }}>
          {isNight ? "☀️ Day Mode" : "🌙 Night Mode"}
        </button>
        <button onClick={toggleSound} style={{ ...btnStyle, backgroundColor: soundOn ? "#e74c3c" : "#34495e" }}>
          {soundOn ? <SvgSoundOff /> : <SvgSoundOn />} {soundOn ? "Mute Siren" : "Play Siren"}
        </button>
        <button onClick={toggleMusic} style={{ ...btnStyle, backgroundColor: musicOn ? "#9b59b6" : "#34495e" }}>
          <SvgMusic /> {musicOn ? "Stop Music" : "Background Music"}
        </button>
        <button onClick={() => setIsFlying(!isFlying)} style={{ ...btnStyle, backgroundColor: isFlying ? "#27ae60" : "#2980b9" }}>
          <SvgHelicopter /> {isFlying ? "Land" : "Takeoff"}
        </button>
        <button onClick={() => setIsRaining(!isRaining)} style={{ ...btnStyle, backgroundColor: isRaining ? "#3498db" : "#34495e" }}>
          🌧️ {isRaining ? "Stop Rain" : "Start Rain"}
        </button>
        <button onClick={setBirdEye} style={{ ...btnStyle, backgroundColor: "#8e44ad" }}>
          <SvgEye /> Bird's Eye View
        </button>
        <button onClick={() => setIsFollow(!isFollow)} style={{ ...btnStyle, backgroundColor: isFollow ? "#e67e22" : "#34495e" }}>
          <SvgFollow /> {isFollow ? "Stop Follow" : "Follow Helicopter"}
        </button>
        <button onClick={takeScreenshot} style={{ ...btnStyle, backgroundColor: "#16a085" }}>
          <SvgCamera /> Screenshot
        </button>
      </div>
    </div>
  );
}
