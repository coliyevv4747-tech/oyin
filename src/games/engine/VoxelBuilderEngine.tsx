import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GameEngineProps } from './types';
import { addStudioLighting, createStudioThreeContext } from './threeSetup';
import { audioEngine } from '../../utils/audio';

interface BlockType {
  id: number;
  name: string;
  color: number;
  hex: string;
}

const BLOCK_TYPES: BlockType[] = [
  { id: 1, name: 'O‘t', color: 0x22c55e, hex: '#22c55e' },
  { id: 2, name: 'Tosh', color: 0x64748b, hex: '#64748b' },
  { id: 3, name: 'Yog‘och', color: 0xb45309, hex: '#b45309' },
  { id: 4, name: 'G‘isht', color: 0xdc2626, hex: '#dc2626' },
  { id: 5, name: 'Oltin', color: 0xfacc15, hex: '#facc15' },
  { id: 6, name: 'Shisha', color: 0x38bdf8, hex: '#38bdf8' },
];

export const VoxelBuilderEngine: React.FC<GameEngineProps> = ({
  isPaused,
  graphicsQuality,
  touchInputRef,
  onComplete,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(isPaused);
  const onCompleteRef = useRef(onComplete);

  const [selectedBlock, setSelectedBlock] = useState(3);
  const selectedBlockRef = useRef(3);
  const [buildMode, setBuildMode] = useState<'place' | 'break'>('place');
  const buildModeRef = useRef<'place' | 'break'>('place');
  const [placedCount, setPlacedCount] = useState(0);
  const placedCountRef = useRef(0);
  const elapsedRef = useRef(0);

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    selectedBlockRef.current = selectedBlock;
  }, [selectedBlock]);

  useEffect(() => {
    buildModeRef.current = buildMode;
  }, [buildMode]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const ctx = createStudioThreeContext(container, {
      skyColor: 0x7dd3fc,
      fogColor: 0xbae6fd,
      fogNear: 35,
      fogFar: 110,
      fov: 65,
      far: 200,
      graphicsQuality,
    });

    const { scene, camera, renderer, isSoftwareGl } = ctx;
    addStudioLighting(scene, {
      isSoftwareGl,
      skyColor: 0xe0f2fe,
      groundColor: 0x166534,
      sunColor: 0xfffbeb,
      sunIntensity: 1.75,
      sunPos: [24, 42, 18],
      shadowRange: 30,
    });

    // Voxel Grid Map
    const blocks = new Map<string, { mesh: THREE.Mesh; typeId: number }>();
    const blockGeo = new THREE.BoxGeometry(1, 1, 1);
    const materials = new Map<number, THREE.MeshStandardMaterial>();
    BLOCK_TYPES.forEach((b) => {
      materials.set(
        b.id,
        new THREE.MeshStandardMaterial({
          color: b.color,
          roughness: b.id === 6 ? 0.15 : 0.78,
          metalness: b.id === 5 ? 0.75 : 0.05,
          transparent: b.id === 6,
          opacity: b.id === 6 ? 0.65 : 1,
        })
      );
    });

    const keyOf = (x: number, y: number, z: number) => `${x},${y},${z}`;
    const addBlock = (x: number, y: number, z: number, typeId: number, countPlayer = false) => {
      const k = keyOf(x, y, z);
      if (blocks.has(k)) return;
      const mat = materials.get(typeId) || materials.get(1)!;
      const mesh = new THREE.Mesh(blockGeo, mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { vx: x, vy: y, vz: z };
      scene.add(mesh);
      blocks.set(k, { mesh, typeId });
      if (countPlayer) {
        placedCountRef.current += 1;
        setPlacedCount(placedCountRef.current);
      }
    };

    const removeBlock = (x: number, y: number, z: number) => {
      if (y <= 0) return; // Keep bedrock floor
      const k = keyOf(x, y, z);
      const entry = blocks.get(k);
      if (!entry) return;
      scene.remove(entry.mesh);
      blocks.delete(k);
    };

    // Build initial voxel clearing with mini hills and sample cottage
    for (let x = -11; x <= 11; x++) {
      for (let z = -11; z <= 11; z++) {
        addBlock(x, 0, z, 1);
        if (Math.abs(x) > 7 && Math.abs(z) > 7) {
          addBlock(x, 1, z, 1);
        }
      }
    }
    // Starter timber tower
    for (let y = 1; y <= 3; y++) {
      addBlock(4, y, -4, 3);
      addBlock(7, y, -4, 3);
    }
    addBlock(5, 3, -4, 4);
    addBlock(6, 3, -4, 4);
    addBlock(5, 1, -4, 6);
    addBlock(6, 1, -4, 6);

    // Highlight wireframe cursor
    const highlightMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.03, 1.03, 1.03),
      new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true })
    );
    highlightMesh.visible = false;
    scene.add(highlightMesh);

    // Player Camera Rig (First/Third-person hybrid exploration)
    const playerPos = new THREE.Vector3(0, 2.2, 6);
    let yaw = 0;
    let pitch = -0.22;
    let vy = 0;
    let onGround = true;

    const keys: Record<string, boolean> = {};
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let isDragging = false;
    let dragDist = 0;
    let lastPX = 0;
    let lastPY = 0;

    const canvas = renderer.domElement;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      dragDist = 0;
      lastPX = e.clientX;
      lastPY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const dx = e.clientX - lastPX;
        const dy = e.clientY - lastPY;
        dragDist += Math.abs(dx) + Math.abs(dy);
        yaw -= dx * 0.005;
        pitch = THREE.MathUtils.clamp(pitch - dy * 0.005, -1.1, 0.8);
        lastPX = e.clientX;
        lastPY = e.clientY;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      if (dragDist > 8 || pausedRef.current) return;

      const rect = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const meshes = Array.from(blocks.values()).map((b) => b.mesh);
      const hits = raycaster.intersectObjects(meshes, false);
      if (hits.length > 0 && hits[0].distance < 22) {
        const hit = hits[0];
        const { vx, vy: by, vz } = hit.object.userData;
        const shouldBreak = e.shiftKey || e.button === 2 || buildModeRef.current === 'break';
        if (shouldBreak) {
          removeBlock(vx, by, vz);
          audioEngine.playCrash();
        } else if (hit.face) {
          const nx = vx + Math.round(hit.face.normal.x);
          const ny = by + Math.round(hit.face.normal.y);
          const nz = vz + Math.round(hit.face.normal.z);
          if (ny >= 1 && ny <= 12 && Math.abs(nx) <= 11 && Math.abs(nz) <= 11) {
            addBlock(nx, ny, nz, selectedBlockRef.current, true);
            audioEngine.playAction();
          }
        }
      }
    };

    const onContext = (e: MouseEvent) => e.preventDefault();
    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      keys[e.code] = true;
      if (e.key >= '1' && e.key <= '6') {
        setSelectedBlock(Number(e.key));
      }
      if (e.code === 'KeyB') {
        setBuildMode((m) => (m === 'place' ? 'break' : 'place'));
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };
    const onBlur = () => {
      Object.keys(keys).forEach((k) => (keys[k] = false));
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('contextmenu', onContext);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    let lastActionTrig = touchInputRef.current.actionTrigger;

    ctx.startLoop((dt) => {
      if (pausedRef.current) return;
      elapsedRef.current += dt;

      const touch = touchInputRef.current;
      const fwd = (keys['KeyW'] || keys['ArrowUp'] || touch.up ? 1 : 0) -
        (keys['KeyS'] || keys['ArrowDown'] || touch.down ? 1 : 0);
      const strafe = (keys['KeyD'] || keys['ArrowRight'] || touch.right ? 1 : 0) -
        (keys['KeyA'] || keys['ArrowLeft'] || touch.left ? 1 : 0);

      if (keys['KeyQ']) yaw += 1.8 * dt;
      if (keys['KeyE']) yaw -= 1.8 * dt;

      const sinY = Math.sin(yaw);
      const cosY = Math.cos(yaw);
      const moveX = (-sinY * fwd + cosY * strafe) * 8.5 * dt;
      const moveZ = (-cosY * fwd - sinY * strafe) * 8.5 * dt;

      playerPos.x = THREE.MathUtils.clamp(playerPos.x + moveX, -10.5, 10.5);
      playerPos.z = THREE.MathUtils.clamp(playerPos.z + moveZ, -10.5, 10.5);

      const wantsJump = keys['Space'] || touch.brake || touch.actionTrigger !== lastActionTrig;
      lastActionTrig = touch.actionTrigger;
      if (wantsJump && onGround) {
        vy = 8.2;
        onGround = false;
        audioEngine.playAction();
      }

      vy -= 22 * dt;
      playerPos.y += vy * dt;

      // Ground height at player x,z
      const gx = Math.round(playerPos.x);
      const gz = Math.round(playerPos.z);
      let maxTop = 0.5;
      for (let y = 0; y <= 12; y++) {
        if (blocks.has(keyOf(gx, y, gz))) {
          maxTop = y + 0.5;
        }
      }
      if (playerPos.y <= maxTop + 1.65) {
        playerPos.y = maxTop + 1.65;
        vy = 0;
        onGround = true;
      }

      camera.position.copy(playerPos);
      camera.rotation.order = 'YXZ';
      camera.rotation.y = yaw;
      camera.rotation.x = pitch;

      // Update block cursor highlight
      raycaster.setFromCamera(pointer, camera);
      const meshes = Array.from(blocks.values()).map((b) => b.mesh);
      const hits = raycaster.intersectObjects(meshes, false);
      if (hits.length > 0 && hits[0].distance < 22) {
        highlightMesh.position.copy(hits[0].object.position);
        highlightMesh.visible = true;
      } else {
        highlightMesh.visible = false;
      }
    });

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('contextmenu', onContext);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      ctx.dispose();
    };
  }, [graphicsQuality, touchInputRef]);

  const finishBuild = () => {
    audioEngine.playWin();
    const score = 150 + placedCountRef.current * 45;
    onCompleteRef.current({
      score,
      timeSeconds: Math.max(5, elapsedRef.current),
      won: placedCountRef.current >= 5,
      stars: placedCountRef.current >= 15 ? 3 : placedCountRef.current >= 8 ? 2 : 1,
      summaryLabel: `${placedCountRef.current} ta 3D blokdan ajoyib inshoot qurdingiz!`,
      extraStats: [{ label: 'Qo‘yilgan bloklar', value: `${placedCountRef.current}` }],
    });
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0c1a2e]">
      <div ref={mountRef} className="h-full w-full cursor-crosshair" />

      {/* Top HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex items-center justify-between px-4">
        <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-white/10 bg-[#070913]/85 px-4 py-2 text-xs text-slate-200">
          <span>
            Bloklar: <strong className="font-mono-num text-emerald-400">{placedCount}</strong> / 15
          </span>
          <span className="text-slate-600">·</span>
          <button
            type="button"
            onClick={() => setBuildMode((m) => (m === 'place' ? 'break' : 'place'))}
            className={`rounded-lg px-2.5 py-1 font-semibold transition-colors ${
              buildMode === 'place' ? 'bg-sky-500 text-white' : 'bg-rose-500 text-white'
            }`}
          >
            {buildMode === 'place' ? 'Qurish rejimi' : 'Buzish rejimi'}
          </button>
        </div>

        <button
          type="button"
          onClick={finishBuild}
          className="pointer-events-auto rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400"
        >
          Natijani saqlash
        </button>
      </div>

      {/* Bottom Block Hotbar */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-3">
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-white/15 bg-[#070913]/90 p-2">
          {BLOCK_TYPES.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                audioEngine.playClick();
                setSelectedBlock(b.id);
              }}
              className={`flex flex-col items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-medium transition-transform ${
                selectedBlock === b.id
                  ? 'scale-105 border border-white bg-white/15 text-white'
                  : 'border border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <span
                className="h-5 w-5 rounded border border-white/30"
                style={{ backgroundColor: b.hex }}
              />
              <span>{b.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
