import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Star } from 'lucide-react';
import { GameDefinition, SidebarSection, UserProfile } from '../types';
import { GAMES_CATALOG, CATEGORY_LABELS } from '../data/games';
import { AGE_GROUP_LABELS } from '../data/achievements';
import { GameCarousel } from '../components/GameCarousel';
import { GameThumbnailArt } from '../components/GameThumbnailArt';
import { audioEngine } from '../utils/audio';

interface HomePageProps {
  profile: UserProfile;
  onPlayGame: (gameId: string) => void;
  onToggleFavorite: (gameId: string) => void;
  onNavigate: (section: SidebarSection) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  profile,
  onPlayGame,
  onToggleFavorite,
  onNavigate,
}) => {
  const featuredGames = GAMES_CATALOG.filter((g) => g.isFeatured);
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSlideIdx((i) => (i + 1) % featuredGames.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [featuredGames.length]);

  const activeHero: GameDefinition = featuredGames[slideIdx] || GAMES_CATALOG[0];

  const ageGames = GAMES_CATALOG.filter((g) => g.ageGroup === profile.ageGroup);
  const trendingGames = GAMES_CATALOG.filter((g) => g.isTrending);
  const recommendedGames = GAMES_CATALOG.filter((g) => g.isRecommended);
  const newGames = GAMES_CATALOG.filter((g) => g.isNew);
  const racingGames = GAMES_CATALOG.filter((g) => g.categories.includes('poyga'));
  const games3D = GAMES_CATALOG.filter((g) => g.categories.includes('3d'));

  return (
    <div className="space-y-10 pb-12">
      {/* Featured Hero Carousel */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0c1224]">
        <div className="grid min-h-[340px] grid-cols-1 items-stretch lg:min-h-[400px] lg:grid-cols-12">
          {/* Left Copy */}
          <div className="relative z-10 flex flex-col justify-between p-6 sm:p-9 lg:col-span-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-sky-400">
                <span>Tanlangan 3D o‘yin</span>
                <span aria-hidden="true">·</span>
                <span>{CATEGORY_LABELS[activeHero.category]}</span>
                <span aria-hidden="true">·</span>
                <span>{AGE_GROUP_LABELS[activeHero.ageGroup]}</span>
              </div>

              <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
                {activeHero.title}
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
                {activeHero.description}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  audioEngine.playClick();
                  onPlayGame(activeHero.id);
                }}
                className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-6 py-3.5 font-display text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition-transform hover:scale-[1.02] active:scale-95"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Hoziroq o‘ynash</span>
              </button>

              <div className="flex items-center gap-1.5 text-sm text-slate-300">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-mono-num font-bold text-white">
                  {activeHero.rating.toFixed(1)}
                </span>
                <span className="text-slate-500">·</span>
                <span className="font-mono-num text-xs text-slate-400">
                  {activeHero.playsCount.toLocaleString()} marta o‘ynalgan
                </span>
              </div>
            </div>
          </div>

          {/* Right Key Art */}
          <div className="relative min-h-[220px] lg:col-span-6">
            <GameThumbnailArt game={activeHero} className="h-full w-full" />
            <div
              className="pointer-events-none absolute inset-0 hidden lg:block"
              style={{
                background: 'linear-gradient(90deg, #0c1224 0%, rgba(12,18,36,0.35) 35%, transparent 100%)',
              }}
            />
          </div>
        </div>

        {/* Carousel Slide Controls */}
        <div className="absolute bottom-4 right-5 z-20 flex items-center gap-2">
          <div className="mr-2 flex items-center gap-1.5">
            {featuredGames.map((fg, i) => (
              <button
                key={fg.id}
                type="button"
                aria-label={`${i + 1}-slayd`}
                onClick={() => setSlideIdx(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === slideIdx ? 'w-6 bg-sky-400' : 'w-2 bg-white/30 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label="Oldingi slayd"
            onClick={() => setSlideIdx((i) => (i - 1 + featuredGames.length) % featuredGames.length)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-[#070913]/80 text-white hover:bg-white/15"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Keyingi slayd"
            onClick={() => setSlideIdx((i) => (i + 1) % featuredGames.length)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-[#070913]/80 text-white hover:bg-white/15"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Age-matched Curated Row */}
      <GameCarousel
        title={`Sizning yoshingiz uchun (${AGE_GROUP_LABELS[profile.ageGroup]})`}
        subtitle={`${profile.username} uchun maxsus tanlangan xavfsiz va qiziqarli o‘yinlar`}
        games={ageGames}
        favorites={profile.favorites}
        highScores={profile.highScores}
        onPlay={onPlayGame}
        onToggleFavorite={onToggleFavorite}
        onViewAll={() => onNavigate('all')}
      />

      <GameCarousel
        title="Ommabop o‘yinlar"
        subtitle="O‘yinchilar orasida eng ko‘p tanlanayotgan xitlar"
        games={trendingGames}
        favorites={profile.favorites}
        highScores={profile.highScores}
        onPlay={onPlayGame}
        onToggleFavorite={onToggleFavorite}
        onViewAll={() => onNavigate('all')}
      />

      <GameCarousel
        title="Tavsiya etilganlar"
        games={recommendedGames}
        favorites={profile.favorites}
        highScores={profile.highScores}
        onPlay={onPlayGame}
        onToggleFavorite={onToggleFavorite}
      />

      <GameCarousel
        title="Yangi o‘yinlar"
        games={newGames}
        favorites={profile.favorites}
        highScores={profile.highScores}
        onPlay={onPlayGame}
        onToggleFavorite={onToggleFavorite}
      />

      <GameCarousel
        title="Mashhur poyga o‘yinlari"
        games={racingGames}
        favorites={profile.favorites}
        highScores={profile.highScores}
        onPlay={onPlayGame}
        onToggleFavorite={onToggleFavorite}
        onViewAll={() => onNavigate('poyga')}
      />

      <GameCarousel
        title="Ommabop 3D o‘yinlar"
        games={games3D}
        favorites={profile.favorites}
        highScores={profile.highScores}
        onPlay={onPlayGame}
        onToggleFavorite={onToggleFavorite}
        onViewAll={() => onNavigate('3d')}
      />
    </div>
  );
};
