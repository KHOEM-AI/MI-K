import * as THREE from 'three';

// ─── Realistic water shader: waves, gradient, fake specular ─────
// The mesh exposes its ShaderMaterial in userData so an animation
// loop can advance uTime each frame.

const VERTEX = `
  uniform float uTime;
  varying float vHeight;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 p = position;

    // Three overlapping waves — smooth, no high frequency noise
    float h = 0.0;
    h += sin(p.x * 0.10 + uTime * 0.8) * 0.55;
    h += sin(p.y * 0.14 + uTime * 1.1) * 0.35;
    h += sin((p.x + p.y) * 0.07 + uTime * 0.5) * 0.60;

    p.z += h;
    vHeight = h;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const FRAGMENT = `
  uniform vec3 uColorDeep;
  uniform vec3 uColorShallow;
  uniform vec3 uSunColor;
  varying float vHeight;
  varying vec2 vUv;

  void main() {
    // Wave crests get the shallow colour, troughs get the deep colour
    float t = smoothstep(-0.9, 0.9, vHeight);
    vec3 base = mix(uColorDeep, uColorShallow, t);

    // Cheap specular where the water rises
    float spec = pow(max(0.0, vHeight + 0.4), 6.0) * 0.55;
    vec3 finalColor = base + uSunColor * spec;

    // Gentle foam at the very top of big crests
    float foam = smoothstep(0.7, 1.1, vHeight) * 0.25;
    finalColor = mix(finalColor, vec3(0.95, 0.98, 1.0), foam);

    gl_FragColor = vec4(finalColor, 0.92);
  }
`;

export function createOcean(size: number = 2000): THREE.Mesh {
  // 128x128 grid is dense enough for smooth waves, light enough for a phone
  const geo = new THREE.PlaneGeometry(size, size, 128, 128);

  const uniforms = {
    uTime: { value: 0 },
    uColorDeep: { value: new THREE.Color(0x002f5f) },
    uColorShallow: { value: new THREE.Color(0x4a9fd4) },
    uSunColor: { value: new THREE.Color(0xfff6d8) },
  };

  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -3;
  mesh.name = 'ocean-water';
  mesh.userData.waterMaterial = mat;

  return mesh;
}

export function createSkyAndLights(scene: THREE.Scene): void {
  scene.background = new THREE.Color(0x87CEEB);
  scene.fog = new THREE.Fog(0x87CEEB, 500, 1500);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
  hemiLight.position.set(0, 200, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(200, 300, 100);
  dirLight.castShadow = true;
  dirLight.shadow.camera.top = 300;
  dirLight.shadow.camera.bottom = -300;
  dirLight.shadow.camera.left = -300;
  dirLight.shadow.camera.right = 300;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  scene.add(dirLight);
}
