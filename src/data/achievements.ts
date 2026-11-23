import { Achievement, AgeGroup } from '../types';

export const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  '3-5': '3–5 yosh',
  '6-9': '6–9 yosh',
  '10-15': '10–15 yosh',
  '16-20': '16–20 yosh',
};

export const AGE_GROUP_DESCRIPTIONS: Record<AgeGroup, string> = {
  '3-5': 'Rangli, quvnoq va xavfsiz bolalar dunyosi',
  '6-9': 'Sarguzashtlar, dinozavrlar va blokli qurilish',
  '10-15': 'Ko‘cha poygalari, futbol va ochiq dunyo',
  '16-20': 'Realistik fizika, drift va professional poygalar',
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_game',
    title: 'Birinchi qadam',
    description: 'ZENTRO GAMES platformasida ilk o‘yinni yakunlang',
    icon: 'trophy',
    target: 1,
    type: 'games_played',
  },
  {
    id: 'five_games',
    title: 'Faol o‘yinchi',
    description: '5 ta o‘yin sessiyasini yakunlang',
    icon: 'gamepad',
    target: 5,
    type: 'games_played',
  },
  {
    id: 'winner_3',
    title: 'G‘oliblar safida',
    description: '3 ta o‘yinda g‘alaba qozoning',
    icon: 'crown',
    target: 3,
    type: 'wins',
  },
  {
    id: 'collector_3',
    title: 'Kolleksioner',
    description: '3 ta o‘yinni sevimlilar ro‘yxatiga qo‘shing',
    icon: 'heart',
    target: 3,
    type: 'favorites',
  },
  {
    id: 'explorer_5',
    title: 'Keng dunyo',
    description: '5 xil o‘yinni sinab ko‘ring',
    icon: 'compass',
    target: 5,
    type: 'age_explorer',
  },
  {
    id: 'high_scorer',
    title: 'Rekordchi',
    description: 'Istalgan o‘yinda kamida 500 ball to‘plang',
    icon: 'zap',
    target: 500,
    type: 'high_score',
  },
  {
    id: 'time_player',
    title: 'Tajribali o‘yinchi',
    description: 'Umumiy 5 daqiqa davomida o‘ynang',
    icon: 'clock',
    target: 300,
    type: 'playtime',
  },
  {
    id: 'zentro_legend',
    title: 'ZENTRO Afsonasi',
    description: '10 ta o‘yinda g‘alaba qozoning',
    icon: 'star',
    target: 10,
    type: 'wins',
  },
];
