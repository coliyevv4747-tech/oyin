import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GameEngineProps } from './types';
import { addStudioLighting, createStudioThreeContext } from './threeSetup';
import { createContactShadowTexture, createGrassTexture } from './proceduralTextures';
import {
  buildDinosaurModel,
  buildSpaceshipModel,
  buildTreeModel,
  buildVehicleModel,
} from './models';
import { audioEngine } from '../../utils/audio';

const _v1 = new THREE.Vector3();
const _camPos = new THREE.Vector3();
const _camLook = new THREE.Vector3();

interface OpenHud {
  collected: number;
  target: number;
  score: number;
  speedKmh: number;
  elapsed: number;
  hint: string;
}

export const DrivingOpenWorldEngine: React.FC<GameEngineProps> = ({
  game,
  isPaused,
  graphicsQuality,
  touchInputRef,
  onComplete,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(isPaused);
  const onCompleteRef = useRef(onComplete);

  const targetCount = game.variant === 'space-explorer' ? 15 : 10;
  const [hud, setHud] = useState<OpenHud>({
    collected: 0,
    target: targetCount,
    score: 0,
    speedKmh: 0,
    elapsed: 0,
    hint: '',
  });

  useEffect(() => {
    pausedRef.current = isPaused;
    if (isPaused) audioEngine.updateEngine(0, false);
  }, [isPaused]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const v = game.variant;
    const isSpace = v === 'space-explorer';
    const isDino = v === 'dino-world';
    const isStunt = v === 'extreme-car-simulator';
    const isOffroad = v === 'offroad-adventure';
    const isOpen = v === 'open-world-adventure';

    const skyHex = isSpace ? 0x030712 : isDino ? 0x1e293b : isOffroad ? 0x334155 : isStunt ? 0x0f172a : 0x38bdf8;
    const fogHex = isSpace ? 0x030712 : isDino ? 0x451a03 : isOffroad ? 0x475569 : isStunt ? 0x1e293b : 0x7dd3fc;

    const ctx = createStudioThreeContext(container, {
      skyColor: skyHex,
      fogColor: fogHex,
      fogNear: isSpace ? 90 : 55,
      fogFar: isSpace ? 320 : 230,
      fov: 65,
      far: 450,
      graphicsQuality,
    });

    const { scene, camera, isSoftwareGl, maxAnisotropy } = ctx;

    addStudioLighting(scene, {
      isSoftwareGl,
      skyColor: isSpace ? 0x6366f1 : isDino ? 0xfdba74 : 0xbae6fd,
      groundColor: isSpace ? 0x0f172a : isDino ? 0x3f2e18 : 0x14532d,
      sunColor: isSpace ? 0xe0e7ff : 0xfff7ed,
      sunIntensity: isSpace ? 1.5 : 1.85,
      sunPos: [40, 70, 35],
      shadowRange: 75,
    });

    // Terrain height function
    const groundHeightAt = (x: number, z: number): number => {
      if (isSpace || isStunt) return 0;
      if (isOffroad) {
        return Math.sin(x * 0.045) * 3.4 + Math.cos(z * 0.04) * 3.2 + Math.sin((x + z) * 0.02) * 2.2;
      }
      if (isOpen || isDino) {
        const d = Math.hypot(x, z);
        if (d < 16) return 0;
        return (Math.sin(x * 0.035) * Math.cos(z * 0.035)) * 2.4;
      }
      return 0;
    };

    // Environment Ground / Space Starfield
    if (isSpace) {
      // Starfield
      const starGeo = new THREE.BufferGeometry();
      const starPos = new Float32Array(700 * 3);
      for (let i = 0; i < 700; i++) {
        starPos[i * 3] = (Math.random() - 0.5) * 360;
        starPos[i * 3 + 1] = (Math.random() - 0.5) * 140 + 20;
        starPos[i * 3 + 2] = (Math.random() - 0.5) * 360;
      }
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
      const stars = new THREE.Points(
        starGeo,
        new THREE.PointsMaterial({ color: 0xe2e8f0, size: 1.1, sizeAttenuation: true })
      );
      scene.add(stars);

      // Ringed Planets
      const planet1 = new THREE.Mesh(
        new THREE.SphereGeometry(18, 28, 28),
        new THREE.MeshStandardMaterial({ color: 0x6366f1, roughness: 0.65 })
      );
      planet1.position.set(-70, 28, -95);
      const ring1 = new THREE.Mesh(
        new THREE.RingGeometry(24, 34, 40),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, roughness: 0.4 })
      );
      ring1.rotation.x = Math.PI / 2.6;
      planet1.add(ring1);
      scene.add(planet1);

      const planet2 = new THREE.Mesh(
        new THREE.SphereGeometry(12, 24, 24),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.7 })
      );
      planet2.position.set(85, 16, -70);
      scene.add(planet2);
    } else {
      const grassTex = createGrassTexture(
        maxAnisotropy,
        isStunt ? '#1e293b' : isDino ? '#365314' : isOffroad ? '#3f6212' : '#15803d',
        isStunt ? '#334155' : isDino ? '#4d7c0f' : isOffroad ? '#65a30d' : '#22c55e'
      );
      grassTex.repeat.set(42, 42);

      const terrainGeo = new THREE.PlaneGeometry(340, 340, 72, 72);
      terrainGeo.rotateX(-Math.PI / 2);
      const posAttr = terrainGeo.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const vx = posAttr.getX(i);
        const vz = posAttr.getZ(i);
        posAttr.setY(i, groundHeightAt(vx, vz));
      }
      terrainGeo.computeVertexNormals();

      const ground = new THREE.Mesh(
        terrainGeo,
        new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.88 })
      );
      ground.receiveShadow = true;
      scene.add(ground);
    }

    // Variant Props & Obstacles
    const hazards: { mesh: THREE.Object3D; radius: number; basePos: THREE.Vector3; phase: number }[] = [];
    const ramps: { pos: THREE.Vector3; dir: THREE.Vector3 }[] = [];

    if (isDino) {
      // Volcano landmark
      const volc = new THREE.Mesh(
        new THREE.ConeGeometry(22, 28, 12),
        new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 })
      );
      volc.position.set(0, 12, -95);
      scene.add(volc);
      const lavaTop = new THREE.Mesh(
        new THREE.SphereGeometry(4.5, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 2 })
      );
      lavaTop.position.set(0, 26, -95);
      scene.add(lavaTop);

      // Roaming dinosaurs
      const dinoConfigs: ['trex' | 'stego' | 'tricera', number, number, number][] = [
        ['trex', 0x84cc16, -28, -32],
        ['stego', 0xf59e0b, 35, -45],
        ['tricera', 0x10b981, -42, 32],
        ['trex', 0xef4444, 38, 38],
      ];
      dinoConfigs.forEach(([kind, col, dx, dz], idx) => {
        const d = buildDinosaurModel(kind, col);
        d.position.set(dx, groundHeightAt(dx, dz), dz);
        scene.add(d);
        hazards.push({ mesh: d, radius: 3.4, basePos: d.position.clone(), phase: idx * 1.4 });
      });

      for (let i = 0; i < 28; i++) {
        const angle = (i / 28) * Math.PI * 2;
        const rad = 35 + (i % 4) * 20;
        const tx = Math.cos(angle) * rad;
        const tz = Math.sin(angle) * rad;
        const tree = buildTreeModel('pine');
        tree.position.set(tx, groundHeightAt(tx, tz), tz);
        scene.add(tree);
      }
    } else if (isSpace) {
      // Asteroid obstacles
      const astMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85, flatShading: true });
      for (let i = 0; i < 18; i++) {
        const a = new THREE.Mesh(new THREE.DodecahedronGeometry(2.2 + (i % 3) * 0.9, 0), astMat);
        const ang = (i / 18) * Math.PI * 2;
        const dist = 25 + (i % 5) * 18;
        a.position.set(Math.cos(ang) * dist, 1.5, Math.sin(ang) * dist);
        scene.add(a);
        hazards.push({ mesh: a, radius: 2.8, basePos: a.position.clone(), phase: i });
      }
    } else if (isStunt) {
      // Stunt Ramps + Glowing Arches
      const rampMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.45, metalness: 0.3 });
      const rampSpots: [number, number, number][] = [
        [0, -32, 0],
        [45, 0, Math.PI / 2],
        [-45, 0, -Math.PI / 2],
        [0, 45, Math.PI],
      ];
      rampSpots.forEach(([rx, rz, rot]) => {
        const ramp = new THREE.Mesh(new THREE.BoxGeometry(8, 0.8, 12), rampMat);
        ramp.position.set(rx, 1.4, rz);
        ramp.rotation.y = rot;
        ramp.rotation.x = 0.28;
        ramp.castShadow = true;
        scene.add(ramp);
        ramps.push({ pos: new THREE.Vector3(rx, 0, rz), dir: new THREE.Vector3(0, 0, -1) });
      });
    } else {
      // Trees & ancient stone ruins / rocks
      for (let i = 0; i < 38; i++) {
        const ang = (i / 38) * Math.PI * 2;
        const rad = 26 + (i % 6) * 18;
        const tx = Math.cos(ang) * rad;
        const tz = Math.sin(ang) * rad;
        const tree = buildTreeModel('pine');
        tree.position.set(tx, groundHeightAt(tx, tz), tz);
        scene.add(tree);
      }
      if (isOpen) {
        const ruinMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });
        for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * Math.PI * 2;
          const rx = Math.cos(ang) * 52;
          const rz = Math.sin(ang) * 52;
          const pillar = new THREE.Mesh(new THREE.BoxGeometry(2.2, 8, 2.2), ruinMat);
          pillar.position.set(rx, groundHeightAt(rx, rz) + 4, rz);
          pillar.castShadow = true;
          scene.add(pillar);
        }
      }
    }

    // Collectibles (Stars / Amber Eggs / Checkpoints / Relics)
    interface Collectible {
      mesh: THREE.Group;
      collected: boolean;
      pos: THREE.Vector3;
    }
    const collectibles: Collectible[] = [];
    const colColor = isSpace ? 0xfacc15 : isDino ? 0xf59e0b : isStunt ? 0x38bdf8 : 0x22d3ee;

    for (let i = 0; i < targetCount; i++) {
      const ang = (i / targetCount) * Math.PI * 2 + 0.3;
      const dist = 24 + ((i * 19) % 72);
      const cx = Math.cos(ang) * dist;
      const cz = Math.sin(ang) * dist;
      const cy = groundHeightAt(cx, cz) + (isStunt && i < 4 ? 4.2 : 1.6);

      const itemGroup = new THREE.Group();
      itemGroup.position.set(cx, cy, cz);

      const core = new THREE.Mesh(
        isStunt ? new THREE.TorusGeometry(2.2, 0.25, 10, 24) : new THREE.OctahedronGeometry(1.15, 0),
        new THREE.MeshStandardMaterial({
          color: colColor,
          emissive: colColor,
          emissiveIntensity: 0.85,
          roughness: 0.2,
          metalness: 0.6,
        })
      );
      itemGroup.add(core);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.7, 0.08, 8, 20),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 })
      );
      ring.rotation.x = Math.PI / 2;
      itemGroup.add(ring);

      scene.add(itemGroup);
      collectibles.push({ mesh: itemGroup, collected: false, pos: itemGroup.position });
    }

    // Build Player Actor
    const actorColor = parseInt(game.accentColor.replace('#', ''), 16) || 0x38bdf8;
    let playerObj: THREE.Group;
    let carRig: ReturnType<typeof buildVehicleModel> | null = null;

    if (isSpace) {
      playerObj = buildSpaceshipModel();
      playerObj.position.set(0, 1.2, 0);
    } else {
      carRig = buildVehicleModel(isOffroad ? 'offroad' : 'sport', actorColor);
      playerObj = carRig.group;
      playerObj.position.set(0, groundHeightAt(0, 0), 0);
    }

    if (!isSpace) {
      const shadowPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(3.4, 5.0),
        new THREE.MeshBasicMaterial({
          map: createContactShadowTexture(),
          transparent: true,
          depthWrite: false,
          opacity: 0.5,
        })
      );
      shadowPlane.rotation.x = -Math.PI / 2;
      shadowPlane.position.y = 0.06;
      playerObj.add(shadowPlane);
    }
    scene.add(playerObj);

    // State
    let heading = 0;
    let speed = 0;
    let verticalVel = 0;
    let collected = 0;
    let score = 0;
    let elapsed = 0;
    let camMode = 0;
    let lastCamTrig = touchInputRef.current.cameraTrigger;
    let finished = false;
    let hintMsg = isSpace
      ? 'Barcha 15 ta oltin yulduzni to‘plang!'
      : isDino
      ? '10 ta qahrabo tuxumni toping!'
      : 'Barcha 10 ta nishonni yig‘ing!';
    let hintTimer = 3.5;

    const maxSpeed = isSpace ? 48 : isStunt ? 54 : 42;
    const keys: Record<string, boolean> = {};

    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      if (e.code === 'KeyC' && !e.repeat) {
        camMode = (camMode + 1) % 2;
      }
      keys[e.code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };
    const onBlur = () => {
      Object.keys(keys).forEach((k) => (keys[k] = false));
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    audioEngine.startEngine();

    let hudAcc = 0;

    ctx.startLoop((dt, totalTime) => {
      if (pausedRef.current || finished) {
        audioEngine.updateEngine(0, false);
        return;
      }

      elapsed += dt;
      if (hintTimer > 0) {
        hintTimer -= dt;
        if (hintTimer <= 0) hintMsg = '';
      }

      if (touchInputRef.current.cameraTrigger !== lastCamTrig) {
        lastCamTrig = touchInputRef.current.cameraTrigger;
        camMode = (camMode + 1) % 2;
      }

      const touch = touchInputRef.current;
      const throttle = keys['KeyW'] || keys['ArrowUp'] || touch.up;
      const brake = keys['KeyS'] || keys['ArrowDown'] || touch.down;
      const left = keys['KeyA'] || keys['ArrowLeft'] || touch.left;
      const right = keys['KeyD'] || keys['ArrowRight'] || touch.right;
      const boost = keys['ShiftLeft'] || keys['ShiftRight'] || touch.boost;
      const jump = keys['Space'] || touch.brake;

      const curMax = boost ? maxSpeed * 1.32 : maxSpeed;
      if (throttle) {
        speed += (boost ? 48 : 34) * dt;
      } else if (brake) {
        speed -= 38 * dt;
      } else {
        speed *= Math.exp(-1.5 * dt);
      }
      speed = THREE.MathUtils.clamp(speed, -16, curMax);

      const steer = (left ? 1 : 0) - (right ? 1 : 0);
      const steerAuth = isSpace ? 2.5 : Math.min(1, Math.abs(speed) / 8 + 0.25) * 2.4;
      heading += steer * steerAuth * dt * (speed >= -0.5 ? 1 : -1);

      _v1.set(-Math.sin(heading), 0, -Math.cos(heading));
      playerObj.position.addScaledVector(_v1, speed * dt);

      // Arena soft boundary (radius 130)
      const distFromOrigin = Math.hypot(playerObj.position.x, playerObj.position.z);
      if (distFromOrigin > 125) {
        const scale = 125 / distFromOrigin;
        playerObj.position.x *= scale;
        playerObj.position.z *= scale;
        speed *= 0.7;
      }

      // Vertical physics & Terrain slope alignment
      const floorY = isSpace ? 1.2 : groundHeightAt(playerObj.position.x, playerObj.position.z);
      if (jump && Math.abs(playerObj.position.y - floorY) < 0.35 && (isOpen || isStunt)) {
        verticalVel = 12;
        audioEngine.playAction();
      }

      // Ramp launch check
      for (const r of ramps) {
        if (playerObj.position.distanceToSquared(r.pos) < 34 && Math.abs(speed) > 18) {
          verticalVel = Math.max(verticalVel, 14);
          score += 50;
          hintMsg = '+50 Tramplin sakrashi!';
          hintTimer = 1.2;
        }
      }

      if (!isSpace) {
        verticalVel -= 26 * dt;
        playerObj.position.y += verticalVel * dt;
        if (playerObj.position.y <= floorY) {
          playerObj.position.y = floorY;
          verticalVel = 0;
        }
      } else {
        playerObj.position.y = 1.6 + Math.sin(totalTime * 2) * 0.3;
        playerObj.rotation.z = THREE.MathUtils.damp(playerObj.rotation.z, steer * 0.45, 8, dt);
      }

      playerObj.rotation.y = heading;

      if (carRig) {
        const wDelta = (speed * dt) / 0.38;
        carRig.wheels.forEach((w) => (w.rotation.x -= wDelta));
        carRig.frontSteerPivots.forEach((p) => {
          p.rotation.y = THREE.MathUtils.damp(p.rotation.y, steer * 0.38, 12, dt);
        });
      }

      audioEngine.updateEngine(Math.abs(speed) / maxSpeed, boost);

      // Animate & check collectibles
      for (const c of collectibles) {
        if (c.collected) continue;
        c.mesh.rotation.y += dt * 1.8;
        if (playerObj.position.distanceToSquared(c.pos) < 16) {
          c.collected = true;
          c.mesh.visible = false;
          collected += 1;
          score += 200;
          audioEngine.playCollect();
          hintMsg = `${collected}/${targetCount} topildi! +200 ball`;
          hintTimer = 1.4;

          if (collected >= targetCount && !finished) {
            finished = true;
            audioEngine.playWin();
            const bonus = Math.max(0, Math.round(600 - elapsed * 6));
            const finalScore = score + bonus;
            onCompleteRef.current({
              score: finalScore,
              timeSeconds: elapsed,
              won: true,
              stars: elapsed < 45 ? 3 : elapsed < 80 ? 2 : 1,
              summaryLabel: 'Barcha nishonlar muvaffaqiyatli yig‘ildi!',
              extraStats: [
                { label: 'Yig‘ilgan', value: `${collected}/${targetCount}` },
                { label: 'Tezlik bonusi', value: `+${bonus}` },
              ],
            });
          }
        }
      }

      // Animate hazards & check collisions
      for (const h of hazards) {
        if (isSpace) {
          h.mesh.rotation.x += dt * 0.7;
          h.mesh.rotation.y += dt * 0.9;
        } else {
          const ang = totalTime * 0.45 + h.phase;
          h.mesh.position.x = h.basePos.x + Math.cos(ang) * 10;
          h.mesh.position.z = h.basePos.z + Math.sin(ang) * 10;
          h.mesh.position.y = groundHeightAt(h.mesh.position.x, h.mesh.position.z);
          h.mesh.rotation.y = -ang;
        }

        const dx = playerObj.position.x - h.mesh.position.x;
        const dz = playerObj.position.z - h.mesh.position.z;
        if (dx * dx + dz * dz < h.radius * h.radius) {
          speed = -10;
          audioEngine.playCrash();
          const push = _v1.set(dx, 0, dz).normalize();
          playerObj.position.addScaledVector(push, 2.2);
          hintMsg = 'Ehtiyot bo‘ling!';
          hintTimer = 1.0;
        }
      }

      // Camera Chase
      const fx = -Math.sin(heading);
      const fz = -Math.cos(heading);
      const dist = camMode === 0 ? 10.5 : 17;
      const height = camMode === 0 ? 4.6 : 11;
      _camPos.set(
        playerObj.position.x - fx * dist,
        playerObj.position.y + height,
        playerObj.position.z - fz * dist
      );
      _camLook.set(
        playerObj.position.x + fx * 6,
        playerObj.position.y + 1.4,
        playerObj.position.z + fz * 6
      );
      camera.position.x = THREE.MathUtils.damp(camera.position.x, _camPos.x, 8, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, _camPos.y, 8, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, _camPos.z, 8, dt);
      camera.lookAt(_camLook);

      hudAcc += dt;
      if (hudAcc > 0.08) {
        hudAcc = 0;
        setHud({
          collected,
          target: targetCount,
          score,
          speedKmh: Math.round(Math.abs(speed) * 3.5),
          elapsed,
          hint: hintMsg,
        });
      }
    });

    return () => {
      audioEngine.stopEngine();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      ctx.dispose();
    };
  }, [game.id, game.variant, game.accentColor, graphicsQuality, targetCount, touchInputRef]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#030712]">
      <div ref={mountRef} className="h-full w-full" />

      <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex items-start justify-between px-4">
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#070913]/85 px-4 py-2 text-xs text-slate-200">
          <div>
            <span className="text-slate-400">Nishonlar: </span>
            <span className="font-mono-num text-sm font-bold text-emerald-400">
              {hud.collected}/{hud.target}
            </span>
          </div>
          <span className="text-slate-600">·</span>
          <div>
            <span className="text-slate-400">Ball: </span>
            <span className="font-mono-num text-sm font-bold text-amber-400">{hud.score}</span>
          </div>
          <span className="text-slate-600">·</span>
          <div>
            <span className="text-slate-400">Vaqt: </span>
            <span className="font-mono-num text-sm font-bold text-white">{hud.elapsed.toFixed(1)}s</span>
          </div>
        </div>

        <div className="hidden rounded-xl border border-white/10 bg-[#070913]/85 px-3 py-2 font-mono-num text-xs text-sky-300 sm:block">
          {hud.speedKmh} km/soat
        </div>
      </div>

      {hud.hint && (
        <div className="pointer-events-none absolute inset-x-0 top-16 z-10 flex justify-center">
          <div className="rounded-lg border border-sky-400/30 bg-[#070913]/85 px-4 py-1.5 text-sm font-semibold text-sky-200">
            {hud.hint}
          </div>
        </div>
      )}
    </div>
  );
};
