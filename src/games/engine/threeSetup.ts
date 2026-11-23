import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GraphicsQuality } from '../../types';

export function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export interface StudioThreeContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  isSoftwareGl: boolean;
  maxAnisotropy: number;
  startLoop: (onTick: (dt: number, elapsed: number) => void) => void;
  stopLoop: () => void;
  dispose: () => void;
}

export function createStudioThreeContext(
  container: HTMLElement,
  options: {
    skyColor?: number;
    fogColor?: number;
    fogNear?: number;
    fogFar?: number;
    fov?: number;
    far?: number;
    graphicsQuality?: GraphicsQuality;
    onContextLost?: () => void;
    onContextRestored?: () => void;
  } = {}
): StudioThreeContext {
  const isSoftwareGl = detectSoftwareWebGL();
  const quality = options.graphicsQuality ?? 'auto';
  const allowShadows = !isSoftwareGl && quality !== 'eco';
  const pixelRatio = isSoftwareGl
    ? 1
    : quality === 'eco'
    ? 1
    : Math.min(window.devicePixelRatio || 1, 2);

  const width = Math.max(container.clientWidth, 320);
  const height = Math.max(container.clientHeight, 240);

  const scene = new THREE.Scene();
  const bgHex = options.skyColor ?? 0x0b1224;
  scene.background = new THREE.Color(bgHex);
  if (options.fogColor !== undefined) {
    scene.fog = new THREE.Fog(
      options.fogColor,
      options.fogNear ?? 45,
      options.fogFar ?? 220
    );
  }

  const camera = new THREE.PerspectiveCamera(
    options.fov ?? 62,
    width / height,
    0.2,
    options.far ?? 500
  );
  camera.position.set(0, 6, 12);

  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl && quality !== 'eco',
    powerPreference: 'high-performance',
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(pixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = allowShadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envTarget.texture;
  pmremGenerator.dispose();

  const maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy() || 1);

  const handleLost = (e: Event) => {
    e.preventDefault();
    options.onContextLost?.();
  };
  const handleRestored = () => {
    options.onContextRestored?.();
  };
  renderer.domElement.addEventListener('webglcontextlost', handleLost);
  renderer.domElement.addEventListener('webglcontextrestored', handleRestored);

  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const w = Math.max(entry.contentRect.width, 1);
      const h = Math.max(entry.contentRect.height, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
  });
  resizeObserver.observe(container);

  let frameId = 0;
  let isRunning = false;
  let lastTime = performance.now();
  let startTime = lastTime;

  function afterDraw(cb: () => void) {
    try {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (!isRunning) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    } catch {
      frameId = window.setTimeout(cb, 80);
    }
  }

  const startLoop = (onTick: (dt: number, elapsed: number) => void) => {
    stopLoop();
    isRunning = true;
    lastTime = performance.now();
    startTime = lastTime;

    const tick = () => {
      if (!isRunning) return;
      const now = performance.now();
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);
      const elapsed = (now - startTime) / 1000;

      onTick(dt, elapsed);
      renderer.render(scene, camera);

      if (!isRunning) return;
      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    if (isSoftwareGl) {
      tick();
    } else {
      frameId = requestAnimationFrame(tick);
    }
  };

  const stopLoop = () => {
    isRunning = false;
    cancelAnimationFrame(frameId);
    window.clearTimeout(frameId);
  };

  const dispose = () => {
    stopLoop();
    resizeObserver.disconnect();
    renderer.domElement.removeEventListener('webglcontextlost', handleLost);
    renderer.domElement.removeEventListener('webglcontextrestored', handleRestored);

    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material?.dispose();
        }
      }
    });

    envTarget.dispose();
    renderer.dispose();
    if (renderer.domElement.parentElement === container) {
      container.removeChild(renderer.domElement);
    }
  };

  return {
    scene,
    camera,
    renderer,
    isSoftwareGl,
    maxAnisotropy,
    startLoop,
    stopLoop,
    dispose,
  };
}

export function addStudioLighting(
  scene: THREE.Scene,
  options: {
    isSoftwareGl: boolean;
    skyColor?: number;
    groundColor?: number;
    sunColor?: number;
    sunIntensity?: number;
    sunPos?: [number, number, number];
    shadowRange?: number;
  }
): THREE.DirectionalLight {
  const hemi = new THREE.HemisphereLight(
    options.skyColor ?? 0x93c5fd,
    options.groundColor ?? 0x1e293b,
    0.85
  );
  scene.add(hemi);

  const keyLight = new THREE.DirectionalLight(
    options.sunColor ?? 0xfff5e4,
    options.sunIntensity ?? 1.85
  );
  const [sx, sy, sz] = options.sunPos ?? [38, 64, 28];
  keyLight.position.set(sx, sy, sz);

  if (!options.isSoftwareGl) {
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    const d = options.shadowRange ?? 55;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.camera.near = 2;
    keyLight.shadow.camera.far = 180;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
  }
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x60a5fa, 0.55);
  rimLight.position.set(-30, 22, -35);
  scene.add(rimLight);

  return keyLight;
}
