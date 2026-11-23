import React from 'react';
import { ArrowLeft, Heart, Keyboard, Star } from 'lucide-react';
import { AppSettings, GameDefinition, GameResult, UserProfile } from '../types';
import { CATEGORY_LABELS, GAMES_CATALOG } from '../data/games';
import { AGE_GROUP_LABELS } from '../data/achievements';
import { GameStage } from '../components/GameStage';
import { GameCard } from '../components/GameCard';
import { audioEngine } from '../utils/audio';

interface GameDetailsPageProps {
  game: GameDefinition;
  profile: UserProfile;
  settings: AppSettings;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onBack: () => void;
  onPlayGame: (gameId: string) => void;
  onToggleFavorite: (gameId: string) => void;
  onLaunch: (gameId: string) => void;
  onFinish: (gameId: string, result: GameResult) => string[];
}

export const GameDetailsPage: React.FC<GameDetailsPageProps> = ({
  game,
  profile,
  settings,
  onUpdateSettings,
  onBack,
  onPlayGame,
  onToggleFavorite,
  onLaunch,
  onFinish,
}) => {
  const isFav = profile.favorites.includes(game.id);
  const similarGames = GAMES_CATALOG.filter(
    (g) => g.id !== game.id && (g.category === game.category || g.ageGroup === game.ageGroup)
  ).slice(0, 4);

  return (
    <div className="space-y-8 pb-12">
      {/* Top Back & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              audioEngine.playClick();
              onBack();
            }}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#0d1326] px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-white/25 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Ortga</span>
          </button>

          <div>
            <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
              {game.title}
            </h1>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span>{CATEGORY_LABELS[game.category]}</span>
              <span aria-hidden="true">·</span>
              <span>{AGE_GROUP_LABELS[game.ageGroup]}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 text-amber-400">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span className="font-mono-num font-semibold">{game.rating.toFixed(1)}</span>
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            audioEngine.playClick();
            onToggleFavorite(game.id);
          }}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition-colors ${
            isFav
              ? 'border-rose-500/40 bg-rose-500/20 text-rose-300'
              : 'border-white/10 bg-[#0d1326] text-slate-300 hover:text-white'
          }`}
        >
          <Heart className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
          <span>{isFav ? 'Sevimlilarda' : 'Sevimlilarga qo‘shish'}</span>
        </button>
      </div>

      {/* Playable 3D Game Stage */}
      <GameStage
        game={game}
        settings={settings}
        bestScore={profile.highScores[game.id] || 0}
        onUpdateSettings={onUpdateSettings}
        onLaunch={onLaunch}
        onFinish={onFinish}
        onBackToLibrary={onBack}
      />

      {/* Game Info & Controls */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#0d1326] p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-bold text-white">O‘yin haqida</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{game.description}</p>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">{game.instructions}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0d1326] p-6">
          <div className="flex items-center gap-2 text-white">
            <Keyboard className="h-4 w-4 text-sky-400" />
            <h2 className="font-display text-lg font-bold">Boshqaruv</h2>
          </div>
          <p className="mt-2.5 text-sm leading-relaxed text-slate-300">{game.controlsHint}</p>
          <p className="mt-3 text-xs text-slate-400">
            Telefon va planshetlarda ekranning pastki qismida sensorli boshqaruv tugmalari avtomatik paydo bo‘ladi.
          </p>
        </div>
      </div>

      {/* Similar Games */}
      {similarGames.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-xl font-bold text-white">Shunga o‘xshash o‘yinlar</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {similarGames.map((sg) => (
              <GameCard
                key={sg.id}
                game={sg}
                isFavorite={profile.favorites.includes(sg.id)}
                highScore={profile.highScores[sg.id]}
                onPlay={onPlayGame}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
