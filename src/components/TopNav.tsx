import React from 'react';
import { Gamepad2, Menu, Search, Settings, User, Volume2, VolumeX } from 'lucide-react';
import { AgeGroup, AppSettings, SidebarSection, UserProfile } from '../types';
import { AGE_GROUP_LABELS } from '../data/achievements';
import { audioEngine } from '../utils/audio';

interface TopNavProps {
  profile: UserProfile;
  settings: AppSettings;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectSection: (section: SidebarSection) => void;
  onChangeAgeFilter: (age: AgeGroup) => void;
  onToggleSfx: () => void;
  onToggleMobileMenu: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  profile,
  settings,
  searchQuery,
  onSearchChange,
  onSelectSection,
  onChangeAgeFilter,
  onToggleSfx,
  onToggleMobileMenu,
}) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-white/10 bg-[#080c1a]/95 px-4 sm:px-6">
      {/* Left: Mobile Menu + Brand Wordmark */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          aria-label="Menyuni ochish"
          className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-200 hover:bg-white/10 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => {
            audioEngine.playClick();
            onSelectSection('home');
          }}
          className="flex shrink-0 items-center gap-2.5 whitespace-nowrap text-left"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white">
            <Gamepad2 className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-bold tracking-wider text-white sm:text-xl">
            ZENTRO GAMES
          </span>
        </button>
      </div>

      {/* Center: Search Bar */}
      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="O‘yinlarni qidirish..."
          className="w-full rounded-xl border border-white/10 bg-[#0d1326] py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none"
        />
      </div>

      {/* Right: Age Category, Sound, Profile, Settings */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
        <select
          aria-label="Yosh toifasi"
          value={profile.ageGroup}
          onChange={(e) => {
            audioEngine.playClick();
            onChangeAgeFilter(e.target.value as AgeGroup);
          }}
          className="hidden rounded-xl border border-white/10 bg-[#0d1326] px-3 py-2 text-xs font-semibold text-sky-300 focus:border-sky-400 focus:outline-none sm:block"
        >
          {(Object.keys(AGE_GROUP_LABELS) as AgeGroup[]).map((ag) => (
            <option key={ag} value={ag}>
              {AGE_GROUP_LABELS[ag]}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => {
            audioEngine.unlock();
            onToggleSfx();
          }}
          aria-label="Ovozni boshqarish"
          title="Ovoz"
          className="rounded-xl border border-white/10 bg-[#0d1326] p-2 text-slate-300 hover:border-white/20 hover:text-white"
        >
          {settings.sfxEnabled ? <Volume2 className="h-4 w-4 text-sky-400" /> : <VolumeX className="h-4 w-4" />}
        </button>

        <button
          type="button"
          onClick={() => {
            audioEngine.playClick();
            onSelectSection('profile');
          }}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0d1326] px-3 py-1.5 text-xs font-semibold text-white hover:border-sky-400/40"
        >
          <User className="h-4 w-4 text-sky-400" />
          <span className="max-w-24 truncate">{profile.username}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            audioEngine.playClick();
            onSelectSection('settings');
          }}
          aria-label="Sozlamalar"
          title="Sozlamalar"
          className="rounded-xl border border-white/10 bg-[#0d1326] p-2 text-slate-300 hover:border-white/20 hover:text-white"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
