import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import "./CharacterGallery.css";

type Character = {
  id: number;
  name: string;
  role: string;
  gender: "male" | "female";
  height: number;
  image: string;
  model: string;
  description: string;
};

const characters: Character[] = [
  {
    id: 1, name: "សុភ័ក្រ", role: "Businessman",
    gender: "male", height: 180,
    image: "/characters/businessman.png",
    model: "/characters/businessman.glb",
    description: "អ្នកជំនួញ ស្លៀកឈុតអាវធំ និងក្រវ៉ាត់ក"
  },
  {
    id: 2, name: "ដារ៉ា", role: "Fashion Model",
    gender: "male", height: 178,
    image: "/characters/fashion-model.png",
    model: "/characters/fashion-model.glb",
    description: "តារាបង្ហាញម៉ូដ អាវពណ៌ខៀវស"
  },
  {
    id: 3, name: "គុសល", role: "Doctor",
    gender: "male", height: 182,
    image: "/characters/doctor.png",
    model: "/characters/doctor.glb",
    description: "វេជ្ជបណ្ឌិត ពាក់អាវពេទ្យពណ៌ស"
  },
  {
    id: 4, name: "លីហ្សា", role: "Businesswoman",
    gender: "female", height: 168,
    image: "/characters/businesswoman.png",
    model: "/characters/businesswoman.glb",
    description: "អ្នកជំនួញស្ត្រី សម្លៀកបំពាក់ទាន់សម័យ"
  },
  {
    id: 5, name: "ហ្សា", role: "Student",
    gender: "female", height: 162,
    image: "/characters/student.png",
    model: "/characters/student.glb",
    description: "និស្សិតស្រី សម្លៀកបំពាក់ធម្មតា"
  },
  {
    id: 6, name: "ស្រីពៅ", role: "Nurse",
    gender: "female", height: 166,
    image: "/characters/nurse.png",
    model: "/characters/nurse.glb",
    description: "គិលានុបដ្ឋាយិកា សម្លៀកបំពាក់ពេទ្យ"
  }
];

type Props = {
  onSelect?: (character: Character) => void;
};

function CharacterViewer({ character }: { character: Character }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [modelStatus, setModelStatus] = useState("កំពុងរៀបចំ 3D...");

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#101b31");

    const camera = new THREE.PerspectiveCamera(
      35,
      host.clientWidth / Math.max(host.clientHeight, 1),
      0.1,
      100
    );
    camera.position.set(3.2, 2.1, 4.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x34415d, 2));

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(3, 5, 4);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x39cfff, 1.5);
    rimLight.position.set(-4, 2, -3);
    scene.add(rimLight);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(2.2, 64),
      new THREE.MeshStandardMaterial({ color: "#182945", roughness: 0.9 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.16;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(4, 20, 0x426080, 0x263a55);
    grid.position.y = -0.15;
    scene.add(grid);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.85, 0);
    controls.enableDamping = true;
    controls.minDistance = 2.5;
    controls.maxDistance = 8;
    controls.maxPolarAngle = Math.PI * 0.49;

    let activeModel: THREE.Object3D | null = null;
    let mixer: THREE.AnimationMixer | null = null;
    const clock = new THREE.Clock();
    let disposed = false;

    const showFallback = () => {
      if (disposed) return;
      setModelStatus("រកមិនឃើញ Model GLB — សូមដាក់ឯកសារនៅ public/characters/");
    };

    new GLTFLoader().load(
      character.model,
      (gltf) => {
        if (disposed) return;
        if (activeModel) scene.remove(activeModel);

        activeModel = gltf.scene;
        const box = new THREE.Box3().setFromObject(activeModel);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxSize = Math.max(size.x, size.y, size.z) || 1;

        activeModel.scale.setScalar(2 / maxSize);
        activeModel.position.set(
          -center.x * (2 / maxSize),
          -box.min.y * (2 / maxSize),
          -center.z * (2 / maxSize)
        );

        activeModel.traverse((object) => {
          if ((object as THREE.Mesh).isMesh) {
            object.castShadow = true;
            object.receiveShadow = true;
          }
        });

        scene.add(activeModel);

        if (gltf.animations.length > 0) {
          mixer = new THREE.AnimationMixer(activeModel);
          const action = mixer.clipAction(gltf.animations[0]);
          action.reset();
          action.play();
          setModelStatus("បានផ្ទុកតួអង្គ 3D និង Animation");
        } else {
          setModelStatus("បានផ្ទុកតួអង្គ 3D — មិនមាន Animation");
        }
      },
      undefined,
      () => showFallback()
    );

    const resizeObserver = new ResizeObserver(() => {
      if (!host.clientWidth || !host.clientHeight) return;
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    });
    resizeObserver.observe(host);

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);
      mixer?.update(delta);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      controls.dispose();
      mixer?.stopAllAction();
      mixer = null;
      renderer.dispose();
      if (renderer.domElement.parentElement === host) {
        host.removeChild(renderer.domElement);
      }
      scene.traverse((object) => {
        if ((object as THREE.Mesh).isMesh) {
          const mesh = object as THREE.Mesh;
          mesh.geometry.dispose();
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((material) => material.dispose());
        }
      });
    };
  }, [character.model]);

  return (
    <section className="khoem-viewer">
      <div className="khoem-viewer-heading">
        <div>
          <h2>{character.name}</h2>
          <p>{character.role} · {character.height} cm</p>
        </div>
        <span className="khoem-3d-tag">3D VIEW</span>
      </div>
      <div className="khoem-canvas" ref={hostRef} />
      <p className="khoem-model-status">{modelStatus}</p>
      <p className="khoem-hint">អូសដើម្បីបង្វិល · Pinch ដើម្បី Zoom</p>
    </section>
  );
}

export default function Character3D({ onSelect }: Props) {
  const [gender, setGender] = useState("all");
  const [selected, setSelected] = useState<Character>(characters[1]);

  const filtered = characters.filter(
    (character) => gender === "all" || character.gender === gender
  );

  const chooseCharacter = (character: Character) => {
    setSelected(character);
    onSelect?.(character);
  };

  return (
    <main className="khoem-character">
      <header className="khoem-header">
        <div className="khoem-logo">
          <span>👑</span>
          <div>
            <h1>KHOEM-AI</h1>
            <p>3D CHARACTER STUDIO</p>
          </div>
        </div>
        <div className="khoem-header-info">CHARACTER LIBRARY</div>
      </header>

      <section className="character-intro">
        <h2>ស្ទូឌីយោតួអង្គ 3D</h2>
        <p>SELECT AND PREVIEW YOUR MOVIE CHARACTER</p>
      </section>

      <CharacterViewer character={selected} />

      <nav className="character-filters">
        <button className={gender === "all" ? "active" : ""} onClick={() => setGender("all")}>
          ទាំងអស់ ({characters.length})
        </button>
        <button className={gender === "male" ? "active" : ""} onClick={() => setGender("male")}>
          ♂ ប្រុស
        </button>
        <button className={gender === "female" ? "active" : ""} onClick={() => setGender("female")}>
          ♀ ស្រី
        </button>
      </nav>

      <section className="character-grid">
        {filtered.map((character) => (
          <article
            key={character.id}
            className={selected.id === character.id ? "character-card selected" : "character-card"}
            onClick={() => chooseCharacter(character)}
          >
            <div className="character-image">
              <img
                src={character.image}
                alt={character.name}
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
              <span className="character-number">#{String(character.id).padStart(2, "0")}</span>
              {selected.id === character.id && <span className="selected-mark">✓ SELECTED</span>}
            </div>
            <div className="character-details">
              <h3>{character.name}</h3>
              <p className="character-role">{character.role}</p>
              <p className="character-description">{character.description}</p>
              <div className="character-footer">
                <span>{character.gender === "male" ? "♂" : "♀"}</span>
                <span>{character.height} cm</span>
                <button onClick={(event) => {
                  event.stopPropagation();
                  chooseCharacter(character);
                }}>
                  មើល 3D
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      <footer className="khoem-footer">
        👑 KHOEM-AI © 2026
        <p>CREATE YOUR OWN MOVIE WORLD</p>
      </footer>
    </main>
  );
}
