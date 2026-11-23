import React, { useState } from 'react';
import { Award, Check, Clock, Crown, Edit3, Gamepad2, Heart, Star, Trophy, Zap } from 'lucide-react';
import { AgeGroup, UserProfile } from '../types';
import { ACHIEVEMENTS, AGE_GROUP_LABELS } from '../data/achievements';
import { GAMES_CATALOG } from '../data/games';
import { formatPlaytimeUz } from '../utils/storage';
import { GameCard } from '../components/GameCard';
import { audioEngine } from '../utils/audio';

interface ProfilePageProps {
  profile: UserProfile;
  onUpdateProfile: (patch: Partial<UserProfile>) => void;
  onPlayGame: (gameId: string) => void;
  onToggleFavorite: (gameId: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  profile,
  onUpdateProfile,
  onPlayGame,
  onToggleFavorite,
}) => {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(profile.username);
  const [draftAge, setDraftAge] = useState<AgeGroup>(profile.ageGroup);

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = draftName.trim();
    if (trimmed.length < 2) return;
    audioEngine.playClick();
    onUpdateProfile({ username: trimmed, ageGroup: draftAge });
    setEditing(false);
  };

  const favoriteGames = GAMES_CATALOG.filter((g) => profile.favorites.includes(g.id));
  const topScores = Object.entries(profile.highScores)
    .map(([id, score]) => ({
      game: GAMES_CATALOG.find((g) => g.id === id),
      score,
    }))
    .filter((entry): entry is { game: NonNullable<typeof entry.game>; score: number } => Boolean(entry.game))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-8 pb-12">
      {/* Profile Hero Card */}
      <section className="rounded-3xl border border-white/10 bg-[#0d1326] p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 font-display text-2xl font-bold text-white">
              {profile.username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
                {profile.username}
              </h1>
              <p className="mt-0.5 text-sm text-sky-400">
                Yosh toifasi: {AGE_GROUP_LABELS[profile.ageGroup]}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setDraftName(profile.username);
              setDraftAge(profile.ageGroup);
              setEditing((v) => !v);
            }}
            className="flex items-center gap-2 self-start rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/10"
          >
            <Edit3 className="h-4 w-4" />
            <span>Profilni tahrirlash</span>
          </button>
        </div>

        {editing && (
          <form onSubmit={saveEdit} className="mt-6 grid grid-cols-1 gap-4 border-t border-white/10 pt-5 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs text-slate-400">Ismingiz</label>
              <input
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#070913] px-3.5 py-2.5 text-sm text-white focus:border-sky-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-slate-400">Yosh toifasi</label>
              <select
                value={draftAge}
                onChange={(e) => setDraftAge(e.target.value as AgeGroup)}
                className="w-full rounded-xl border border-white/15 bg-[#070913] px-3.5 py-2.5 text-sm text-white focus:border-sky-400 focus:outline-none"
              >
                {(Object.keys(AGE_GROUP_LABELS) as AgeGroup[]).map((ag) => (
                  <option key={ag} value={ag}>
                    {AGE_GROUP_LABELS[ag]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-2.5 text-sm font-bold text-white hover:bg-sky-400"
              >
                <Check className="h-4 w-4" />
                <span>Saqlash</span>
              </button>
            </div>
          </form>
        )}

        {/* Stats Strip */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-6 sm:grid-cols-4">
          <div className="rounded-xl bg-[#070913] p-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Gamepad2 className="h-4 w-4 text-sky-400" />
              <span>O‘ynalgan o‘yinlar</span>
            </div>
            <div className="mt-1 font-mono-num text-2xl font-bold text-white">
              {profile.gamesPlayed}
            </div>
          </div>
          <div className="rounded-xl bg-[#070913] p-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="h-4 w-4 text-indigo-400" />
              <span>Umumiy vaqt</span>
            </div>
            <div className="mt-1 font-mono-num text-xl font-bold text-white">
              {formatPlaytimeUz(profile.totalPlaytimeSeconds)}
            </div>
          </div>
          <div className="rounded-xl bg-[#070913] p-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Trophy className="h-4 w-4 text-amber-400" />
              <span>G‘alabalar</span>
            </div>
            <div className="mt-1 font-mono-num text-2xl font-bold text-white">
              {profile.totalWins}
            </div>
          </div>
          <div className="rounded-xl bg-[#070913] p-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Heart className="h-4 w-4 text-rose-400" />
              <span>Sevimlilar</span>
            </div>
            <div className="mt-1 font-mono-num text-2xl font-bold text-white">
              {profile.favorites.length}
            </div>
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl font-bold text-white">Yutuqlar va nishonlar</h2>
          <span className="font-mono-num text-xs text-slate-400">
            {profile.unlockedAchievements.length} / {ACHIEVEMENTS.length} ochilgan
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ACHIEVEMENTS.map((ach) => {
            const unlocked = profile.unlockedAchievements.includes(ach.id);
            return (
              <div
                key={ach.id}
                className={`rounded-2xl border p-4 transition-colors ${
                  unlocked
                    ? 'border-amber-400/40 bg-amber-500/10'
                    : 'border-white/10 bg-[#0d1326] opacity-65'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      unlocked ? 'bg-amber-400 text-slate-950' : 'bg-white/5 text-slate-500'
                    }`}
                  >
                    {ach.icon === 'crown' ? (
                      <Crown className="h-5 w-5" />
                    ) : ach.icon === 'zap' ? (
                      <Zap className="h-5 w-5" />
                    ) : ach.icon === 'star' ? (
                      <Star className="h-5 w-5" />
                    ) : (
                      <Award className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-white">{ach.title}</h3>
                    <p className="text-xs text-slate-400">
                      {unlocked ? 'Ochilgan' : 'Qulflangan'}
                    </p>
                  </div>
                </div>
                <p className="mt-2.5 text-xs leading-relaxed text-slate-300">{ach.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* High Scores */}
      {topScores.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-xl font-bold text-white">Eng yuqori natijalar</h2>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1326]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 text-xs text-slate-400">
                <tr>
                  <th className="px-5 py-3">O‘yin nomi</th>
                  <th className="px-5 py-3 text-right">Rekord ball</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {topScores.map(({ game, score }) => (
                  <tr
                    key={game.id}
                    onClick={() => onPlayGame(game.id)}
                    className="cursor-pointer hover:bg-white/5"
                  >
                    <td className="px-5 py-3 font-medium text-white">{game.title}</td>
                    <td className="px-5 py-3 text-right font-mono-num font-bold text-sky-400">
                      {score}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Favorite Games */}
      {favoriteGames.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-xl font-bold text-white">Sevimli o‘yinlar</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {favoriteGames.map((fg) => (
              <GameCard
                key={fg.id}
                game={fg}
                isFavorite
                highScore={profile.highScores[fg.id]}
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
