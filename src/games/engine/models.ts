import * as THREE from 'three';

export type VehicleStyle = 'toy' | 'sport' | 'hypercar' | 'formula' | 'offroad' | 'drift';

export interface VehicleRig {
  group: THREE.Group;
  bodyMesh: THREE.Mesh;
  wheels: THREE.Group[];
  frontSteerPivots: THREE.Group[];
  taillights: THREE.Mesh[];
  setBodyColor: (hex: number) => void;
}

export function buildVehicleModel(style: VehicleStyle, primaryColor = 0x38bdf8): VehicleRig {
  const group = new THREE.Group();
  const wheels: THREE.Group[] = [];
  const frontSteerPivots: THREE.Group[] = [];
  const taillights: THREE.Mesh[] = [];

  const isToy = style === 'toy';
  const isFormula = style === 'formula';
  const isOffroad = style === 'offroad';
  const isHyper = style === 'hypercar' || style === 'drift';

  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: primaryColor,
    metalness: isToy ? 0.12 : 0.72,
    roughness: isToy ? 0.35 : 0.22,
    clearcoat: isToy ? 0.4 : 1.0,
    clearcoatRoughness: 0.12,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    metalness: 0.45,
    roughness: 0.65,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a,
    metalness: 0.1,
    roughness: 0.08,
    clearcoat: 1.0,
  });

  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xfef9c3,
    emissive: 0xfef08a,
    emissiveIntensity: 1.3,
    roughness: 0.2,
  });

  const tailMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 1.1,
    roughness: 0.25,
  });

  const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.88, metalness: 0.05 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.22, metalness: 0.88 });

  const rideHeight = isOffroad ? 0.52 : isFormula ? 0.24 : 0.34;
  const chassisWidth = isFormula ? 1.45 : isOffroad ? 2.15 : 1.92;
  const chassisLength = isFormula ? 4.4 : isToy ? 3.3 : 4.2;

  // 1. Primary Chassis
  const chassisGeo = new THREE.BoxGeometry(
    chassisWidth,
    isFormula ? 0.42 : isOffroad ? 0.72 : 0.56,
    chassisLength
  );
  const bodyMesh = new THREE.Mesh(chassisGeo, bodyMat);
  bodyMesh.position.y = rideHeight + (isFormula ? 0.21 : 0.32);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // 2. Cabin / Cockpit / Halo
  if (isFormula) {
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.28, 1.8), bodyMat);
    nose.position.set(0, rideHeight + 0.26, -1.7);
    nose.castShadow = true;
    group.add(nose);

    const frontWing = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.08, 0.45), trimMat);
    frontWing.position.set(0, rideHeight + 0.08, -2.35);
    group.add(frontWing);

    const pod = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.42, 1.3), bodyMat);
    pod.position.set(0, rideHeight + 0.5, 0.35);
    group.add(pod);

    // Halo + helmet
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.04, 8, 16, Math.PI), trimMat);
    halo.rotation.x = Math.PI / 2;
    halo.position.set(0, rideHeight + 0.65, -0.2);
    group.add(halo);

    const helmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.5 })
    );
    helmet.position.set(0, rideHeight + 0.62, -0.05);
    group.add(helmet);
  } else {
    const cabinW = chassisWidth * 0.82;
    const cabinH = isOffroad ? 0.62 : isToy ? 0.68 : 0.46;
    const cabinL = isToy ? 1.8 : isOffroad ? 2.2 : 1.95;
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(cabinW, cabinH, cabinL), glassMat);
    cabin.position.set(0, rideHeight + (isOffroad ? 0.92 : 0.72), isToy ? 0.05 : 0.15);
    cabin.castShadow = true;
    group.add(cabin);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(cabinW * 0.94, 0.09, cabinL * 0.88), bodyMat);
    roof.position.set(0, cabin.position.y + cabinH * 0.5 + 0.02, cabin.position.z);
    group.add(roof);

    if (isOffroad) {
      // Roof rack + spare tire
      const rack = new THREE.Mesh(new THREE.BoxGeometry(cabinW * 0.85, 0.12, 1.3), trimMat);
      rack.position.set(0, roof.position.y + 0.1, 0.25);
      group.add(rack);

      const spare = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.24, 16), tireMat);
      spare.rotation.x = Math.PI / 2;
      spare.position.set(0, rideHeight + 0.65, chassisLength * 0.52);
      group.add(spare);
    }
  }

  // 3. Rear Spoiler / Wing
  if (isHyper || isFormula || style === 'sport') {
    const wingY = isFormula ? rideHeight + 0.86 : rideHeight + 0.82;
    const wing = new THREE.Mesh(new THREE.BoxGeometry(chassisWidth * 1.05, 0.08, 0.36), trimMat);
    wing.position.set(0, wingY, chassisLength * 0.46);
    wing.castShadow = true;
    group.add(wing);

    [-0.52, 0.52].forEach((sx) => {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.18), trimMat);
      strut.position.set(sx, wingY - 0.16, chassisLength * 0.46);
      group.add(strut);
    });
  }

  // 4. Front Splitter & Headlights / Taillights
  const splitter = new THREE.Mesh(new THREE.BoxGeometry(chassisWidth * 1.02, 0.1, 0.25), trimMat);
  splitter.position.set(0, rideHeight + 0.08, -chassisLength * 0.5);
  group.add(splitter);

  [-chassisWidth * 0.33, chassisWidth * 0.33].forEach((lx) => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.08), headlightMat);
    hl.position.set(lx, rideHeight + 0.34, -chassisLength * 0.5 - 0.02);
    group.add(hl);

    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.08), tailMat.clone());
    tl.position.set(lx, rideHeight + 0.38, chassisLength * 0.5 + 0.02);
    taillights.push(tl);
    group.add(tl);
  });

  // 5. Four Wheels (Bottom-center grounded at y = 0!)
  const wheelRadius = isOffroad ? 0.48 : isFormula ? 0.36 : 0.36;
  const wheelWidth = isFormula ? 0.36 : isOffroad ? 0.34 : 0.28;
  const wheelX = isFormula ? 0.92 : chassisWidth * 0.5 + 0.05;
  const frontZ = -chassisLength * 0.33;
  const rearZ = chassisLength * 0.33;

  const wheelPositions: [number, number, boolean][] = [
    [-wheelX, frontZ, true],
    [wheelX, frontZ, true],
    [-wheelX, rearZ, false],
    [wheelX, rearZ, false],
  ];

  const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 20);
  tireGeo.rotateZ(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.56, wheelRadius * 0.56, wheelWidth + 0.03, 12);
  rimGeo.rotateZ(Math.PI / 2);

  for (const [wx, wz, isFront] of wheelPositions) {
    const steerPivot = new THREE.Group();
    steerPivot.position.set(wx, wheelRadius, wz);

    const wheelSpin = new THREE.Group();
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.castShadow = true;
    const rim = new THREE.Mesh(rimGeo, rimMat);
    wheelSpin.add(tire, rim);
    steerPivot.add(wheelSpin);
    group.add(steerPivot);

    wheels.push(wheelSpin);
    if (isFront) frontSteerPivots.push(steerPivot);
  }

  return {
    group,
    bodyMesh,
    wheels,
    frontSteerPivots,
    taillights,
    setBodyColor: (hex: number) => {
      bodyMat.color.setHex(hex);
    },
  };
}

export interface SportBikeRig {
  group: THREE.Group;
  leanPivot: THREE.Group;
  wheels: THREE.Group[];
}

export function buildSportBikeModel(colorHex = 0xef4444): SportBikeRig {
  const group = new THREE.Group();
  const leanPivot = new THREE.Group();
  group.add(leanPivot);
  const wheels: THREE.Group[] = [];

  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: colorHex,
    metalness: 0.75,
    roughness: 0.2,
    clearcoat: 1.0,
  });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.6, metalness: 0.5 });
  const riderMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
  const helmetMat = new THREE.MeshPhysicalMaterial({ color: 0xf8fafc, clearcoat: 1.0, roughness: 0.15 });

  // Wheels
  const tireGeo = new THREE.TorusGeometry(0.36, 0.11, 12, 24);
  tireGeo.rotateY(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.14, 12);
  rimGeo.rotateZ(Math.PI / 2);

  [-0.95, 0.95].forEach((wz) => {
    const wGroup = new THREE.Group();
    wGroup.position.set(0, 0.44, wz);
    wGroup.add(new THREE.Mesh(tireGeo, darkMat), new THREE.Mesh(rimGeo, bodyMat));
    leanPivot.add(wGroup);
    wheels.push(wGroup);
  });

  // Frame & Fairing
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.48, 1.55), bodyMat);
  frame.position.set(0, 0.68, 0);
  frame.castShadow = true;
  leanPivot.add(frame);

  const fairing = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.45, 0.68), bodyMat);
  fairing.position.set(0, 0.85, -0.62);
  fairing.rotation.x = 0.25;
  leanPivot.add(fairing);

  const headlight = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.14, 0.1),
    new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 1.4 })
  );
  headlight.position.set(0, 0.85, -0.98);
  leanPivot.add(headlight);

  // Rider torso + helmet
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.58, 0.34), riderMat);
  torso.position.set(0, 1.18, 0.08);
  torso.rotation.x = -0.45;
  leanPivot.add(torso);

  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.21, 16, 16), helmetMat);
  helmet.position.set(0, 1.5, -0.14);
  leanPivot.add(helmet);

  return { group, leanPivot, wheels };
}

export function buildSpaceshipModel(): THREE.Group {
  const ship = new THREE.Group();
  const hullMat = new THREE.MeshPhysicalMaterial({
    color: 0xe2e8f0,
    metalness: 0.78,
    roughness: 0.22,
    clearcoat: 0.8,
  });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.6, roughness: 0.25 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x0f172a, roughness: 0.08, clearcoat: 1 });
  const thrusterMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0ea5e9,
    emissiveIntensity: 2.2,
  });

  // Main fuselage
  const fuselage = new THREE.Mesh(new THREE.ConeGeometry(0.65, 3.6, 8), hullMat);
  fuselage.rotation.x = -Math.PI / 2;
  fuselage.position.y = 0.75;
  fuselage.castShadow = true;
  ship.add(fuselage);

  // Swept Wings
  const wingGeo = new THREE.BoxGeometry(3.8, 0.12, 1.2);
  const wings = new THREE.Mesh(wingGeo, accentMat);
  wings.position.set(0, 0.68, 0.55);
  ship.add(wings);

  // Canopy
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), glassMat);
  canopy.scale.set(0.85, 0.65, 1.8);
  canopy.position.set(0, 1.05, -0.25);
  ship.add(canopy);

  // Twin Engine Pods
  [-0.95, 0.95].forEach((ex) => {
    const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 1.4, 12), hullMat);
    pod.rotation.x = Math.PI / 2;
    pod.position.set(ex, 0.68, 0.75);
    ship.add(pod);

    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), thrusterMat);
    glow.position.set(ex, 0.68, 1.48);
    ship.add(glow);
  });

  return ship;
}

export function buildDinosaurModel(
  kind: 'trex' | 'stego' | 'tricera',
  colorHex: number
): THREE.Group {
  const dino = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.62, metalness: 0.08 });
  const bellyMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.75 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });

  // Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.3, 2.6), skinMat);
  body.position.set(0, 1.45, 0);
  body.castShadow = true;
  dino.add(body);

  // Tail
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.45, 2.2, 6), skinMat);
  tail.rotation.x = Math.PI / 2.2;
  tail.position.set(0, 1.35, 2.1);
  dino.add(tail);

  // Neck & Head
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.85, 1.3), skinMat);
  head.position.set(0, kind === 'trex' ? 2.45 : 1.9, -1.75);
  head.castShadow = true;
  dino.add(head);

  [-0.48, 0.48].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), eyeMat);
    eye.position.set(ex, head.position.y + 0.16, head.position.z - 0.25);
    dino.add(eye);
  });

  // 4 Legs (grounded at y = 0)
  const legGeo = new THREE.BoxGeometry(0.42, 1.0, 0.46);
  [
    [-0.52, -0.85],
    [0.52, -0.85],
    [-0.52, 0.85],
    [0.52, 0.85],
  ].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(legGeo, skinMat);
    leg.position.set(lx, 0.5, lz);
    leg.castShadow = true;
    dino.add(leg);
  });

  if (kind === 'stego') {
    for (let i = 0; i < 4; i++) {
      const plate = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.65, 4), bellyMat);
      plate.position.set(0, 2.35, -0.9 + i * 0.65);
      dino.add(plate);
    }
  } else if (kind === 'tricera') {
    const frill = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.16, 12), bellyMat);
    frill.rotation.x = Math.PI / 2.4;
    frill.position.set(0, 2.35, -1.2);
    dino.add(frill);
  }

  return dino;
}

export type AnimalType = 'lion' | 'elephant' | 'giraffe' | 'sheep' | 'rabbit' | 'panda';

export function buildAnimalModel(type: AnimalType): THREE.Group {
  const g = new THREE.Group();
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });

  const addLegs = (color: number, h = 0.7) => {
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
    const geo = new THREE.CylinderGeometry(0.14, 0.14, h, 10);
    [
      [-0.36, -0.42],
      [0.36, -0.42],
      [-0.36, 0.42],
      [0.36, 0.42],
    ].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(geo, mat);
      leg.position.set(lx, h * 0.5, lz);
      leg.castShadow = true;
      g.add(leg);
    });
  };

  if (type === 'lion') {
    addLegs(0xf59e0b);
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.75, 1.35),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.6 })
    );
    body.position.y = 0.95;
    body.castShadow = true;
    g.add(body);
    const mane = new THREE.Mesh(
      new THREE.SphereGeometry(0.58, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85 })
    );
    mane.position.set(0, 1.32, -0.78);
    g.add(mane);
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xfcd34d, roughness: 0.6 })
    );
    head.position.set(0, 1.32, -0.96);
    g.add(head);
    [-0.16, 0.16].forEach((ex) => {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), eyeMat);
      e.position.set(ex, 1.4, -1.33);
      g.add(e);
    });
  } else if (type === 'elephant') {
    addLegs(0x64748b, 0.8);
    const mat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.65 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.0, 1.55), mat);
    body.position.y = 1.15;
    body.castShadow = true;
    g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 16), mat);
    head.position.set(0, 1.52, -0.88);
    g.add(head);
    [-0.62, 0.62].forEach((ex) => {
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.68, 0.55), mat);
      ear.position.set(ex, 1.55, -0.82);
      g.add(ear);
    });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.85, 10), mat);
    trunk.rotation.x = 0.5;
    trunk.position.set(0, 1.15, -1.48);
    g.add(trunk);
  } else if (type === 'giraffe') {
    addLegs(0xd97706, 1.1);
    const mat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.65 });
    const spotMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.7 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.75, 1.3), mat);
    body.position.y = 1.35;
    body.castShadow = true;
    g.add(body);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 1.6, 10), mat);
    neck.position.set(0, 2.25, -0.55);
    neck.rotation.x = 0.15;
    g.add(neck);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.38, 0.65), mat);
    head.position.set(0, 3.05, -0.75);
    g.add(head);
    [-0.12, 0.12].forEach((hx) => {
      const horn = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.24, 8), spotMat);
      horn.position.set(hx, 3.3, -0.68);
      g.add(horn);
    });
  } else if (type === 'sheep') {
    addLegs(0x1e293b, 0.55);
    const woolMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });
    const faceMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.68, 16, 16), woolMat);
    body.scale.set(1, 0.85, 1.25);
    body.position.y = 0.88;
    body.castShadow = true;
    g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 14), faceMat);
    head.position.set(0, 1.1, -0.82);
    g.add(head);
  } else if (type === 'rabbit') {
    const furMat = new THREE.MeshStandardMaterial({ color: 0xf4f4f5, roughness: 0.75 });
    const pinkMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.6 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 16), furMat);
    body.scale.set(0.9, 1.1, 1.15);
    body.position.y = 0.55;
    body.castShadow = true;
    g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), furMat);
    head.position.set(0, 1.15, -0.35);
    g.add(head);
    [-0.15, 0.15].forEach((ex) => {
      const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.45, 4, 8), furMat);
      ear.position.set(ex, 1.72, -0.32);
      g.add(ear);
    });
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), pinkMat);
    nose.position.set(0, 1.12, -0.74);
    g.add(nose);
  } else {
    // Panda
    addLegs(0x0f172a, 0.55);
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 });
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.65, 16, 16), whiteMat);
    body.position.y = 0.92;
    body.castShadow = true;
    g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.48, 16, 16), whiteMat);
    head.position.set(0, 1.62, -0.45);
    g.add(head);
    [-0.32, 0.32].forEach((ex) => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 10), blackMat);
      ear.position.set(ex, 2.02, -0.42);
      g.add(ear);
      const patch = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), blackMat);
      patch.position.set(ex * 0.55, 1.66, -0.88);
      g.add(patch);
    });
  }

  return g;
}

export function buildTreeModel(style: 'pine' | 'cartoon' = 'pine'): THREE.Group {
  const tree = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
  const leafColor = style === 'cartoon' ? 0x4ade80 : 0x15803d;
  const leafMat = new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.8 });

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 2.0, 8), trunkMat);
  trunk.position.y = 1.0;
  trunk.castShadow = true;
  tree.add(trunk);

  if (style === 'cartoon') {
    const crown = new THREE.Mesh(new THREE.SphereGeometry(1.4, 14, 14), leafMat);
    crown.position.y = 2.8;
    crown.castShadow = true;
    tree.add(crown);
  } else {
    const c1 = new THREE.Mesh(new THREE.ConeGeometry(1.6, 2.2, 8), leafMat);
    c1.position.y = 2.6;
    c1.castShadow = true;
    const c2 = new THREE.Mesh(new THREE.ConeGeometry(1.15, 1.8, 8), leafMat);
    c2.position.y = 3.8;
    c2.castShadow = true;
    tree.add(c1, c2);
  }
  return tree;
}
