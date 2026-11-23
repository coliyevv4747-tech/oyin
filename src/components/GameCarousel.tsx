import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { GameDefinition } from '../types';
import { GameCard } from './GameCard';

interface GameCarouselProps {
  title: string;
  subtitle?: string;
  games: GameDefinition[];
  favorites: string[];
  highScores: Record<string, number>;
  onPlay: (gameId: string) => void;
  onToggleFavorite: (gameId: string) => void;
  onViewAll?: () => void;
}

export const GameCarousel: React.FC<GameCarouselProps> = ({
  title,
  subtitle,
  games,
  favorites,
  highScores,
  onPlay,
  onToggleFavorite,
  onViewAll,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (games.length === 0) return null;

  const scrollByAmount = (dir: -1 | 1) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 640, behavior: 'smooth' });
  };

  return (
    <section className="space-y-3.5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-white sm:text-2xl">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-slate-400 sm:text-sm">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="mr-1 text-xs font-semibold text-sky-400 hover:text-sky-300 whitespace-nowrap"
            >
              Barchasi
            </button>
          )}
          <button
            type="button"
            onClick={() => scrollByAmount(-1)}
            aria-label="Oldingi o'yinlar"
            className="hidden h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#0d1326] text-slate-300 hover:border-white/25 hover:text-white sm:flex"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollByAmount(1)}
            aria-label="Keyingi o'yinlar"
            className="hidden h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#0d1326] text-slate-300 hover:border-white/25 hover:text-white sm:flex"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="no-scrollbar flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory"
      >
        {games.map((g) => (
          <div key={g.id} className="w-64 shrink-0 snap-start sm:w-72">
            <GameCard
              game={g}
              isFavorite={favorites.includes(g.id)}
              highScore={highScores[g.id]}
              onPlay={onPlay}
              onToggleFavorite={onToggleFavorite}
            />
          </div>
        ))}
      </div>
    </section>
  );
};
