import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GameEngineProps } from './types';
import { addStudioLighting, createStudioThreeContext } from './threeSetup';
import { audioEngine } from '../../utils/audio';

type ToolId = 'road' | 'house' | 'shop' | 'park' | 'solar' | 'tower' | 'clear';

interface CityTool {
  id: ToolId;
  label: string;
  cost: number;
  pop: number;
  happy: number;
  color: string;
}

const CITY_TOOLS: CityTool[] = [
  { id: 'road', label: 'Yo‘l', cost: 10, pop: 0, happy: 2, color: '#475569' },
  { id: 'house', label: 'Uy', cost: 25, pop: 18, happy: 5, color: '#f59e0b' },
  { id: 'shop', label: 'Do‘kon', cost: 40, pop: 10, happy: 12, color: '#38bdf8' },
  { id: 'park', label: 'Bog‘', cost: 20, pop: 4, happy: 16, color: '#22c55e' },
  { id: 'solar', label: 'Quyosh st.', cost: 45, pop: 5, happy: 10, color: '#818cf8' },
  { id: 'tower', label: 'Bino', cost: 80, pop: 45, happy: 8, color: '#ec4899' },
  { id: 'clear', label: 'Tozalash', cost: 0, pop: 0, happy: 0, color: '#ef4444' },
];

export const CityBuilderEngine: React.FC<GameEngineProps> = ({
  isPaused,
  graphicsQuality,
  onComplete,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(isPaused);
  const onCompleteRef = useRef(onComplete);

  const [activeTool, setActiveTool] = useState<ToolId>('house');
  const activeToolRef = useRef<ToolId>('house');
  const [stats, setStats] = useState({ coins: 350, pop: 0, happy: 70, built: 0 });
  const statsRef = useRef({ coins: 350, pop: 0, happy: 70, built: 0 });
  const elapsedRef = useRef(0);

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const ctx = createStudioThreeContext(container, {
      skyColor: 0x1e293b,
      fogColor: 0x1e293b,
      fogNear: 45,
      fogFar: 130,
      fov: 48,
      far: 220,
      graphicsQuality,
    });

    const { scene, camera, renderer, isSoftwareGl } = ctx;
    camera.position.set(20, 22, 20);

    addStudioLighting(scene, {
      isSoftwareGl,
      skyColor: 0xbae6fd,
      groundColor: 0x1e293b,
      sunColor: 0xfff7ed,
      sunIntensity: 1.75,
      sunPos: [25, 40, 20],
      shadowRange: 30,
    });

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.maxPolarAngle = Math.PI / 2.2;
    controls.minDistance = 12;
    controls.maxDistance = 42;

    // 8x8 Grid Base
    const gridSize = 8;
    const tileSize = 3;
    const offset = ((gridSize - 1) * tileSize) / 2;

    const basePlate = new THREE.Mesh(
      new THREE.BoxGeometry(gridSize * tileSize + 2, 0.8, gridSize * tileSize + 2),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 })
    );
    basePlate.position.y = -0.45;
    basePlate.receiveShadow = true;
    scene.add(basePlate);

    const tileMeshes: THREE.Mesh[] = [];
    const tileGeo = new THREE.BoxGeometry(tileSize - 0.14, 0.16, tileSize - 0.14);
    const tileState = new Map<string, { type: ToolId | null; group: THREE.Group | null; gx: number; gz: number }>();

    for (let gx = 0; gx < gridSize; gx++) {
      for (let gz = 0; gz < gridSize; gz++) {
        const tile = new THREE.Mesh(
          tileGeo,
          new THREE.MeshStandardMaterial({ color: (gx + gz) % 2 === 0 ? 0x1e3a2f : 0x173127, roughness: 0.85 })
        );
        tile.position.set(gx * tileSize - offset, 0, gz * tileSize - offset);
        tile.receiveShadow = true;
        tile.userData = { gx, gz };
        scene.add(tile);
        tileMeshes.push(tile);
        tileState.set(`${gx},${gz}`, { type: null, group: null, gx, gz });
      }
    }

    const build3DStructure = (type: ToolId, x: number, z: number): THREE.Group => {
      const g = new THREE.Group();
      g.position.set(x, 0.08, z);

      if (type === 'road') {
        const road = new THREE.Mesh(
          new THREE.BoxGeometry(tileSize - 0.05, 0.06, tileSize - 0.05),
          new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 })
        );
        const stripe = new THREE.Mesh(
          new THREE.BoxGeometry(0.22, 0.08, 1.2),
          new THREE.MeshStandardMaterial({ color: 0xfbbf24 })
        );
        g.add(road, stripe);
      } else if (type === 'house') {
        const walls = new THREE.Mesh(
          new THREE.BoxGeometry(1.7, 1.3, 1.7),
          new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.7 })
        );
        walls.position.y = 0.65;
        walls.castShadow = true;
        const roof = new THREE.Mesh(
          new THREE.ConeGeometry(1.45, 0.95, 4),
          new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.65 })
        );
        roof.rotation.y = Math.PI / 4;
        roof.position.y = 1.75;
        roof.castShadow = true;
        g.add(walls, roof);
      } else if (type === 'shop') {
        const body = new THREE.Mesh(
          new THREE.BoxGeometry(2.1, 1.6, 2.0),
          new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.45 })
        );
        body.position.y = 0.8;
        body.castShadow = true;
        const awning = new THREE.Mesh(
          new THREE.BoxGeometry(2.2, 0.25, 0.65),
          new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.5 })
        );
        awning.position.set(0, 1.1, 1.1);
        g.add(body, awning);
      } else if (type === 'park') {
        const lawn = new THREE.Mesh(
          new THREE.BoxGeometry(2.5, 0.1, 2.5),
          new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.9 })
        );
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.24, 0.9, 8),
          new THREE.MeshStandardMaterial({ color: 0x78350f })
        );
        trunk.position.y = 0.45;
        const crown = new THREE.Mesh(
          new THREE.SphereGeometry(0.85, 12, 12),
          new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.75 })
        );
        crown.position.y = 1.35;
        crown.castShadow = true;
        g.add(lawn, trunk, crown);
      } else if (type === 'solar') {
        const base = new THREE.Mesh(
          new THREE.BoxGeometry(2.2, 0.2, 2.2),
          new THREE.MeshStandardMaterial({ color: 0x475569 })
        );
        const panel = new THREE.Mesh(
          new THREE.BoxGeometry(1.9, 0.1, 1.5),
          new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.8, roughness: 0.15 })
        );
        panel.position.y = 0.85;
        panel.rotation.x = 0.45;
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.15, 0.15, 0.8, 8),
          new THREE.MeshStandardMaterial({ color: 0x94a3b8 })
        );
        post.position.y = 0.45;
        g.add(base, post, panel);
      } else if (type === 'tower') {
        const b1 = new THREE.Mesh(
          new THREE.BoxGeometry(2.0, 4.4, 2.0),
          new THREE.MeshPhysicalMaterial({ color: 0x6366f1, metalness: 0.7, roughness: 0.2, clearcoat: 0.9 })
        );
        b1.position.y = 2.2;
        b1.castShadow = true;
        const spire = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.2, 1.1, 8),
          new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 0.8 })
        );
        spire.position.y = 4.95;
        g.add(b1, spire);
      }
      return g;
    };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downX = 0;
    let downY = 0;

    const onDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };

    const onUp = (e: PointerEvent) => {
      if (pausedRef.current) return;
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 10) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const hits = raycaster.intersectObjects(tileMeshes, false);
      if (hits.length === 0) return;
      const tile = hits[0].object;
      const { gx, gz } = tile.userData;
      const key = `${gx},${gz}`;
      const cell = tileState.get(key)!;
      const toolId = activeToolRef.current;

      if (toolId === 'clear') {
        if (cell.group) {
          scene.remove(cell.group);
          cell.group = null;
          cell.type = null;
          audioEngine.playCrash();
        }
        return;
      }

      const toolDef = CITY_TOOLS.find((t) => t.id === toolId)!;
      if (cell.type !== null || statsRef.current.coins < toolDef.cost) return;

      const struct = build3DStructure(toolId, tile.position.x, tile.position.z);
      struct.scale.setScalar(0.1);
      scene.add(struct);
      cell.type = toolId;
      cell.group = struct;
      audioEngine.playCollect();

      const nextStats = {
        coins: statsRef.current.coins - toolDef.cost + 15,
        pop: statsRef.current.pop + toolDef.pop,
        happy: Math.min(100, statsRef.current.happy + toolDef.happy),
        built: statsRef.current.built + 1,
      };
      statsRef.current = nextStats;
      setStats(nextStats);
    };

    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointerup', onUp);

    let incomeAcc = 0;

    ctx.startLoop((dt) => {
      if (pausedRef.current) return;
      elapsedRef.current += dt;
      controls.update();

      // Pop-in animation for newly built structures
      for (const cell of tileState.values()) {
        if (cell.group && cell.group.scale.x < 1) {
          const s = Math.min(1, cell.group.scale.x + dt * 5);
          cell.group.scale.setScalar(s);
        }
      }

      // Passive tax income from population
      incomeAcc += dt;
      if (incomeAcc >= 3 && statsRef.current.pop > 0) {
        incomeAcc = 0;
        const tax = Math.max(5, Math.round(statsRef.current.pop * 0.25));
        statsRef.current = { ...statsRef.current, coins: statsRef.current.coins + tax };
        setStats(statsRef.current);
      }
    });

    return () => {
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      controls.dispose();
      ctx.dispose();
    };
  }, [graphicsQuality]);

  const finishCity = () => {
    audioEngine.playWin();
    const s = statsRef.current;
    const finalScore = s.pop * 10 + s.happy * 5 + s.built * 25;
    onCompleteRef.current({
      score: finalScore,
      timeSeconds: Math.max(5, elapsedRef.current),
      won: s.pop >= 80,
      stars: s.pop >= 160 ? 3 : s.pop >= 80 ? 2 : 1,
      summaryLabel: `${s.pop} nafar aholiga ega zamonaviy 3D shahar barpo etdingiz!`,
      extraStats: [
        { label: 'Aholi', value: `${s.pop}` },
        { label: 'Baxt darajasi', value: `${s.happy}%` },
      ],
    });
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0f172a]">
      <div ref={mountRef} className="h-full w-full cursor-pointer" />

      <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex items-center justify-between px-4">
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-[#070913]/90 px-4 py-2 text-xs text-slate-200">
          <span>
            Tanga: <strong className="font-mono-num text-amber-400">{stats.coins}</strong>
          </span>
          <span className="text-slate-600">·</span>
          <span>
            Aholi: <strong className="font-mono-num text-sky-400">{stats.pop}</strong>
          </span>
          <span className="text-slate-600">·</span>
          <span>
            Baxt: <strong className="font-mono-num text-emerald-400">{stats.happy}%</strong>
          </span>
        </div>

        <button
          type="button"
          onClick={finishCity}
          className="pointer-events-auto rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-white hover:bg-sky-400"
        >
          Shaharni topshirish
        </button>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center px-3">
        <div className="pointer-events-auto flex max-w-full items-center gap-1.5 overflow-x-auto rounded-2xl border border-white/15 bg-[#070913]/92 p-2">
          {CITY_TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                audioEngine.playClick();
                setActiveTool(t.id);
              }}
              className={`flex shrink-0 flex-col items-center rounded-xl px-3 py-1.5 text-xs transition-colors ${
                activeTool === t.id
                  ? 'border border-sky-400 bg-sky-500/20 text-white'
                  : 'border border-transparent text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="font-semibold">{t.label}</span>
              <span className="font-mono-num text-[10px] text-amber-300">
                {t.cost > 0 ? `${t.cost} t` : 'Bepul'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
