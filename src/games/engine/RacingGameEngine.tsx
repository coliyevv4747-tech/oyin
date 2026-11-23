import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GameEngineProps } from './types';
import { addStudioLighting, createStudioThreeContext } from './threeSetup';
import {
  createAsphaltTexture,
  createCheckeredTexture,
  createContactShadowTexture,
  createGrassTexture,
} from './proceduralTextures';
import {
  buildSportBikeModel,
  buildTreeModel,
  buildVehicleModel,
  SportBikeRig,
  VehicleRig,
  VehicleStyle,
} from './models';
import { createTrackData } from './trackBuilder';
import { audioEngine } from '../../utils/audio';

const _vecA = new THREE.Vector3();
const _vecB = new THREE.Vector3();
const _camTarget = new THREE.Vector3();
const _camLook = new THREE.Vector3();

interface HudTelemetry {
  speedKmh: number;
  lap: number;
  totalLaps: number;
  position: number;
  totalCars: number;
  elapsed: number;
  score: number;
  driftCombo: number;
  nitro: number;
  cameraLabel: string;
  gear: number;
  bannerMsg: string;
}

const CAMERA_MODES = ['Orqa kamera', 'Kapot kamerasi', 'Yuqori kamera'];

export const RacingGameEngine: React.FC<GameEngineProps> = ({
  game,
  isPaused,
  graphicsQuality,
  touchInputRef,
  onComplete,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(isPaused);
  const onCompleteRef = useRef(onComplete);

  const [hud, setHud] = useState<HudTelemetry>({
    speedKmh: 0,
    lap: 1,
    totalLaps: 3,
    position: 1,
    totalCars: 4,
    elapsed: 0,
    score: 0,
    driftCombo: 0,
    nitro: 100,
    cameraLabel: CAMERA_MODES[0],
    gear: 1,
    bannerMsg: '',
  });

  useEffect(() => {
    pausedRef.current = isPaused;
    if (isPaused) {
      audioEngine.updateEngine(0, false);
    }
  }, [isPaused]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const variant = game.variant;
    const isNight = variant === 'street-racing' || variant === 'hypercar-highway' || variant === 'drift-masters';
    const isCartoon = variant === 'mini-racer';
    const isHighway = variant === 'hypercar-highway';
    const isDrift = variant === 'drift-masters';
    const isBike = variant === 'super-bike';

    const skyHex = isNight ? 0x060a18 : isCartoon ? 0x60a5fa : variant === 'super-car' ? 0xf59e0b : 0x38bdf8;
    const fogHex = isNight ? 0x080d20 : isCartoon ? 0x93c5fd : variant === 'super-car' ? 0xfdba74 : 0x7dd3fc;

    const ctx = createStudioThreeContext(container, {
      skyColor: skyHex,
      fogColor: fogHex,
      fogNear: isNight ? 50 : 70,
      fogFar: isNight ? 240 : 280,
      fov: 64,
      far: 450,
      graphicsQuality,
    });

    const { scene, camera, isSoftwareGl, maxAnisotropy } = ctx;

    addStudioLighting(scene, {
      isSoftwareGl,
      skyColor: isNight ? 0x334155 : 0x93c5fd,
      groundColor: isNight ? 0x0f172a : 0x1e3a2f,
      sunColor: isNight ? 0x818cf8 : 0xfff7ed,
      sunIntensity: isNight ? 1.1 : 1.9,
      sunPos: [45, 75, 35],
      shadowRange: 65,
    });

    const asphaltTex = createAsphaltTexture(maxAnisotropy);
    const checkerTex = createCheckeredTexture(maxAnisotropy);
    const grassTex = createGrassTexture(
      maxAnisotropy,
      isNight ? '#0f172a' : isCartoon ? '#22c55e' : '#1b4332',
      isNight ? '#1e293b' : isCartoon ? '#4ade80' : '#2d6a4f'
    );
    grassTex.repeat.set(60, 60);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(750, 750),
      new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.92 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Track geometry setup
    const controlPoints: [number, number, number][] = isCartoon
      ? [
          [0, 0, 0],
          [0, 0, -85],
          [75, 0, -110],
          [115, 0, -45],
          [100, 0, 50],
          [35, 0, 70],
        ]
      : isDrift
      ? [
          [0, 0, 0],
          [0, 0, -100],
          [85, 0, -135],
          [145, 0, -70],
          [90, 0, -15],
          [145, 0, 55],
          [75, 0, 105],
          [-20, 0, 75],
        ]
      : [
          [0, 0, 0],
          [0, 0, -120],
          [60, 0, -185],
          [145, 0, -150],
          [170, 0, -60],
          [115, 0, 10],
          [155, 0, 90],
          [80, 0, 145],
          [-15, 0, 100],
        ];

    const track = createTrackData(controlPoints, isCartoon ? 16 : 15, 360);
    const trackTheme = isNight ? 'night' : isCartoon ? 'cartoon' : 'grandprix';
    track.buildMeshes(scene, asphaltTex, checkerTex, trackTheme);

    // Roadside environment props (buildings, streetlights, trees)
    const propGroup = new THREE.Group();
    scene.add(propGroup);
    if (isNight) {
      const bldgMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.5, metalness: 0.4 });
      const winMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.9,
      });
      for (let i = 0; i < 36; i++) {
        const sIdx = Math.floor((i / 36) * track.samples.length);
        const p = track.samples[sIdx];
        const tan = track.tangents[sIdx];
        const side = new THREE.Vector3(-tan.z, 0, tan.x).multiplyScalar(i % 2 === 0 ? 18 : -18);
        const h = 14 + (i % 5) * 7;
        const b = new THREE.Mesh(new THREE.BoxGeometry(8, h, 8), bldgMat);
        b.position.set(p.x + side.x, h * 0.5, p.z + side.z);
        propGroup.add(b);
        const strip = new THREE.Mesh(new THREE.BoxGeometry(8.1, 0.6, 8.1), winMat);
        strip.position.set(p.x + side.x, h * 0.72, p.z + side.z);
        propGroup.add(strip);
      }
    } else {
      for (let i = 0; i < 42; i++) {
        const sIdx = Math.floor((i / 42) * track.samples.length);
        const p = track.samples[sIdx];
        const tan = track.tangents[sIdx];
        const dist = 16 + (i % 3) * 5;
        const side = new THREE.Vector3(-tan.z, 0, tan.x).multiplyScalar(i % 2 === 0 ? dist : -dist);
        const tree = buildTreeModel(isCartoon ? 'cartoon' : 'pine');
        tree.position.set(p.x + side.x, 0, p.z + side.z);
        tree.scale.setScalar(0.9 + (i % 4) * 0.22);
        propGroup.add(tree);
      }
    }

    // Build Player Vehicle
    const vehicleStyle: VehicleStyle =
      variant === 'mini-racer'
        ? 'toy'
        : variant === 'formula-pro'
        ? 'formula'
        : variant === 'hypercar-highway' || variant === 'ultimate-gt'
        ? 'hypercar'
        : variant === 'drift-masters'
        ? 'drift'
        : 'sport';

    const playerColor = parseInt(game.accentColor.replace('#', ''), 16) || 0x38bdf8;
    let playerCar: VehicleRig | null = null;
    let playerBike: SportBikeRig | null = null;
    let playerObj: THREE.Group;

    if (isBike) {
      playerBike = buildSportBikeModel(playerColor);
      playerObj = playerBike.group;
    } else {
      playerCar = buildVehicleModel(vehicleStyle, playerColor);
      playerObj = playerCar.group;
    }

    const contactTex = createContactShadowTexture();
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 5.2),
      new THREE.MeshBasicMaterial({ map: contactTex, transparent: true, depthWrite: false, opacity: 0.55 })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.05;
    playerObj.add(shadowPlane);

    // Position player at start line
    const startSample = track.samples[0];
    const startTan = track.tangents[0];
    let playerHeading = Math.atan2(-startTan.x, -startTan.z);
    playerObj.position.copy(startSample);
    playerObj.rotation.y = playerHeading;
    scene.add(playerObj);

    // Tire smoke / boost particle pool
    const particleCount = 36;
    const particleGeo = new THREE.SphereGeometry(0.32, 8, 8);
    const particleMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.45 });
    const particles: { mesh: THREE.Mesh; life: number; vel: THREE.Vector3 }[] = [];
    for (let i = 0; i < particleCount; i++) {
      const m = new THREE.Mesh(particleGeo, particleMat.clone());
      m.visible = false;
      scene.add(m);
      particles.push({ mesh: m, life: 0, vel: new THREE.Vector3() });
    }
    let pCursor = 0;
    const spawnSmoke = (pos: THREE.Vector3, colHex: number) => {
      const p = particles[pCursor];
      pCursor = (pCursor + 1) % particleCount;
      p.mesh.position.copy(pos).setY(0.28);
      p.mesh.scale.setScalar(0.7);
      (p.mesh.material as THREE.MeshBasicMaterial).color.setHex(colHex);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = 0.55;
      p.mesh.visible = true;
      p.life = 0.45;
      p.vel.set((Math.random() - 0.5) * 2, 1.4, (Math.random() - 0.5) * 2);
    };

    // AI Rivals or Traffic
    interface Rival {
      obj: THREE.Group;
      wheels: THREE.Group[];
      t: number;
      laneOffset: number;
      speedT: number;
      lap: number;
      passed: boolean;
    }
    const rivals: Rival[] = [];
    const rivalColors = [0xf43f5e, 0xf59e0b, 0x22c55e, 0xa855f7];
    const rivalCount = isHighway ? 8 : isDrift ? 0 : 3;

    for (let i = 0; i < rivalCount; i++) {
      let rObj: THREE.Group;
      let rWheels: THREE.Group[];
      if (isBike) {
        const b = buildSportBikeModel(rivalColors[i % rivalColors.length]);
        rObj = b.group;
        rWheels = b.wheels;
      } else {
        const c = buildVehicleModel(vehicleStyle, rivalColors[i % rivalColors.length]);
        rObj = c.group;
        rWheels = c.wheels;
      }
      scene.add(rObj);
      const baseT = isHighway ? (i + 1) * 0.11 : 0.985 - i * 0.015;
      const lane = isHighway ? ((i % 3) - 1) * 4.2 : ((i % 2 === 0 ? -1 : 1) * 3.2);
      const spdBase = isHighway
        ? 0.025 + (i % 3) * 0.008
        : isCartoon
        ? 0.032 + i * 0.003
        : 0.052 + i * 0.004;

      rivals.push({
        obj: rObj,
        wheels: rWheels,
        t: baseT % 1,
        laneOffset: lane,
        speedT: spdBase,
        lap: 1,
        passed: false,
      });
    }

    // Physics & Game state
    const maxSpeed = isCartoon ? 34 : isHighway ? 78 : vehicleStyle === 'formula' ? 74 : 64;
    const accelRate = isCartoon ? 26 : 38;
    const totalLaps = isCartoon ? 2 : 3;
    const timeLimit = isHighway || isDrift ? 75 : 999;

    let speed = 0;
    let driftAngle = 0;
    let nitro = 100;
    let lap = 1;
    let lastSampleIdx = 0;
    let maxReachedSegment = 0;
    let totalElapsed = 0;
    let score = 0;
    let driftPoints = 0;
    let driftCombo = 0;
    let camMode = 0;
    let lastCamTrigger = touchInputRef.current.cameraTrigger;
    let shake = 0;
    let finished = false;
    let bannerMsg = '';
    let bannerTimer = 0;

    // Input listeners
    const keys: Record<string, boolean> = {};
    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      if (e.code === 'KeyC' && !e.repeat) {
        camMode = (camMode + 1) % 3;
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

    let hudSyncAcc = 0;

    ctx.startLoop((dt) => {
      if (pausedRef.current || finished) {
        audioEngine.updateEngine(0, false);
        return;
      }

      totalElapsed += dt;
      if (bannerTimer > 0) {
        bannerTimer -= dt;
        if (bannerTimer <= 0) bannerMsg = '';
      }

      // Camera switch via mobile button
      if (touchInputRef.current.cameraTrigger !== lastCamTrigger) {
        lastCamTrigger = touchInputRef.current.cameraTrigger;
        camMode = (camMode + 1) % 3;
      }

      const touch = touchInputRef.current;
      const throttle = keys['KeyW'] || keys['ArrowUp'] || touch.up;
      const brake = keys['KeyS'] || keys['ArrowDown'] || touch.down;
      const steerLeft = keys['KeyA'] || keys['ArrowLeft'] || touch.left;
      const steerRight = keys['KeyD'] || keys['ArrowRight'] || touch.right;
      const handbrake = keys['Space'] || touch.brake;
      const wantsBoost = keys['ShiftLeft'] || keys['ShiftRight'] || touch.boost;

      // Boost & Nitro
      const isBoosting = wantsBoost && nitro > 2 && throttle;
      if (isBoosting) {
        nitro = Math.max(0, nitro - dt * 32);
      } else {
        nitro = Math.min(100, nitro + dt * 9);
      }

      const currentMax = isBoosting ? maxSpeed * 1.24 : maxSpeed;

      // Acceleration / Braking
      if (throttle) {
        speed += (isBoosting ? accelRate * 1.55 : accelRate) * dt;
      } else if (brake) {
        if (speed > 2) {
          speed -= accelRate * 1.65 * dt;
        } else {
          speed -= accelRate * 0.75 * dt;
        }
      } else {
        // Natural rolling drag
        speed *= Math.exp(-1.15 * dt);
      }

      if (handbrake) {
        speed *= Math.exp(-1.5 * dt);
      }

      // Track proximity & off-road slowdown
      const closest = track.closestSampleIndex(playerObj.position);
      const roadDist = Math.sqrt(closest.distSq);
      const offRoad = roadDist > track.roadWidth * 0.56;
      if (offRoad) {
        speed *= Math.exp(-1.8 * dt);
      }

      // Soft guardrail containment so player never gets lost in void
      if (roadDist > track.roadWidth * 1.15) {
        _vecA.subVectors(closest.point, playerObj.position).setY(0).normalize();
        playerObj.position.addScaledVector(_vecA, (roadDist - track.roadWidth * 1.15) * 0.45);
        speed *= 0.92;
      }

      // Boost pad detection
      for (const pad of track.boostPads) {
        if (playerObj.position.distanceToSquared(pad) < 18) {
          speed = Math.min(maxSpeed * 1.28, Math.max(speed, maxSpeed * 0.95));
          nitro = Math.min(100, nitro + 18 * dt * 10);
          spawnSmoke(playerObj.position, 0x38bdf8);
        }
      }

      speed = THREE.MathUtils.clamp(speed, -14, currentMax);

      // Steering + Drift kinematics
      const steerInput = (steerLeft ? 1 : 0) - (steerRight ? 1 : 0);
      const speedFactor = Math.min(1, Math.abs(speed) / 14);
      const steerDir = speed >= -0.5 ? 1 : -1;
      const turnRate = (isDrift ? 2.65 : isCartoon ? 2.1 : 2.3) * speedFactor * steerDir;
      playerHeading += steerInput * turnRate * dt;

      if (isDrift || (handbrake && Math.abs(speed) > 15)) {
        const targetDrift = steerInput * 0.42;
        driftAngle = THREE.MathUtils.damp(driftAngle, targetDrift, 6, dt);
        if (Math.abs(driftAngle) > 0.14 && Math.abs(speed) > 16) {
          const pts = Math.round(Math.abs(driftAngle) * Math.abs(speed) * dt * 4.5);
          driftPoints += pts;
          score += pts;
          driftCombo = Math.min(5, 1 + Math.floor(driftPoints / 250));
          spawnSmoke(playerObj.position, 0xe2e8f0);
        }
      } else {
        driftAngle = THREE.MathUtils.damp(driftAngle, 0, 8, dt);
        if (isDrift && driftPoints > 0) {
          driftPoints = Math.max(0, driftPoints - dt * 120);
          if (driftPoints === 0) driftCombo = 0;
        }
      }

      // Move vehicle along travel heading (heading - driftAngle*0.4)
      const moveHeading = playerHeading - driftAngle * 0.35;
      _vecB.set(-Math.sin(moveHeading), 0, -Math.cos(moveHeading));
      playerObj.position.addScaledVector(_vecB, speed * dt);
      playerObj.rotation.y = playerHeading + driftAngle * 0.55;

      // Animate wheels & bike lean
      const wheelSpinDelta = (speed * dt) / 0.36;
      if (playerCar) {
        playerCar.wheels.forEach((w) => (w.rotation.x -= wheelSpinDelta));
        playerCar.frontSteerPivots.forEach((p) => {
          p.rotation.y = THREE.MathUtils.damp(p.rotation.y, steerInput * 0.38, 12, dt);
        });
        playerCar.taillights.forEach((tl) => {
          const mat = tl.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = brake || handbrake ? 2.8 : 0.9;
        });
      }
      if (playerBike) {
        playerBike.wheels.forEach((w) => (w.rotation.x -= wheelSpinDelta));
        playerBike.leanPivot.rotation.z = THREE.MathUtils.damp(
          playerBike.leanPivot.rotation.z,
          steerInput * 0.38 * speedFactor,
          9,
          dt
        );
      }

      // Engine Audio
      audioEngine.updateEngine(Math.abs(speed) / maxSpeed, isBoosting);

      // Update particles
      for (const p of particles) {
        if (!p.mesh.visible) continue;
        p.life -= dt;
        if (p.life <= 0) {
          p.mesh.visible = false;
        } else {
          p.mesh.position.addScaledVector(p.vel, dt);
          p.mesh.scale.addScalar(dt * 1.8);
          (p.mesh.material as THREE.MeshBasicMaterial).opacity = p.life;
        }
      }

      // Lap Progression Logic
      const N = track.samples.length;
      if (closest.index > maxReachedSegment && closest.index - lastSampleIdx < N * 0.4) {
        maxReachedSegment = closest.index;
      }
      // Crossed finish line forward
      if (lastSampleIdx > N * 0.8 && closest.index < N * 0.2 && maxReachedSegment > N * 0.6) {
        if (!isHighway && !isDrift) {
          lap += 1;
          maxReachedSegment = 0;
          score += 500;
          audioEngine.playCollect();
          bannerMsg = lap > totalLaps ? 'Finish!' : `${lap}-aylana!`;
          bannerTimer = 2.0;

          if (lap > totalLaps) {
            finished = true;
            audioEngine.playWin();
            const pos = computePlayerRank();
            const finalScore = Math.max(200, Math.round(score + (5 - pos) * 400 - totalElapsed * 4));
            onCompleteRef.current({
              score: finalScore,
              timeSeconds: totalElapsed,
              won: pos <= 2,
              stars: pos === 1 ? 3 : pos === 2 ? 2 : 1,
              summaryLabel: pos === 1 ? '1-o‘rin! Chempion!' : `${pos}-o‘rin bilan finishga yetdingiz`,
              extraStats: [
                { label: 'O‘rin', value: `${pos} / ${rivals.length + 1}` },
                { label: 'Aylanalar', value: `${totalLaps}/${totalLaps}` },
              ],
            });
          }
        }
      }
      lastSampleIdx = closest.index;

      // Update Rivals & Traffic
      const upVec = new THREE.Vector3(0, 1, 0);
      for (const r of rivals) {
        r.t += r.speedT * dt;
        if (r.t >= 1) {
          r.t -= 1;
          r.lap += 1;
        }
        const p = track.curve.getPointAt(r.t);
        const tan = track.curve.getTangentAt(r.t).normalize();
        const right = _vecA.crossVectors(tan, upVec).normalize();
        r.obj.position.copy(p).addScaledVector(right, r.laneOffset);
        r.obj.rotation.y = Math.atan2(-tan.x, -tan.z);
        r.wheels.forEach((w) => (w.rotation.x -= r.speedT * 380 * dt));

        // Collision check
        const dSq = r.obj.position.distanceToSquared(playerObj.position);
        if (dSq < 6.8) {
          speed *= 0.62;
          shake = 0.45;
          audioEngine.playCrash();
          _vecB.subVectors(playerObj.position, r.obj.position).setY(0).normalize();
          playerObj.position.addScaledVector(_vecB, 1.3);
        } else if (isHighway && dSq < 26 && !r.passed && speed > 36) {
          r.passed = true;
          score += 150;
          bannerMsg = '+150 Yaqin quvib o‘tish!';
          bannerTimer = 1.1;
          audioEngine.playCollect();
        } else if (dSq > 60) {
          r.passed = false;
        }
      }

      // Highway & Drift Time-Attack completion
      if ((isHighway || isDrift) && totalElapsed >= timeLimit && !finished) {
        finished = true;
        audioEngine.playWin();
        const finalScore = Math.round(score + (isHighway ? speed * 5 : 0));
        const won = isDrift ? finalScore >= 1200 : finalScore >= 1000;
        onCompleteRef.current({
          score: finalScore,
          timeSeconds: totalElapsed,
          won,
          stars: finalScore >= 2500 ? 3 : finalScore >= 1200 ? 2 : 1,
          summaryLabel: isDrift
            ? `Drift yakunlandi! Umumiy ball: ${finalScore}`
            : `Shosse poygasi yakunlandi!`,
          extraStats: [
            { label: 'Eng yuqori tezlik', value: `${Math.round(maxSpeed * 4.2)} km/s` },
            { label: 'Vaqt', value: `${timeLimit} son` },
          ],
        });
      }

      if (isHighway && speed > 28) {
        score += speed * dt * 0.45;
      }

      function computePlayerRank(): number {
        const playerProgress = (lap - 1) + closest.index / N;
        let rank = 1;
        for (const r of rivals) {
          const rProg = (r.lap - 1) + r.t;
          if (rProg > playerProgress) rank++;
        }
        return rank;
      }

      // Camera Choreography with Smooth Exponential Damping + FOV Speed Sense
      const forwardX = -Math.sin(playerHeading);
      const forwardZ = -Math.cos(playerHeading);
      if (camMode === 0) {
        // Chase cam
        _camTarget.set(
          playerObj.position.x - forwardX * 9.5,
          playerObj.position.y + 4.0,
          playerObj.position.z - forwardZ * 9.5
        );
        _camLook.set(
          playerObj.position.x + forwardX * 8,
          playerObj.position.y + 1.3,
          playerObj.position.z + forwardZ * 8
        );
      } else if (camMode === 1) {
        // Hood cam
        _camTarget.set(
          playerObj.position.x + forwardX * 0.8,
          playerObj.position.y + 1.55,
          playerObj.position.z + forwardZ * 0.8
        );
        _camLook.set(
          playerObj.position.x + forwardX * 22,
          playerObj.position.y + 1.1,
          playerObj.position.z + forwardZ * 22
        );
      } else {
        // Far elevated cam
        _camTarget.set(
          playerObj.position.x - forwardX * 16,
          playerObj.position.y + 11.5,
          playerObj.position.z - forwardZ * 16
        );
        _camLook.copy(playerObj.position);
      }

      const dampFactor = camMode === 1 ? 24 : 9;
      camera.position.x = THREE.MathUtils.damp(camera.position.x, _camTarget.x, dampFactor, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, _camTarget.y, dampFactor, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, _camTarget.z, dampFactor, dt);

      if (shake > 0) {
        shake = Math.max(0, shake - dt * 2.5);
        camera.position.x += (Math.random() - 0.5) * shake;
        camera.position.y += (Math.random() - 0.5) * shake * 0.6;
      }

      camera.lookAt(_camLook);
      const targetFov = 62 + Math.max(0, speed / maxSpeed) * 16 + (isBoosting ? 5 : 0);
      camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 6, dt);
      camera.updateProjectionMatrix();

      // Sync React HUD at ~12Hz to avoid React overhead
      hudSyncAcc += dt;
      if (hudSyncAcc > 0.08) {
        hudSyncAcc = 0;
        const kmh = Math.round(Math.abs(speed) * (isHighway ? 4.4 : 3.8));
        const gear = Math.min(6, Math.max(1, Math.ceil((Math.abs(speed) / maxSpeed) * 6)));
        setHud({
          speedKmh: kmh,
          lap: Math.min(lap, totalLaps),
          totalLaps,
          position: isHighway || isDrift ? 1 : computePlayerRank(),
          totalCars: rivals.length + 1,
          elapsed: isHighway || isDrift ? Math.max(0, timeLimit - totalElapsed) : totalElapsed,
          score: Math.round(score),
          driftCombo,
          nitro: Math.round(nitro),
          cameraLabel: CAMERA_MODES[camMode],
          gear,
          bannerMsg,
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
  }, [game.id, game.accentColor, game.variant, graphicsQuality, touchInputRef]);

  const isTimed = game.variant === 'hypercar-highway' || game.variant === 'drift-masters';

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#060a18]">
      <div ref={mountRef} className="h-full w-full" />

      {/* Top HUD Bar */}
      <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex items-start justify-between px-4">
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#070913]/85 px-4 py-2 text-xs text-slate-200">
          {!isTimed ? (
            <>
              <div>
                <span className="text-slate-400">Aylana: </span>
                <span className="font-mono-num text-sm font-bold text-white">
                  {hud.lap}/{hud.totalLaps}
                </span>
              </div>
              <span className="text-slate-600">·</span>
              <div>
                <span className="text-slate-400">O‘rin: </span>
                <span className="font-mono-num text-sm font-bold text-sky-400">
                  {hud.position}/{hud.totalCars}
                </span>
              </div>
            </>
          ) : (
            <div>
              <span className="text-slate-400">Ball: </span>
              <span className="font-mono-num text-sm font-bold text-amber-400">{hud.score}</span>
            </div>
          )}
          <span className="text-slate-600">·</span>
          <div>
            <span className="text-slate-400">{isTimed ? 'Qolgan vaqt: ' : 'Vaqt: '}</span>
            <span className="font-mono-num text-sm font-bold text-white">
              {hud.elapsed.toFixed(1)}s
            </span>
          </div>
        </div>

        <div className="hidden rounded-xl border border-white/10 bg-[#070913]/85 px-3 py-2 text-xs text-slate-300 sm:block">
          {hud.cameraLabel} (C)
        </div>
      </div>

      {/* Event / Drift Combo Banner */}
      {(hud.bannerMsg || hud.driftCombo > 0) && (
        <div className="pointer-events-none absolute inset-x-0 top-16 z-10 flex justify-center">
          <div className="rounded-lg border border-sky-400/30 bg-[#070913]/85 px-4 py-1.5 font-display text-sm font-bold text-sky-300">
            {hud.driftCombo > 0 ? `DRIFT x${hud.driftCombo} · ${hud.score} ball` : hud.bannerMsg}
          </div>
        </div>
      )}

      {/* Bottom Right Speedometer (Desktop & Tablet) */}
      <div className="pointer-events-none absolute bottom-4 right-4 z-10 hidden items-end gap-3 rounded-2xl border border-white/10 bg-[#070913]/85 px-5 py-3 lg:flex">
        <div>
          <div className="text-[11px] text-slate-400">UZATMA</div>
          <div className="font-mono-num text-xl font-bold text-sky-400">{hud.gear}</div>
        </div>
        <div className="h-8 w-px bg-white/10" />
        <div>
          <div className="font-mono-num text-3xl font-bold leading-none text-white">
            {hud.speedKmh}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">KM/SOAT</div>
        </div>
        <div className="h-8 w-px bg-white/10" />
        <div className="w-20">
          <div className="mb-1 flex justify-between text-[11px] text-slate-400">
            <span>NITRO</span>
            <span className="font-mono-num text-amber-300">{hud.nitro}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-amber-400"
              style={{ width: `${hud.nitro}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
