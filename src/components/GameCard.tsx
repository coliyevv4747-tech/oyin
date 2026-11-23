import React from 'react';
import { Heart, Play, Star } from 'lucide-react';
import { GameDefinition } from '../types';
import { CATEGORY_LABELS } from '../data/games';
import { AGE_GROUP_LABELS } from '../data/achievements';
import { GameThumbnailArt } from './GameThumbnailArt';
import { audioEngine } from '../utils/audio';

interface GameCardProps {
  game: GameDefinition;
  isFavorite: boolean;
  highScore?: number;
  onPlay: (gameId: string) => void;
  onToggleFavorite: (gameId: string) => void;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  isFavorite,
  highScore,
  onPlay,
  onToggleFavorite,
}) => {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d1326] transition-all duration-200 hover:-translate-y-1 hover:border-sky-400/40">
      {/* Thumbnail */}
      <div
        onClick={() => {
          audioEngine.playClick();
          onPlay(game.id);
        }}
        className="relative aspect-[16/10] w-full cursor-pointer overflow-hidden"
      >
        <GameThumbnailArt game={game} className="h-full w-full" />

        {/* Hover Play Overlay */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#070913]/45 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <span className="flex items-center gap-1.5 rounded-xl bg-sky-500 px-4 py-2 font-display text-xs font-bold text-white shadow-lg">
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>O‘ynash</span>
          </span>
        </div>

        {/* Favorite Button */}
        <button
          type="button"
          aria-label={isFavorite ? 'Sevimlilardan olish' : 'Sevimlilarga qo‘shish'}
          onClick={(e) => {
            e.stopPropagation();
            audioEngine.playClick();
            onToggleFavorite(game.id);
          }}
          className={`absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
            isFavorite
              ? 'border-rose-400/50 bg-rose-500/25 text-rose-400'
              : 'border-white/15 bg-[#070913]/75 text-slate-300 hover:text-white'
          }`}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Card Body - Zero Pill Metadata */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <h3
            onClick={() => {
              audioEngine.playClick();
              onPlay(game.id);
            }}
            className="cursor-pointer truncate font-display text-base font-bold text-white group-hover:text-sky-300"
          >
            {game.title}
          </h3>
          <div className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-400">
            <span>{CATEGORY_LABELS[game.category]}</span>
            <span aria-hidden="true">·</span>
            <span>{AGE_GROUP_LABELS[game.ageGroup]}</span>
          </div>
        </div>

        <div className="mt-3.5 flex items-center justify-between border-t border-white/5 pt-3">
          <div className="flex items-center gap-1.5 text-xs">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-mono-num font-semibold text-slate-200">
              {game.rating.toFixed(1)}
            </span>
            {highScore ? (
              <>
                <span className="text-slate-600">·</span>
                <span className="font-mono-num text-sky-400">{highScore}</span>
              </>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => {
              audioEngine.playClick();
              onPlay(game.id);
            }}
            className="rounded-lg bg-white/8 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-sky-500 whitespace-nowrap"
          >
            O‘ynash
          </button>
        </div>
      </div>
    </article>
  );
};
