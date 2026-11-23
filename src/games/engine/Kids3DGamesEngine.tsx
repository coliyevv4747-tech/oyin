import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GameEngineProps } from './types';
import { addStudioLighting, createStudioThreeContext } from './threeSetup';
import { createGrassTexture } from './proceduralTextures';
import { AnimalType, buildAnimalModel, buildTreeModel, buildVehicleModel } from './models';
import { audioEngine } from '../../utils/audio';

const ANIMALS: { type: AnimalType; uzName: string }[] = [
  { type: 'lion', uzName: 'Sher' },
  { type: 'elephant', uzName: 'Fil' },
  { type: 'giraffe', uzName: 'Jirafa' },
  { type: 'sheep', uzName: 'Qo‘y' },
  { type: 'rabbit', uzName: 'Quyon' },
  { type: 'panda', uzName: 'Panda' },
];

const SHAPES = [
  { id: 'cube', uzName: 'Kub', color: 0xef4444 },
  { id: 'sphere', uzName: 'Shar', color: 0x3b82f6 },
  { id: 'cone', uzName: 'Konus', color: 0x22c55e },
  { id: 'cylinder', uzName: 'Silindr', color: 0xfacc15 },
];

export const Kids3DGamesEngine: React.FC<GameEngineProps> = ({
  game,
  isPaused,
  graphicsQuality,
  touchInputRef,
  onComplete,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(isPaused);
  const onCompleteRef = useRef(onComplete);

  const [promptText, setPromptText] = useState('');
  const [score, setScore] = useState(0);
  const [progress, setProgress] = useState({ current: 0, total: 10 });
  const [feedback, setFeedback] = useState('');

  const pickTriggerRef = useRef<((choice: string) => void) | null>(null);

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const variant = game.variant;
    const ctx = createStudioThreeContext(container, {
      skyColor: 0x60a5fa,
      fogColor: 0xbae6fd,
      fogNear: 35,
      fogFar: 130,
      fov: 58,
      far: 200,
      graphicsQuality,
    });

    const { scene, camera, renderer, isSoftwareGl, maxAnisotropy } = ctx;
    addStudioLighting(scene, {
      isSoftwareGl,
      skyColor: 0xe0f2fe,
      groundColor: 0x22c55e,
      sunColor: 0xfffbeb,
      sunIntensity: 1.85,
      sunPos: [25, 45, 25],
      shadowRange: 35,
    });

    const grassTex = createGrassTexture(maxAnisotropy, '#22c55e', '#4ade80');
    grassTex.repeat.set(24, 24);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(180, 180),
      new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.9 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    let elapsed = 0;
    let curScore = 0;
    let finished = false;

    const finishGame = (won: boolean, summary: string, stars: number) => {
      if (finished) return;
      finished = true;
      audioEngine.playWin();
      onCompleteRef.current({
        score: curScore,
        timeSeconds: Math.max(5, elapsed),
        won,
        stars,
        summaryLabel: summary,
      });
    };

    // =========================================================================
    // VARIANT 1: RANGLI MASHINALAR (Drive toy car through rainbow paint gates)
    // =========================================================================
    if (variant === 'colorful-cars') {
      setPromptText('Rangli darvozalardan o‘ting va 10 ta yulduz yig‘ing!');
      setProgress({ current: 0, total: 10 });

      // Circular park road
      const road = new THREE.Mesh(
        new THREE.RingGeometry(15, 24, 48),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85, side: THREE.DoubleSide })
      );
      road.rotation.x = -Math.PI / 2;
      road.position.y = 0.03;
      scene.add(road);

      for (let i = 0; i < 14; i++) {
        const ang = (i / 14) * Math.PI * 2;
        const t = buildTreeModel('cartoon');
        t.position.set(Math.cos(ang) * 32, 0, Math.sin(ang) * 32);
        scene.add(t);
      }

      const gateColors = [0xf43f5e, 0xf59e0b, 0x22c55e, 0x38bdf8, 0xa855f7];
      const gates: { pos: THREE.Vector3; color: number }[] = [];
      gateColors.forEach((col, i) => {
        const ang = (i / gateColors.length) * Math.PI * 2;
        const gx = Math.cos(ang) * 19.5;
        const gz = Math.sin(ang) * 19.5;
        const arch = new THREE.Mesh(
          new THREE.TorusGeometry(3.6, 0.35, 10, 24, Math.PI),
          new THREE.MeshStandardMaterial({ color: col, roughness: 0.35 })
        );
        arch.position.set(gx, 0.1, gz);
        arch.rotation.y = -ang;
        scene.add(arch);
        gates.push({ pos: new THREE.Vector3(gx, 0, gz), color: col });
      });

      const stars: { mesh: THREE.Mesh; active: boolean }[] = [];
      for (let i = 0; i < 10; i++) {
        const ang = (i / 10) * Math.PI * 2 + 0.3;
        const st = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.95, 0),
          new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xf59e0b, emissiveIntensity: 0.7 })
        );
        st.position.set(Math.cos(ang) * 19.5, 1.3, Math.sin(ang) * 19.5);
        scene.add(st);
        stars.push({ mesh: st, active: true });
      }

      const car = buildVehicleModel('toy', 0xf43f5e);
      car.group.position.set(19.5, 0, 0);
      scene.add(car.group);

      let heading = 0;
      let speed = 0;
      let starsCaught = 0;
      const keys: Record<string, boolean> = {};
      const onKD = (e: KeyboardEvent) => (keys[e.code] = true);
      const onKU = (e: KeyboardEvent) => (keys[e.code] = false);
      window.addEventListener('keydown', onKD);
      window.addEventListener('keyup', onKU);
      audioEngine.startEngine();

      ctx.startLoop((dt) => {
        if (pausedRef.current || finished) return;
        elapsed += dt;
        const touch = touchInputRef.current;
        const gas = keys['KeyW'] || keys['ArrowUp'] || touch.up;
        const brk = keys['KeyS'] || keys['ArrowDown'] || touch.down;
        const lft = keys['KeyA'] || keys['ArrowLeft'] || touch.left;
        const rgt = keys['KeyD'] || keys['ArrowRight'] || touch.right;

        if (gas) speed += 22 * dt;
        else if (brk) speed -= 22 * dt;
        else speed *= Math.exp(-1.5 * dt);
        speed = THREE.MathUtils.clamp(speed, -10, 22);

        const steer = (lft ? 1 : 0) - (rgt ? 1 : 0);
        heading += steer * 2.1 * dt * Math.min(1, Math.abs(speed) / 5 + 0.3);
        car.group.position.x += -Math.sin(heading) * speed * dt;
        car.group.position.z += -Math.cos(heading) * speed * dt;
        car.group.rotation.y = heading;
        car.wheels.forEach((w) => (w.rotation.x -= (speed * dt) / 0.36));
        audioEngine.updateEngine(Math.abs(speed) / 22, false);

        for (const g of gates) {
          if (car.group.position.distanceToSquared(g.pos) < 12) {
            car.setBodyColor(g.color);
          }
        }
        for (const s of stars) {
          if (!s.active) continue;
          s.mesh.rotation.y += dt * 2;
          if (car.group.position.distanceToSquared(s.mesh.position) < 9) {
            s.active = false;
            s.mesh.visible = false;
            starsCaught += 1;
            curScore += 100;
            setScore(curScore);
            setProgress({ current: starsCaught, total: 10 });
            audioEngine.playCollect();
            if (starsCaught >= 10) {
              finishGame(true, 'Ajoyib! Barcha 10 ta yulduzni yig‘dingiz!', 3);
            }
          }
        }

        const fx = -Math.sin(heading);
        const fz = -Math.cos(heading);
        camera.position.set(
          THREE.MathUtils.damp(camera.position.x, car.group.position.x - fx * 9, 8, dt),
          THREE.MathUtils.damp(camera.position.y, 4.5, 8, dt),
          THREE.MathUtils.damp(camera.position.z, car.group.position.z - fz * 9, 8, dt)
        );
        camera.lookAt(car.group.position.x, 1.2, car.group.position.z);
      });

      return () => {
        audioEngine.stopEngine();
        window.removeEventListener('keydown', onKD);
        window.removeEventListener('keyup', onKU);
        ctx.dispose();
      };
    }

    // =========================================================================
    // VARIANT 2: HAYVONLARNI TOP (3D Animal Meadow Discovery)
    // =========================================================================
    if (variant === 'find-animals') {
      const roundTotal = 6;
      let roundIdx = 0;
      const order = [...ANIMALS].sort(() => Math.random() - 0.5);
      setPromptText(`Qani, ${order[0].uzName}ni toping!`);
      setProgress({ current: 0, total: roundTotal });

      const animalMeshes: { type: AnimalType; group: THREE.Group; baseY: number; bounce: number }[] = [];
      ANIMALS.forEach((a, i) => {
        const ang = (i / ANIMALS.length) * Math.PI * 2 - Math.PI / 2;
        const rad = 7.5;
        const m = buildAnimalModel(a.type);
        m.position.set(Math.cos(ang) * rad, 0, Math.sin(ang) * rad);
        m.lookAt(0, 0, 0);
        m.userData = { animalType: a.type };
        scene.add(m);
        animalMeshes.push({ type: a.type, group: m, baseY: 0, bounce: 0 });
      });

      camera.position.set(0, 8.5, 16);
      camera.lookAt(0, 1.2, 0);

      const raycaster = new THREE.Raycaster();
      const ptr = new THREE.Vector2();

      const handlePick = (chosen: AnimalType) => {
        if (finished || pausedRef.current) return;
        const target = order[roundIdx];
        if (chosen === target.type) {
          audioEngine.playCollect();
          curScore += 150;
          setScore(curScore);
          const item = animalMeshes.find((a) => a.type === chosen);
          if (item) item.bounce = 1.4;
          roundIdx += 1;
          setProgress({ current: roundIdx, total: roundTotal });
          setFeedback(`Barakalla! Bu ${target.uzName}!`);
          if (roundIdx >= roundTotal) {
            setTimeout(() => {
              finishGame(true, 'Barcha 6 ta hayvonni to‘g‘ri topdingiz!', 3);
            }, 600);
          } else {
            setPromptText(`Endi ${order[roundIdx].uzName}ni toping!`);
          }
        } else {
          audioEngine.playCrash();
          setFeedback('Yana bir urinib ko‘ring!');
        }
      };

      pickTriggerRef.current = (choice) => handlePick(choice as AnimalType);

      const onClick = (e: MouseEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        ptr.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        ptr.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(ptr, camera);
        const hits = raycaster.intersectObjects(
          animalMeshes.map((a) => a.group),
          true
        );
        if (hits.length > 0) {
          let obj: THREE.Object3D | null = hits[0].object;
          while (obj && !obj.userData.animalType) obj = obj.parent;
          if (obj?.userData.animalType) {
            handlePick(obj.userData.animalType);
          }
        }
      };
      renderer.domElement.addEventListener('click', onClick);

      ctx.startLoop((dt, totalTime) => {
        if (pausedRef.current) return;
        elapsed += dt;
        animalMeshes.forEach((a, idx) => {
          if (a.bounce > 0) a.bounce = Math.max(0, a.bounce - dt * 3);
          a.group.position.y = Math.abs(Math.sin(totalTime * 2 + idx)) * 0.25 + a.bounce;
          a.group.rotation.y += dt * 0.35;
        });
      });

      return () => {
        renderer.domElement.removeEventListener('click', onClick);
        ctx.dispose();
      };
    }

    // =========================================================================
    // VARIANT 3: SHAKLLAR DUNYOSI (3D Shape Matching)
    // =========================================================================
    if (variant === 'shapes-world') {
      const totalRounds = 8;
      let round = 0;
      let currentTarget = SHAPES[0];
      setPromptText(`Mos shaklni tanlang: ${currentTarget.uzName}`);
      setProgress({ current: 0, total: totalRounds });

      const pedestal = new THREE.Mesh(
        new THREE.CylinderGeometry(2.2, 2.6, 1.2, 24),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 })
      );
      pedestal.position.set(0, 0.6, 0);
      scene.add(pedestal);

      const targetGroup = new THREE.Group();
      targetGroup.position.set(0, 2.8, 0);
      scene.add(targetGroup);

      const spawnTargetShape = (shapeId: string, colorHex: number) => {
        targetGroup.clear();
        const mat = new THREE.MeshPhysicalMaterial({
          color: colorHex,
          roughness: 0.25,
          clearcoat: 0.9,
        });
        const geo =
          shapeId === 'cube'
            ? new THREE.BoxGeometry(2.2, 2.2, 2.2)
            : shapeId === 'sphere'
            ? new THREE.SphereGeometry(1.35, 24, 24)
            : shapeId === 'cone'
            ? new THREE.ConeGeometry(1.35, 2.4, 20)
            : new THREE.CylinderGeometry(1.1, 1.1, 2.2, 20);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        targetGroup.add(mesh);
      };

      spawnTargetShape(currentTarget.id, currentTarget.color);
      camera.position.set(0, 4.8, 9.5);
      camera.lookAt(0, 2.2, 0);

      pickTriggerRef.current = (shapeId) => {
        if (finished || pausedRef.current) return;
        if (shapeId === currentTarget.id) {
          audioEngine.playCollect();
          curScore += 125;
          setScore(curScore);
          round += 1;
          setProgress({ current: round, total: totalRounds });
          setFeedback(`To‘g‘ri! Bu ${currentTarget.uzName}!`);
          if (round >= totalRounds) {
            setTimeout(() => finishGame(true, 'Barcha 3D shakllarni to‘g‘ri topdingiz!', 3), 500);
          } else {
            currentTarget = SHAPES[(round + Math.floor(Math.random() * 3)) % SHAPES.length];
            spawnTargetShape(currentTarget.id, currentTarget.color);
            setPromptText(`Mos shaklni tanlang: ${currentTarget.uzName}`);
          }
        } else {
          audioEngine.playCrash();
          setFeedback('Boshqa shaklni sinab ko‘ring!');
        }
      };

      ctx.startLoop((dt) => {
        if (pausedRef.current) return;
        elapsed += dt;
        targetGroup.rotation.y += dt * 1.4;
        targetGroup.rotation.x = Math.sin(elapsed * 1.5) * 0.15;
      });

      return () => ctx.dispose();
    }

    // =========================================================================
    // VARIANT 4: MEVALARNI YIG' (3D Orchard Fruit Collector)
    // =========================================================================
    setPromptText('Shirin mevalarni savatchaga yig‘ing!');
    setProgress({ current: 0, total: 15 });

    const laneGround = new THREE.Mesh(
      new THREE.BoxGeometry(14, 0.2, 50),
      new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.9 })
    );
    laneGround.position.set(0, 0.05, -10);
    scene.add(laneGround);

    // Basket
    const basket = new THREE.Group();
    const basketBody = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.0, 1.1, 14),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 })
    );
    basketBody.position.y = 0.65;
    basketBody.castShadow = true;
    basket.add(basketBody);
    basket.position.set(0, 0.1, 4);
    scene.add(basket);

    camera.position.set(0, 8, 12);
    camera.lookAt(0, 1.5, -6);

    const fruits: { mesh: THREE.Group; isBad: boolean; active: boolean }[] = [];
    const fruitColors = [0xef4444, 0xf97316, 0xfacc15];
    let spawnTimer = 0;
    let caught = 0;
    let basketX = 0;

    const keys: Record<string, boolean> = {};
    const onKD = (e: KeyboardEvent) => (keys[e.code] = true);
    const onKU = (e: KeyboardEvent) => (keys[e.code] = false);
    window.addEventListener('keydown', onKD);
    window.addEventListener('keyup', onKU);

    const spawnItem = () => {
      const isBad = Math.random() < 0.22;
      const g = new THREE.Group();
      const laneX = (Math.floor(Math.random() * 3) - 1) * 4.0;
      g.position.set(laneX, 1.0, -28);
      if (isBad) {
        const mud = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.85, 0),
          new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.95 })
        );
        g.add(mud);
      } else {
        const col = fruitColors[Math.floor(Math.random() * fruitColors.length)];
        const apple = new THREE.Mesh(
          new THREE.SphereGeometry(0.75, 14, 14),
          new THREE.MeshStandardMaterial({ color: col, roughness: 0.35 })
        );
        const leaf = new THREE.Mesh(
          new THREE.BoxGeometry(0.35, 0.12, 0.2),
          new THREE.MeshStandardMaterial({ color: 0x22c55e })
        );
        leaf.position.set(0.2, 0.85, 0);
        g.add(apple, leaf);
      }
      scene.add(g);
      fruits.push({ mesh: g, isBad, active: true });
    };

    ctx.startLoop((dt) => {
      if (pausedRef.current || finished) return;
      elapsed += dt;

      const touch = touchInputRef.current;
      const move = (keys['KeyD'] || keys['ArrowRight'] || touch.right ? 1 : 0) -
        (keys['KeyA'] || keys['ArrowLeft'] || touch.left ? 1 : 0);
      basketX = THREE.MathUtils.clamp(basketX + move * 14 * dt, -5.2, 5.2);
      basket.position.x = THREE.MathUtils.damp(basket.position.x, basketX, 14, dt);

      spawnTimer += dt;
      if (spawnTimer > 0.85) {
        spawnTimer = 0;
        spawnItem();
      }

      for (const f of fruits) {
        if (!f.active) continue;
        f.mesh.position.z += 12.5 * dt;
        f.mesh.rotation.y += dt * 2;
        if (Math.abs(f.mesh.position.z - basket.position.z) < 1.3 && Math.abs(f.mesh.position.x - basket.position.x) < 1.8) {
          f.active = false;
          f.mesh.visible = false;
          if (f.isBad) {
            audioEngine.playCrash();
            curScore = Math.max(0, curScore - 30);
            setScore(curScore);
            setFeedback('Voy! Loydan qoching!');
          } else {
            audioEngine.playCollect();
            caught += 1;
            curScore += 100;
            setScore(curScore);
            setProgress({ current: caught, total: 15 });
            setFeedback('+100 Shirin meva!');
            if (caught >= 15) {
              finishGame(true, 'Barakalla! 15 ta shirin meva yig‘dingiz!', 3);
            }
          }
        } else if (f.mesh.position.z > 8) {
          f.active = false;
          f.mesh.visible = false;
        }
      }
    });

    return () => {
      window.removeEventListener('keydown', onKD);
      window.removeEventListener('keyup', onKU);
      ctx.dispose();
    };
  }, [game.id, game.variant, graphicsQuality, touchInputRef]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#1e3a5f]">
      <div ref={mountRef} className="h-full w-full" />

      {/* Kid-friendly top banner */}
      <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex flex-col items-center gap-2 px-4">
        <div className="flex items-center gap-4 rounded-2xl border border-white/20 bg-[#070913]/85 px-5 py-2.5 text-sm font-bold text-white">
          <span className="text-amber-300">{promptText}</span>
          <span className="text-slate-500">·</span>
          <span className="font-mono-num text-emerald-400">
            {progress.current}/{progress.total}
          </span>
          <span className="text-slate-500">·</span>
          <span className="font-mono-num text-sky-300">{score} ball</span>
        </div>

        {feedback && (
          <div className="rounded-xl border border-emerald-400/30 bg-[#070913]/85 px-4 py-1 text-xs font-semibold text-emerald-300">
            {feedback}
          </div>
        )}
      </div>

      {/* Large colorful tap buttons for Find Animals / Shapes World */}
      {game.variant === 'find-animals' && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-3">
          <div className="pointer-events-auto flex flex-wrap justify-center gap-2 rounded-2xl border border-white/15 bg-[#070913]/90 p-2">
            {ANIMALS.map((a) => (
              <button
                key={a.type}
                type="button"
                onClick={() => pickTriggerRef.current?.(a.type)}
                className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition-transform hover:bg-sky-500 active:scale-95"
              >
                {a.uzName}
              </button>
            ))}
          </div>
        </div>
      )}

      {game.variant === 'shapes-world' && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-3">
          <div className="pointer-events-auto flex flex-wrap justify-center gap-2.5 rounded-2xl border border-white/15 bg-[#070913]/90 p-2.5">
            {SHAPES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => pickTriggerRef.current?.(s.id)}
                className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition-transform hover:bg-purple-500 active:scale-95"
              >
                {s.uzName}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
