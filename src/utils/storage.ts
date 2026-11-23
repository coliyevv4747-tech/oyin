import { ACHIEVEMENTS } from '../data/achievements';
import { AgeGroup, AppSettings, GameResult, UserProfile } from '../types';

const PROFILE_KEY = 'zentro_games_profile_v1';
const SETTINGS_KEY = 'zentro_games_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  musicEnabled: true,
  sfxEnabled: true,
  musicVolume: 0.35,
  sfxVolume: 0.6,
  graphicsQuality: 'auto',
};

export function createInitialProfile(username: string, ageGroup: AgeGroup): UserProfile {
  return {
    username: username.trim(),
    ageGroup,
    createdAt: Date.now(),
    gamesPlayed: 0,
    totalPlaytimeSeconds: 0,
    totalWins: 0,
    favorites: [],
    recentlyPlayed: [],
    highScores: {},
    playedGameIds: [],
    unlockedAchievements: [],
  };
}

export function loadProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserProfile;
    if (!parsed || !parsed.username || !parsed.ageGroup) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore quota errors
  }
}

export function clearProfileStorage(): void {
  try {
    localStorage.removeItem(PROFILE_KEY);
  } catch {
    // Ignore
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore
  }
}

export function evaluateAchievements(profile: UserProfile): string[] {
  const maxHighScore = Object.values(profile.highScores).reduce(
    (max, score) => Math.max(max, score),
    0
  );

  const unlocked = new Set(profile.unlockedAchievements);

  for (const ach of ACHIEVEMENTS) {
    if (unlocked.has(ach.id)) continue;
    let progress = 0;
    switch (ach.type) {
      case 'games_played':
        progress = profile.gamesPlayed;
        break;
      case 'wins':
        progress = profile.totalWins;
        break;
      case 'favorites':
        progress = profile.favorites.length;
        break;
      case 'age_explorer':
        progress = profile.playedGameIds.length;
        break;
      case 'high_score':
        progress = maxHighScore;
        break;
      case 'playtime':
        progress = profile.totalPlaytimeSeconds;
        break;
    }
    if (progress >= ach.target) {
      unlocked.add(ach.id);
    }
  }

  return Array.from(unlocked);
}

export function recordGameLaunch(profile: UserProfile, gameId: string): UserProfile {
  const recent = [gameId, ...profile.recentlyPlayed.filter((id) => id !== gameId)].slice(0, 12);
  const playedIds = profile.playedGameIds.includes(gameId)
    ? profile.playedGameIds
    : [...profile.playedGameIds, gameId];

  const updated: UserProfile = {
    ...profile,
    recentlyPlayed: recent,
    playedGameIds: playedIds,
  };
  updated.unlockedAchievements = evaluateAchievements(updated);
  saveProfile(updated);
  return updated;
}

export function recordGameCompletion(
  profile: UserProfile,
  gameId: string,
  result: GameResult
): { profile: UserProfile; newlyUnlocked: string[] } {
  const prevBest = profile.highScores[gameId] || 0;
  const newBest = Math.max(prevBest, Math.round(result.score));
  const prevUnlocked = new Set(profile.unlockedAchievements);

  const updated: UserProfile = {
    ...profile,
    gamesPlayed: profile.gamesPlayed + 1,
    totalPlaytimeSeconds: profile.totalPlaytimeSeconds + Math.max(1, Math.round(result.timeSeconds)),
    totalWins: profile.totalWins + (result.won ? 1 : 0),
    highScores: {
      ...profile.highScores,
      [gameId]: newBest,
    },
  };

  updated.unlockedAchievements = evaluateAchievements(updated);
  const newlyUnlocked = updated.unlockedAchievements.filter((id) => !prevUnlocked.has(id));
  saveProfile(updated);
  return { profile: updated, newlyUnlocked };
}

export function toggleFavoriteGame(profile: UserProfile, gameId: string): UserProfile {
  const exists = profile.favorites.includes(gameId);
  const favorites = exists
    ? profile.favorites.filter((id) => id !== gameId)
    : [gameId, ...profile.favorites];

  const updated: UserProfile = {
    ...profile,
    favorites,
  };
  updated.unlockedAchievements = evaluateAchievements(updated);
  saveProfile(updated);
  return updated;
}

export function formatPlaytimeUz(seconds: number): string {
  if (seconds < 60) return `${seconds} soniya`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins} daq ${secs} son`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs} soat ${remMins} daq`;
}
