export type AgeGroup = '3-5' | '6-9' | '10-15' | '16-20';

export type GameCategory =
  | 'poyga'
  | 'mashina'
  | '3d'
  | 'sarguzasht'
  | 'sport'
  | 'mantiqiy';

export type SidebarSection =
  | 'home'
  | 'all'
  | 'poyga'
  | 'mashina'
  | '3d'
  | 'sarguzasht'
  | 'sport'
  | 'mantiqiy'
  | 'favorites'
  | 'recent'
  | 'profile'
  | 'settings';

export type GraphicsQuality = 'auto' | 'high' | 'eco';

export type GameEngineType =
  | 'racing'
  | 'driving-open'
  | 'voxel'
  | 'city'
  | 'football'
  | 'kids-3d';

export interface GameDefinition {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  instructions: string;
  controlsHint: string;
  ageGroup: AgeGroup;
  category: GameCategory;
  categories: GameCategory[];
  rating: number;
  playsCount: number;
  isNew?: boolean;
  isTrending?: boolean;
  isRecommended?: boolean;
  isFeatured?: boolean;
  heroImage?: string;
  accentColor: string;
  secondaryColor: string;
  engineType: GameEngineType;
  mobileControlMode: 'racing' | 'dpad' | 'tap';
  variant: string;
}

export interface GameResult {
  score: number;
  timeSeconds: number;
  won: boolean;
  stars: number;
  summaryLabel: string;
  extraStats?: { label: string; value: string }[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  type: 'games_played' | 'favorites' | 'high_score' | 'playtime' | 'wins' | 'age_explorer';
}

export interface UserProfile {
  username: string;
  ageGroup: AgeGroup;
  createdAt: number;
  gamesPlayed: number;
  totalPlaytimeSeconds: number;
  totalWins: number;
  favorites: string[];
  recentlyPlayed: string[];
  highScores: Record<string, number>;
  playedGameIds: string[];
  unlockedAchievements: string[];
}

export interface AppSettings {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  graphicsQuality: GraphicsQuality;
}
