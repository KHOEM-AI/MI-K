import type { Group, Material, Mesh } from "three";

type Three = typeof import("three");

type VehicleStyle = "sedan" | "offroad";

function getStyle(key: string): VehicleStyle {
  return /off.?road|4x4|suv|crossover/.test(key.toLowerCase())
    ? "offroad"
    : "sedan";
}

function getColor(key: string, T: Three): number {
  const k = key.toLowerCase();

  if (/red/.test(k)) return 0xb8202d;
  if (/blue/.test(k)) return 0x164b91;
  if (/white/.test(k)) return 0xe7e9ed;
  if (/black/.test(k)) return 0x17191e;
  if (/green/.test(k)) return 0x405c37;
  if (/silver/.test(k)) return 0x9da7b3;

  return /off.?road|4x4/.test(k) ? 0x52613c : 0x263c62;
}

export function sideView(key: string) {
  const offroad = getStyle(key) === "offroad";

  return {
    body: offroad
      ? [[-2.5, 0.45], [-2.5, 1.35], [-1.2, 1.55], [1.7, 1.55], [2.5, 1.1], [2.5, 0.45]]
      : [[-2.4, 0.35], [-2.4, 0.95], [-1.3, 1.05], [-0.8, 1.55], [0.9, 1.55], [1.5, 1.05], [2.4, 0.85], [2.4, 0.35]],
    glass: offroad
      ? [[-1.1, 1.4], [-0.7, 2.0], [0.8, 2.0], [1.5, 1.4]]
      : [[-1.15, 1.08], [-0.72, 1.48], [0.78, 1.48], [1.2, 1.08]],
    wheels: offroad
      ? [{ z: -1.55, r: 0.55 }, { z: 1.55, r: 0.55 }]
      : [{ z: -1.5, r: 0.38 }, { z: 1.5, r: 0.38 }],
    L: 5
  };
}

export function buildVehicle(T: Three, key: string): Group {
  const style = getStyle(key);
  const offroad = style === "offroad";
  const color = getColor(key, T);

  const root = new T.Group();
  root.name = offroad ? "KHOEM-AI Offroad 4x4" : "KHOEM-AI Sedan";

  const material = (
    name: string,
    colorValue: number,
    metalness = 0.35,
    roughness = 0.45
  ): Material => {
    const m = new T.MeshStandardMaterial({
      color: colorValue,
      metalness,
      roughness
    });
    m.name = name;
    return m;
  };

  const body = material("body", color, 0.72, 0.27);
  const dark = material("black_trim", 0x15191e, 0.25, 0.65);
  const glass = material("glass", 0x142b40, 0.85, 0.12);
  const rubber = material("tyre", 0x111214, 0.05, 0.92);
  const rim = material("rim", 0xb8c3ce, 0.9, 0.2);
  const chrome = material("chrome", 0x9ba8b4, 0.92, 0.22);
  const seat = material("interior", 0x20242a, 0.1, 0.8);
  const headlight = material("LED_headlight", 0xeaf5ff, 0.25, 0.16);
  const taillight = material("LED_taillight", 0xb51c24, 0.2, 0.25);

  const box = (
    name: string,
    w: number,
    h: number,
    d: number,
    mat: Material,
    x: number,
    y: number,
    z: number,
    bevel = false
  ): Mesh => {
    const geo = new T.BoxGeometry(w, h, d);
    const mesh = new T.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    root.add(mesh);
    return mesh;
  };

  const wheelRadius = offroad ? 0.53 : 0.37;
  const wheelWidth = offroad ? 0.34 : 0.25;
  const wheelZ = offroad ? [-1.55, 1.55] : [-1.48, 1.48];
  const width = offroad ? 2.15 : 1.88;
  const baseY = wheelRadius + 0.12;

  // Lower chassis and main body.
  box("chassis", width * 0.88, 0.3, 4.25, dark, 0, baseY + 0.05, 0);
  box("lower_body", width, 0.52, 4.75, body, 0, baseY + 0.38, 0);

  // Hood and rear deck.
  box("hood", width * 0.94, 0.25, 1.12, body, 0, baseY + 0.68, 1.62);
  box("rear_deck", width * 0.94, 0.26, 0.92, body, 0, baseY + 0.67, -1.85);

  // Cabin shape.
  const cabinY = baseY + (offroad ? 1.38 : 1.22);
  const cabinLength = offroad ? 2.55 : 2.35;
  const cabinHeight = offroad ? 1.12 : 0.91;

  box("roof", width * 0.77, 0.16, cabinLength, body, 0, cabinY + cabinHeight / 2, -0.05);

  // Front and rear windshields.
  const windshield = box(
    "front_windshield",
    width * 0.73,
    cabinHeight * 0.82,
    0.07,
    glass,
    0,
    cabinY,
    1.05
  );
  windshield.rotation.x = -0.28;

  const rearGlass = box(
    "rear_windshield",
    width * 0.72,
    cabinHeight * 0.72,
    0.07,
    glass,
    0,
    cabinY,
    -1.15
  );
  rearGlass.rotation.x = 0.28;

  // Side windows and pillars.
  for (const side of [-1, 1]) {
    const x = side * (width * 0.39);

    box("side_window_front", 0.045, cabinHeight * 0.68, 0.95, glass, x, cabinY, 0.48);
    box("side_window_rear", 0.045, cabinHeight * 0.68, 0.88, glass, x, cabinY, -0.55);

    box("window_pillar", 0.09, cabinHeight, 0.1, dark, x, cabinY, -0.05);

    // Mirrors.
    box("side_mirror", 0.2, 0.13, 0.22, dark, side * (width * 0.53), cabinY - 0.08, 0.83);

    // Door handles.
    box("door_handle", 0.035, 0.045, 0.22, chrome, side * (width * 0.505), baseY + 0.58, -0.15);

    // Door lower trim.
    box("side_sill", 0.055, 0.12, 2.1, dark, side * (width * 0.51), baseY + 0.2, 0);
  }

  // Wheel assemblies.
  const wheelAt = (side: number, z: number, index: number) => {
    const x = side * (width / 2 - wheelWidth / 2 + 0.02);
    const group = new T.Group();
    group.name = `wheel_${index}_${side}`;

    group.position.set(x, wheelRadius, z);

    const tire = new T.Mesh(
      new T.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 32),
      rubber
    );
    tire.rotation.z = Math.PI / 2;
    tire.name = "tyre";
    group.add(tire);

    const wheelRim = new T.Mesh(
      new T.CylinderGeometry(wheelRadius * 0.64, wheelRadius * 0.64, wheelWidth * 1.04, 24),
      rim
    );
    wheelRim.rotation.z = Math.PI / 2;
    wheelRim.name = "rim";
    group.add(wheelRim);

    const hub = new T.Mesh(
      new T.CylinderGeometry(wheelRadius * 0.15, wheelRadius * 0.15, wheelWidth * 1.1, 16),
      chrome
    );
    hub.rotation.z = Math.PI / 2;
    group.add(hub);

    root.add(group);

    // Wheel arch trim.
    const arch = new T.Mesh(
      new T.TorusGeometry(wheelRadius * 1.13, 0.055, 8, 32),
      dark
    );
    arch.rotation.y = Math.PI / 2;
    arch.position.set(side * (width / 2 + 0.005), wheelRadius + 0.02, z);
    arch.name = `wheel_arch_${index}_${side}`;
    root.add(arch);
  };

  wheelZ.forEach((z, i) => {
    wheelAt(-1, z, i);
    wheelAt(1, z, i);
  });

  // Front bumper, grille and lights.
  box("front_bumper", width * 1.04, 0.2, 0.18, dark, 0, baseY + 0.3, 2.43);
  box("front_grille", width * 0.4, 0.27, 0.06, dark, 0, baseY + 0.62, 2.42);

  for (const side of [-1, 1]) {
    box("headlight", 0.42, 0.2, 0.08, headlight, side * width * 0.34, baseY + 0.72, 2.43);
    box("fog_light", 0.2, 0.1, 0.07, headlight, side * width * 0.39, baseY + 0.35, 2.44);
    box("taillight", 0.3, 0.25, 0.08, taillight, side * width * 0.37, baseY + 0.68, -2.42);
  }

  // Rear bumper.
  box("rear_bumper", width * 1.04, 0.2, 0.18, dark, 0, baseY + 0.3, -2.43);

  // Interior seats visible through windows.
  for (const side of [-1, 1]) {
    box("front_seat", 0.52, 0.58, 0.45, seat, side * 0.38, cabinY - 0.35, 0.35);
    box("rear_seat", 0.52, 0.5, 0.42, seat, side * 0.38, cabinY - 0.38, -0.55);
  }

  if (offroad) {
    // Off-road suspension, high clearance and roof rack.
    box("front_skid_plate", width * 0.7, 0.1, 0.48, chrome, 0, baseY - 0.02, 2.35);
    box("roof_rack", width * 0.78, 0.09, 2.0, dark, 0, cabinY + cabinHeight / 2 + 0.16, -0.05);

    for (const side of [-1, 1]) {
      box("running_board", 0.22, 0.12, 1.55, dark, side * (width / 2 + 0.08), baseY + 0.12, 0);
      box("fender", 0.12, 0.12, 1.2, dark, side * (width / 2 + 0.04), wheelRadius + 0.42, 0);
    }

    // Spare wheel at rear.
    const spare = new T.Mesh(
      new T.TorusGeometry(0.43, 0.14, 12, 32),
      rubber
    );
    spare.position.set(0, baseY + 0.68, -2.55);
    spare.rotation.x = Math.PI / 2;
    spare.name = "spare_wheel";
    root.add(spare);
  } else {
    // Sedan: clean roof and subtle rear lip.
    box("rear_lip", width * 0.72, 0.07, 0.22, body, 0, baseY + 0.9, -2.12);
  }

  root.position.y = 0;
  return root;
}
