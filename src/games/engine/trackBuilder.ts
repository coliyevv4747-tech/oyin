import * as THREE from 'three';

export interface TrackData {
  curve: THREE.CatmullRomCurve3;
  samples: THREE.Vector3[];
  tangents: THREE.Vector3[];
  roadWidth: number;
  totalLength: number;
  boostPads: THREE.Vector3[];
  buildMeshes: (
    scene: THREE.Scene,
    asphaltTex: THREE.CanvasTexture,
    checkerTex: THREE.CanvasTexture,
    theme: 'cartoon' | 'canyon' | 'night' | 'grandprix'
  ) => void;
  closestSampleIndex: (pos: THREE.Vector3) => { index: number; distSq: number; point: THREE.Vector3; tangent: THREE.Vector3 };
}

export function createTrackData(
  controlPoints: [number, number, number][],
  roadWidth = 14,
  sampleCount = 360
): TrackData {
  const vectors = controlPoints.map(([x, y, z]) => new THREE.Vector3(x, y, z));
  const curve = new THREE.CatmullRomCurve3(vectors, true, 'catmullrom', 0.45);
  const totalLength = curve.getLength();

  const samples: THREE.Vector3[] = [];
  const tangents: THREE.Vector3[] = [];
  for (let i = 0; i < sampleCount; i++) {
    const t = i / sampleCount;
    samples.push(curve.getPointAt(t));
    tangents.push(curve.getTangentAt(t).normalize());
  }

  const boostPads: THREE.Vector3[] = [0.16, 0.42, 0.68, 0.87].map((t) => curve.getPointAt(t));

  const buildMeshes = (
    scene: THREE.Scene,
    asphaltTex: THREE.CanvasTexture,
    checkerTex: THREE.CanvasTexture,
    theme: 'cartoon' | 'canyon' | 'night' | 'grandprix'
  ) => {
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const curbPositions: number[] = [];
    const curbNormals: number[] = [];
    const curbColors: number[] = [];
    const curbIndices: number[] = [];

    const up = new THREE.Vector3(0, 1, 0);
    const halfW = roadWidth * 0.5;
    const curbW = 1.25;

    for (let i = 0; i <= sampleCount; i++) {
      const idx = i % sampleCount;
      const p = samples[idx];
      const tan = tangents[idx];
      const right = new THREE.Vector3().crossVectors(tan, up).normalize();

      const leftEdge = p.clone().addScaledVector(right, -halfW);
      const rightEdge = p.clone().addScaledVector(right, halfW);

      positions.push(leftEdge.x, leftEdge.y + 0.04, leftEdge.z);
      positions.push(rightEdge.x, rightEdge.y + 0.04, rightEdge.z);
      normals.push(0, 1, 0, 0, 1, 0);
      const vCoord = (i / sampleCount) * 28;
      uvs.push(0, vCoord, 1, vCoord);

      if (i < sampleCount) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }

      // Curbs (left & right)
      const lOut = p.clone().addScaledVector(right, -(halfW + curbW));
      const rOut = p.clone().addScaledVector(right, halfW + curbW);
      curbPositions.push(
        lOut.x, lOut.y + 0.06, lOut.z,
        leftEdge.x, leftEdge.y + 0.06, leftEdge.z,
        rightEdge.x, rightEdge.y + 0.06, rightEdge.z,
        rOut.x, rOut.y + 0.06, rOut.z
      );
      curbNormals.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
      const isAlt = Math.floor(i / 3) % 2 === 0;
      const cA = theme === 'cartoon' ? [0.98, 0.75, 0.14] : [0.94, 0.27, 0.27];
      const cB = theme === 'night' ? [0.22, 0.74, 0.97] : [0.97, 0.98, 0.99];
      const col = isAlt ? cA : cB;
      for (let k = 0; k < 4; k++) curbColors.push(col[0], col[1], col[2]);

      if (i < sampleCount) {
        const cb = i * 4;
        curbIndices.push(cb, cb + 1, cb + 4, cb + 1, cb + 5, cb + 4);
        curbIndices.push(cb + 2, cb + 3, cb + 6, cb + 3, cb + 7, cb + 6);
      }
    }

    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    roadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    roadGeo.setIndex(indices);

    asphaltTex.repeat.set(1, 1);
    const roadMat = new THREE.MeshStandardMaterial({
      map: asphaltTex,
      roughness: 0.78,
      metalness: 0.06,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    scene.add(roadMesh);

    const curbGeo = new THREE.BufferGeometry();
    curbGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbPositions, 3));
    curbGeo.setAttribute('normal', new THREE.Float32BufferAttribute(curbNormals, 3));
    curbGeo.setAttribute('color', new THREE.Float32BufferAttribute(curbColors, 3));
    curbGeo.setIndex(curbIndices);
    const curbMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.65,
    });
    const curbMesh = new THREE.Mesh(curbGeo, curbMat);
    curbMesh.receiveShadow = true;
    scene.add(curbMesh);

    // Start / Finish Gantry
    const startP = samples[0];
    const startTan = tangents[0];
    const startAngle = Math.atan2(startTan.x, startTan.z);
    const gantry = new THREE.Group();
    gantry.position.copy(startP);
    gantry.rotation.y = startAngle;

    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.35 });
    const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(0.9, 6.2, 0.9), pillarMat);
    leftPillar.position.set(-halfW - 0.8, 3.1, 0);
    const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(0.9, 6.2, 0.9), pillarMat);
    rightPillar.position.set(halfW + 0.8, 3.1, 0);
    const banner = new THREE.Mesh(
      new THREE.BoxGeometry(roadWidth + 2.4, 1.5, 0.55),
      new THREE.MeshStandardMaterial({ map: checkerTex, roughness: 0.4 })
    );
    banner.position.set(0, 5.5, 0);
    const finishLine = new THREE.Mesh(
      new THREE.PlaneGeometry(roadWidth, 2.8),
      new THREE.MeshStandardMaterial({ map: checkerTex, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2 })
    );
    finishLine.rotation.x = -Math.PI / 2;
    finishLine.position.set(0, 0.08, 0);
    gantry.add(leftPillar, rightPillar, banner, finishLine);
    scene.add(gantry);

    // Boost pads
    const boostMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 1.5,
      roughness: 0.25,
    });
    [0.16, 0.42, 0.68, 0.87].forEach((t) => {
      const idx = Math.floor(t * sampleCount) % sampleCount;
      const pad = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.08, 5.5), boostMat);
      pad.position.copy(samples[idx]).setY(0.08);
      pad.rotation.y = Math.atan2(tangents[idx].x, tangents[idx].z);
      scene.add(pad);
    });
  };

  const closestSampleIndex = (pos: THREE.Vector3) => {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < samples.length; i++) {
      const dx = samples[i].x - pos.x;
      const dz = samples[i].z - pos.z;
      const d2 = dx * dx + dz * dz;
      if (d2 < bestDist) {
        bestDist = d2;
        bestIdx = i;
      }
    }
    return {
      index: bestIdx,
      distSq: bestDist,
      point: samples[bestIdx],
      tangent: tangents[bestIdx],
    };
  };

  return {
    curve,
    samples,
    tangents,
    roadWidth,
    totalLength,
    boostPads,
    buildMeshes,
    closestSampleIndex,
  };
}
