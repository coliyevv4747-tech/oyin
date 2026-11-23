import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { AgeGroup, GameCategory, SidebarSection, UserProfile } from '../types';
import { CATEGORY_LABELS, GAMES_CATALOG } from '../data/games';
import { AGE_GROUP_LABELS } from '../data/achievements';
import { GameCard } from '../components/GameCard';

interface LibraryPageProps {
  section: SidebarSection;
  profile: UserProfile;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onPlayGame: (gameId: string) => void;
  onToggleFavorite: (gameId: string) => void;
}

type SortOption = 'popular' | 'newest' | 'rating';

const SECTION_TITLES: Record<string, string> = {
  all: 'Barcha o‘yinlar',
  poyga: 'Poyga o‘yinlari',
  mashina: 'Mashina o‘yinlari',
  '3d': '3D o‘yinlar',
  sarguzasht: 'Sarguzasht o‘yinlari',
  sport: 'Sport o‘yinlari',
  mantiqiy: 'Mantiqiy o‘yinlar',
  favorites: 'Sevimli o‘yinlar',
  recent: 'Yaqinda o‘ynalganlar',
};

export const LibraryPage: React.FC<LibraryPageProps> = ({
  section,
  profile,
  searchQuery,
  onSearchChange,
  onPlayGame,
  onToggleFavorite,
}) => {
  const [ageFilter, setAgeFilter] = useState<AgeGroup | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('popular');

  const filteredGames = useMemo(() => {
    let list = [...GAMES_CATALOG];

    // Section filter
    if (section === 'favorites') {
      list = list.filter((g) => profile.favorites.includes(g.id));
    } else if (section === 'recent') {
      list = profile.recentlyPlayed
        .map((id) => GAMES_CATALOG.find((g) => g.id === id))
        .filter((g): g is NonNullable<typeof g> => Boolean(g));
    } else if (section !== 'all' && section !== 'home') {
      list = list.filter((g) => g.categories.includes(section as GameCategory));
    }

    // Age filter
    if (ageFilter !== 'all') {
      list = list.filter((g) => g.ageGroup === ageFilter);
    }

    // Search filter
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          CATEGORY_LABELS[g.category].toLowerCase().includes(q)
      );
    }

    // Sorting (preserve recent order if viewing recent without search)
    if (section !== 'recent' || q) {
      if (sortBy === 'popular') {
        list.sort((a, b) => b.playsCount - a.playsCount);
      } else if (sortBy === 'newest') {
        list.sort((a, b) => Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)));
      } else if (sortBy === 'rating') {
        list.sort((a, b) => b.rating - a.rating);
      }
    }

    return list;
  }, [section, profile.favorites, profile.recentlyPlayed, ageFilter, searchQuery, sortBy]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
            {SECTION_TITLES[section] || 'O‘yinlar kutubxonasi'}
          </h1>
          <span className="font-mono-num text-xs text-slate-400">
            {filteredGames.length} ta o‘yin topildi
          </span>
        </div>

        {/* Mobile search */}
        <div className="relative md:hidden">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="O‘yinlarni qidirish..."
            className="w-full rounded-xl border border-white/10 bg-[#0d1326] py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none"
          />
        </div>

        {/* Filters & Sort */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-[#0d1326] p-1">
            <button
              type="button"
              onClick={() => setAgeFilter('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                ageFilter === 'all' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Barcha yoshlar
            </button>
            {(Object.keys(AGE_GROUP_LABELS) as AgeGroup[]).map((ag) => (
              <button
                key={ag}
                type="button"
                onClick={() => setAgeFilter(ag)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  ageFilter === ag ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {AGE_GROUP_LABELS[ag]}
              </button>
            ))}
          </div>

          <select
            aria-label="Saralash"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-xl border border-white/10 bg-[#0d1326] px-3.5 py-2 text-xs font-semibold text-slate-200 focus:border-sky-400 focus:outline-none"
          >
            <option value="popular">Ommabopligi bo‘yicha</option>
            <option value="newest">Eng yangilari</option>
            <option value="rating">Reyting bo‘yicha</option>
          </select>
        </div>
      </div>

      {/* Results Grid */}
      {filteredGames.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#0d1326] py-16 text-center">
          <p className="font-display text-lg font-bold text-white">O‘yinlar topilmadi</p>
          <p className="mt-1 text-sm text-slate-400">
            {section === 'favorites'
              ? 'Siz hali sevimli o‘yinlarni belgilamagansiz.'
              : section === 'recent'
              ? 'Siz hali birorta o‘yin o‘ynamagansiz.'
              : 'Qidiruv so‘zini yoki yosh filtrini o‘zgartirib ko‘ring.'}
          </p>
          {(ageFilter !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setAgeFilter('all');
                onSearchChange('');
              }}
              className="mt-4 rounded-xl bg-sky-500 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-400"
            >
              Filtrlarni tozalash
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredGames.map((g) => (
            <GameCard
              key={g.id}
              game={g}
              isFavorite={profile.favorites.includes(g.id)}
              highScore={profile.highScores[g.id]}
              onPlay={onPlayGame}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
};
