import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import {
  Maximize2,
  Minimize2,
  Music,
  Pause,
  Play,
  RotateCcw,
  Star,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { AppSettings, GameDefinition, GameResult } from '../types';
import { createEmptyTouchInput } from '../games/engine/types';
import { MobileControls } from './MobileControls';
import { GameThumbnailArt } from './GameThumbnailArt';
import { audioEngine } from '../utils/audio';
import { ACHIEVEMENTS } from '../data/achievements';

const RacingGameEngine = lazy(() =>
  import('../games/engine/RacingGameEngine').then((m) => ({ default: m.RacingGameEngine }))
);
const DrivingOpenWorldEngine = lazy(() =>
  import('../games/engine/DrivingOpenWorldEngine').then((m) => ({
    default: m.DrivingOpenWorldEngine,
  }))
);
const VoxelBuilderEngine = lazy(() =>
  import('../games/engine/VoxelBuilderEngine').then((m) => ({ default: m.VoxelBuilderEngine }))
);
const CityBuilderEngine = lazy(() =>
  import('../games/engine/CityBuilderEngine').then((m) => ({ default: m.CityBuilderEngine }))
);
const Football3DEngine = lazy(() =>
  import('../games/engine/Football3DEngine').then((m) => ({ default: m.Football3DEngine }))
);
const Kids3DGamesEngine = lazy(() =>
  import('../games/engine/Kids3DGamesEngine').then((m) => ({ default: m.Kids3DGamesEngine }))
);

interface GameStageProps {
  game: GameDefinition;
  settings: AppSettings;
  bestScore: number;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onLaunch: (gameId: string) => void;
  onFinish: (gameId: string, result: GameResult) => string[];
  onBackToLibrary: () => void;
}

type StagePhase = 'ready' | 'playing' | 'paused' | 'results';

export const GameStage: React.FC<GameStageProps> = ({
  game,
  settings,
  bestScore,
  onUpdateSettings,
  onLaunch,
  onFinish,
  onBackToLibrary,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const touchInputRef = useRef(createEmptyTouchInput());

  const [phase, setPhase] = useState<StagePhase>('ready');
  const [runKey, setRunKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);

  useEffect(() => {
    setPhase('ready');
    setLastResult(null);
    setNewAchievements([]);
    setRunKey((k) => k + 1);
  }, [game.id]);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && phase === 'playing') {
        setPhase('paused');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase]);

  const startPlay = () => {
    audioEngine.unlock();
    audioEngine.playClick();
    onLaunch(game.id);
    setLastResult(null);
    setNewAchievements([]);
    setPhase('playing');
  };

  const restartPlay = () => {
    audioEngine.playClick();
    touchInputRef.current = createEmptyTouchInput();
    setLastResult(null);
    setNewAchievements([]);
    setRunKey((k) => k + 1);
    setPhase('playing');
  };

  const toggleFullscreen = async () => {
    audioEngine.playClick();
    if (!stageRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await stageRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore fullscreen denial in restricted iframes
    }
  };

  const handleEngineComplete = (result: GameResult) => {
    const unlocked = onFinish(game.id, result);
    setLastResult(result);
    setNewAchievements(unlocked);
    setPhase('results');
  };

  const renderEngine = () => {
    const props = {
      game,
      isPaused: phase !== 'playing',
      graphicsQuality: settings.graphicsQuality,
      touchInputRef,
      onComplete: handleEngineComplete,
    };

    switch (game.engineType) {
      case 'racing':
        return <RacingGameEngine key={`${game.id}-${runKey}`} {...props} />;
      case 'driving-open':
        return <DrivingOpenWorldEngine key={`${game.id}-${runKey}`} {...props} />;
      case 'voxel':
        return <VoxelBuilderEngine key={`${game.id}-${runKey}`} {...props} />;
      case 'city':
        return <CityBuilderEngine key={`${game.id}-${runKey}`} {...props} />;
      case 'football':
        return <Football3DEngine key={`${game.id}-${runKey}`} {...props} />;
      case 'kids-3d':
        return <Kids3DGamesEngine key={`${game.id}-${runKey}`} {...props} />;
    }
  };

  const actionButtonLabel =
    game.variant === 'football-3d'
      ? 'Zarba'
      : game.variant === 'voxel-craft'
      ? 'Sakrash'
      : 'Harakat';

  return (
    <div
      ref={stageRef}
      className="relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0e1d]"
    >
      {/* Stage Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0d1326] px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span className="font-display text-sm font-bold text-white sm:text-base">
            {game.title}
          </span>
          {bestScore > 0 && (
            <span className="font-mono-num text-xs text-amber-300">
              Rekord: {bestScore}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {phase === 'playing' && (
            <button
              type="button"
              onClick={() => {
                audioEngine.playClick();
                setPhase('paused');
              }}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10"
            >
              <Pause className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Pauza</span>
            </button>
          )}
          {phase === 'paused' && (
            <button
              type="button"
              onClick={() => {
                audioEngine.playClick();
                setPhase('playing');
              }}
              className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-400"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Davom ettirish</span>
            </button>
          )}
          {phase !== 'ready' && (
            <button
              type="button"
              onClick={restartPlay}
              title="Qayta boshlash"
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Qayta boshlash</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              audioEngine.unlock();
              onUpdateSettings({ sfxEnabled: !settings.sfxEnabled });
            }}
            title="Ovoz"
            className={`rounded-lg border p-1.5 text-xs ${
              settings.sfxEnabled
                ? 'border-sky-500/30 bg-sky-500/15 text-sky-300'
                : 'border-white/10 bg-white/5 text-slate-400'
            }`}
          >
            {settings.sfxEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => {
              audioEngine.unlock();
              onUpdateSettings({ musicEnabled: !settings.musicEnabled });
            }}
            title="Musiqa"
            className={`rounded-lg border p-1.5 text-xs ${
              settings.musicEnabled
                ? 'border-indigo-500/30 bg-indigo-500/15 text-indigo-300'
                : 'border-white/10 bg-white/5 text-slate-400'
            }`}
          >
            <Music className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            title="To'liq ekran"
            className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-200 hover:bg-white/10"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Main 3D Play Viewport */}
      <div
        className={`relative w-full overflow-hidden bg-[#060914] ${
          isFullscreen ? 'h-[calc(100vh-48px)]' : 'h-[430px] sm:h-[520px] lg:h-[580px]'
        }`}
      >
        {phase === 'ready' ? (
          <div className="relative flex h-full w-full items-center justify-center">
            <GameThumbnailArt game={game} className="absolute inset-0 h-full w-full opacity-55" />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at center, rgba(7,9,19,0.55) 0%, rgba(7,9,19,0.92) 80%)',
              }}
            />

            <div className="relative z-10 flex max-w-lg flex-col items-center px-6 text-center">
              <p className="text-xs font-medium tracking-wide text-sky-400">
                3D INTERAKTIV O‘YIN
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">
                {game.title}
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-300">
                {game.instructions}
              </p>

              <button
                type="button"
                onClick={startPlay}
                className="mt-6 flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-8 py-3.5 font-display text-base font-bold text-white shadow-lg shadow-sky-500/25 transition-transform hover:scale-105 active:scale-95"
              >
                <Play className="h-5 w-5 fill-current" />
                <span>O‘ynash</span>
              </button>

              <p className="mt-4 text-xs text-slate-400">{game.controlsHint}</p>
            </div>
          </div>
        ) : (
          <Suspense
            fallback={
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#070913]">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500/20 border-t-sky-400" />
                <p className="text-sm font-medium text-slate-300">
                  3D o‘yin muhiti yuklanmoqda...
                </p>
              </div>
            }
          >
            {renderEngine()}
            {phase === 'playing' && (
              <MobileControls
                mode={game.mobileControlMode}
                touchInputRef={touchInputRef}
                actionLabel={actionButtonLabel}
              />
            )}
          </Suspense>
        )}

        {/* Pause Overlay */}
        {phase === 'paused' && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#070913]/85 p-6">
            <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#0e1428] p-6 text-center">
              <h3 className="font-display text-2xl font-bold text-white">O‘yin to‘xtatildi</h3>
              <p className="mt-1.5 text-sm text-slate-400">{game.title}</p>
              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    audioEngine.playClick();
                    setPhase('playing');
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 font-semibold text-white hover:bg-sky-400"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>Davom ettirish</span>
                </button>
                <button
                  type="button"
                  onClick={restartPlay}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-3 font-semibold text-slate-200 hover:bg-white/10"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Qayta boshlash</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Overlay */}
        {phase === 'results' && lastResult && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#070913]/90 p-4">
            <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0d1326] p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
                <Trophy className="h-8 w-8" />
              </div>

              <h3 className="mt-3 font-display text-2xl font-bold text-white">Natijalar</h3>
              <p className="mt-1 text-sm text-slate-300">{lastResult.summaryLabel}</p>

              {/* Stars */}
              <div className="mt-4 flex justify-center gap-2">
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    className={`h-8 w-8 ${
                      s <= lastResult.stars
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-700'
                    }`}
                  />
                ))}
              </div>

              {/* Metrics */}
              <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-[#070913] p-4">
                <div>
                  <div className="text-xs text-slate-400">Ball</div>
                  <div className="font-mono-num text-2xl font-bold text-sky-400">
                    {lastResult.score}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Vaqt</div>
                  <div className="font-mono-num text-2xl font-bold text-white">
                    {lastResult.timeSeconds.toFixed(1)}s
                  </div>
                </div>
                {lastResult.extraStats?.map((st) => (
                  <div key={st.label}>
                    <div className="text-xs text-slate-400">{st.label}</div>
                    <div className="font-mono-num text-base font-semibold text-slate-200">
                      {st.value}
                    </div>
                  </div>
                ))}
              </div>

              {newAchievements.length > 0 && (
                <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
                  Yangi yutuq ochildi:{' '}
                  <strong>
                    {newAchievements
                      .map((id) => ACHIEVEMENTS.find((a) => a.id === id)?.title)
                      .filter(Boolean)
                      .join(', ')}
                  </strong>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={restartPlay}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 text-sm font-bold text-white hover:bg-sky-400"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Qayta o‘ynash</span>
                </button>
                <button
                  type="button"
                  onClick={onBackToLibrary}
                  className="flex-1 rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10"
                >
                  Boshqa o‘yinlar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
