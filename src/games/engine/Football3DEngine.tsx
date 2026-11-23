import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GameEngineProps } from './types';
import { addStudioLighting, createStudioThreeContext } from './threeSetup';
import { createPitchTexture } from './proceduralTextures';
import { audioEngine } from '../../utils/audio';

const _dir = new THREE.Vector3();
const _camGoal = new THREE.Vector3();

export const Football3DEngine: React.FC<GameEngineProps> = ({
  isPaused,
  graphicsQuality,
  touchInputRef,
  onComplete,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(isPaused);
  const onCompleteRef = useRef(onComplete);

  const [hud, setHud] = useState({ blue: 0, red: 0, timeLeft: 90, banner: '' });

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const ctx = createStudioThreeContext(container, {
      skyColor: 0x070d1f,
      fogColor: 0x070d1f,
      fogNear: 55,
      fogFar: 150,
      fov: 55,
      far: 220,
      graphicsQuality,
    });

    const { scene, camera, isSoftwareGl, maxAnisotropy } = ctx;
    addStudioLighting(scene, {
      isSoftwareGl,
      skyColor: 0xe0f2fe,
      groundColor: 0x064e3b,
      sunColor: 0xffffff,
      sunIntensity: 1.9,
      sunPos: [20, 45, 22],
      shadowRange: 38,
    });

    const pitchW = 36;
    const pitchL = 56;
    const pitchTex = createPitchTexture(maxAnisotropy);

    const pitch = new THREE.Mesh(
      new THREE.PlaneGeometry(pitchW, pitchL),
      new THREE.MeshStandardMaterial({ map: pitchTex, roughness: 0.85 })
    );
    pitch.rotation.x = -Math.PI / 2;
    pitch.receiveShadow = true;
    scene.add(pitch);

    // Stadium stands
    const standMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    [
      [0, 3, -pitchL / 2 - 5, pitchW + 14, 6, 6],
      [0, 3, pitchL / 2 + 5, pitchW + 14, 6, 6],
      [-pitchW / 2 - 5, 3, 0, 6, 6, pitchL],
      [pitchW / 2 + 5, 3, 0, 6, 6, pitchL],
    ].forEach(([x, y, z, w, h, d]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), standMat);
      m.position.set(x, y, z);
      scene.add(m);
    });

    // Goals (North = -Z opponent goal, South = +Z player goal)
    const buildGoal = (zPos: number, color: number) => {
      const g = new THREE.Group();
      const postMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.4 });
      const netMat = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.45 });
      const left = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 3.2, 10), postMat);
      left.position.set(-4.5, 1.6, 0);
      const right = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 3.2, 10), postMat);
      right.position.set(4.5, 1.6, 0);
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 9.2, 10), postMat);
      bar.rotation.z = Math.PI / 2;
      bar.position.set(0, 3.2, 0);
      const net = new THREE.Mesh(new THREE.BoxGeometry(9, 3.2, 2.2), netMat);
      net.position.set(0, 1.6, zPos < 0 ? -1.1 : 1.1);
      g.add(left, right, bar, net);
      g.position.set(0, 0, zPos);
      scene.add(g);
    };
    buildGoal(-pitchL / 2 + 1.5, 0x38bdf8);
    buildGoal(pitchL / 2 - 1.5, 0xf43f5e);

    // Ball
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.62, 20, 20),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 })
    );
    ball.position.set(0, 0.62, 0);
    ball.castShadow = true;
    scene.add(ball);
    const ballVel = new THREE.Vector3();

    const makePlayerMesh = (colorHex: number, isHuman = false) => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.48, 0.8, 6, 12),
        new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.55 })
      );
      body.position.y = 1.05;
      body.castShadow = true;
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.36, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.65 })
      );
      head.position.y = 1.95;
      g.add(body, head);
      if (isHuman) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.75, 0.98, 24),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.04;
        g.add(ring);
      }
      scene.add(g);
      return g;
    };

    const human = makePlayerMesh(0x2563eb, true);
    human.position.set(0, 0, 8);

    const mate = makePlayerMesh(0x38bdf8);
    mate.position.set(-8, 0, 4);

    const opp1 = makePlayerMesh(0xef4444);
    opp1.position.set(0, 0, -9);

    const oppKeeper = makePlayerMesh(0xf97316);
    oppKeeper.position.set(0, 0, -pitchL / 2 + 3.2);

    let blueScore = 0;
    let redScore = 0;
    let timeLeft = 90;
    let finished = false;
    let banner = '';
    let bannerTimer = 0;

    const resetPositions = () => {
      ball.position.set(0, 0.62, 0);
      ballVel.set(0, 0, 0);
      human.position.set(0, 0, 8);
      mate.position.set(-7, 0, 4);
      opp1.position.set(0, 0, -9);
    };

    const keys: Record<string, boolean> = {};
    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
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

    let lastActionTrig = touchInputRef.current.actionTrigger;
    let hudAcc = 0;

    ctx.startLoop((dt) => {
      if (pausedRef.current || finished) return;

      timeLeft -= dt;
      if (bannerTimer > 0) {
        bannerTimer -= dt;
        if (bannerTimer <= 0) banner = '';
      }

      if (timeLeft <= 0 && !finished) {
        finished = true;
        audioEngine.playWin();
        const won = blueScore >= redScore;
        const score = Math.max(100, blueScore * 300 - redScore * 60 + 200);
        onCompleteRef.current({
          score,
          timeSeconds: 90,
          won,
          stars: blueScore > redScore + 1 ? 3 : blueScore >= redScore ? 2 : 1,
          summaryLabel:
            blueScore > redScore
              ? `G‘alaba! Yakuniy hisob ${blueScore} : ${redScore}`
              : blueScore === redScore
              ? `Durrang! Hisob ${blueScore} : ${redScore}`
              : `O‘yin tugadi. Hisob ${blueScore} : ${redScore}`,
          extraStats: [
            { label: 'Sizning jamoa', value: `${blueScore}` },
            { label: 'Raqib jamoa', value: `${redScore}` },
          ],
        });
        return;
      }

      const touch = touchInputRef.current;
      const mx = (keys['KeyD'] || keys['ArrowRight'] || touch.right ? 1 : 0) -
        (keys['KeyA'] || keys['ArrowLeft'] || touch.left ? 1 : 0);
      const mz = (keys['KeyS'] || keys['ArrowDown'] || touch.down ? 1 : 0) -
        (keys['KeyW'] || keys['ArrowUp'] || touch.up ? 1 : 0);
      const sprint = keys['ShiftLeft'] || keys['ShiftRight'];
      const kick = keys['Space'] || touch.brake || touch.actionTrigger !== lastActionTrig;
      lastActionTrig = touch.actionTrigger;

      const pSpeed = sprint ? 16 : 12;
      if (mx !== 0 || mz !== 0) {
        _dir.set(mx, 0, mz).normalize();
        human.position.addScaledVector(_dir, pSpeed * dt);
        human.rotation.y = Math.atan2(_dir.x, _dir.z);
      }
      human.position.x = THREE.MathUtils.clamp(human.position.x, -pitchW / 2 + 1, pitchW / 2 - 1);
      human.position.z = THREE.MathUtils.clamp(human.position.z, -pitchL / 2 + 1, pitchL / 2 - 1);

      // Teammate & AI Opponent simple soccer positioning
      const moveTowards = (actor: THREE.Group, tx: number, tz: number, spd: number) => {
        _dir.set(tx - actor.position.x, 0, tz - actor.position.z);
        if (_dir.lengthSq() > 0.25) {
          _dir.normalize();
          actor.position.addScaledVector(_dir, spd * dt);
          actor.rotation.y = Math.atan2(_dir.x, _dir.z);
        }
      };
      moveTowards(mate, ball.position.x - 5, ball.position.z + 3, 7.5);
      moveTowards(opp1, ball.position.x, ball.position.z - 0.5, 7.2);
      const keeperX = THREE.MathUtils.clamp(ball.position.x, -3.8, 3.8);
      moveTowards(oppKeeper, keeperX, -pitchL / 2 + 3.2, 6.5);

      // Player-Ball Dribble & Power Kick
      const distHumanBall = human.position.distanceTo(ball.position);
      if (distHumanBall < 1.55) {
        _dir.subVectors(ball.position, human.position).setY(0).normalize();
        if (kick) {
          ballVel.copy(_dir).multiplyScalar(27);
          ballVel.y = 4.2;
          audioEngine.playAction();
        } else {
          ballVel.copy(_dir).multiplyScalar(11.5);
        }
      }

      // Opponent & Keeper Ball Interaction
      if (opp1.position.distanceTo(ball.position) < 1.3) {
        _dir.set(0 - ball.position.x, 0, pitchL / 2 - ball.position.z).normalize();
        ballVel.copy(_dir).multiplyScalar(14);
        audioEngine.playClick();
      }
      if (oppKeeper.position.distanceTo(ball.position) < 1.4) {
        _dir.set((Math.random() - 0.5) * 10, 0, 14).normalize();
        ballVel.copy(_dir).multiplyScalar(18);
        audioEngine.playClick();
      }

      // Ball physics
      ball.position.addScaledVector(ballVel, dt);
      if (ball.position.y > 0.62) {
        ballVel.y -= 18 * dt;
      }
      if (ball.position.y <= 0.62) {
        ball.position.y = 0.62;
        ballVel.y = 0;
      }
      ballVel.x *= Math.exp(-1.5 * dt);
      ballVel.z *= Math.exp(-1.5 * dt);

      ball.rotation.x += ballVel.z * dt * 0.8;
      ball.rotation.z -= ballVel.x * dt * 0.8;

      // Goal Detection
      const inGoalX = Math.abs(ball.position.x) < 4.4;
      if (ball.position.z < -pitchL / 2 + 1.5 && inGoalX) {
        blueScore += 1;
        banner = 'GOOOL! Sizning jamoangiz!';
        bannerTimer = 2.2;
        audioEngine.playWin();
        resetPositions();
      } else if (ball.position.z > pitchL / 2 - 1.5 && inGoalX) {
        redScore += 1;
        banner = 'Raqib gol urdi!';
        bannerTimer = 2.0;
        audioEngine.playCrash();
        resetPositions();
      } else {
        // Wall bounces
        if (Math.abs(ball.position.x) > pitchW / 2 - 0.8) {
          ball.position.x = Math.sign(ball.position.x) * (pitchW / 2 - 0.8);
          ballVel.x *= -0.75;
        }
        if (Math.abs(ball.position.z) > pitchL / 2 - 1.2) {
          ball.position.z = Math.sign(ball.position.z) * (pitchL / 2 - 1.2);
          ballVel.z *= -0.75;
        }
      }

      // Smooth Stadium Camera
      _camGoal.set(human.position.x * 0.45, 16, human.position.z + 18);
      camera.position.x = THREE.MathUtils.damp(camera.position.x, _camGoal.x, 5, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, _camGoal.y, 5, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, _camGoal.z, 5, dt);
      camera.lookAt(ball.position.x * 0.5, 0.5, ball.position.z * 0.6);

      hudAcc += dt;
      if (hudAcc > 0.1) {
        hudAcc = 0;
        setHud({ blue: blueScore, red: redScore, timeLeft: Math.ceil(timeLeft), banner });
      }
    });

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      ctx.dispose();
    };
  }, [graphicsQuality, touchInputRef]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#070d1f]">
      <div ref={mountRef} className="h-full w-full" />

      <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-4">
        <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-[#070913]/90 px-5 py-2 text-sm font-bold text-white">
          <span className="text-sky-400">KO‘K {hud.blue}</span>
          <span className="text-slate-500">:</span>
          <span className="text-rose-400">{hud.red} QIZIL</span>
          <span className="text-slate-600">·</span>
          <span className="font-mono-num text-amber-300">{hud.timeLeft}s</span>
        </div>
      </div>

      {hud.banner && (
        <div className="pointer-events-none absolute inset-x-0 top-16 z-10 flex justify-center">
          <div className="rounded-xl border border-emerald-400/40 bg-[#070913]/90 px-5 py-2 font-display text-lg font-bold text-emerald-300">
            {hud.banner}
          </div>
        </div>
      )}
    </div>
  );
};
