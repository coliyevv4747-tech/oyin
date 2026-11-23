import React from 'react';
import {
  Box,
  Car,
  Clock,
  Compass,
  Flag,
  Heart,
  Home,
  LayoutGrid,
  Puzzle,
  Trophy,
  X,
} from 'lucide-react';
import { SidebarSection } from '../types';
import { audioEngine } from '../utils/audio';

interface SidebarProps {
  activeSection: SidebarSection;
  onSelect: (section: SidebarSection) => void;
  favoritesCount: number;
  recentCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: { id: SidebarSection; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'home', label: 'Bosh sahifa', icon: Home },
  { id: 'all', label: 'Barcha o‘yinlar', icon: LayoutGrid },
  { id: 'poyga', label: 'Poyga o‘yinlari', icon: Flag },
  { id: 'mashina', label: 'Mashina o‘yinlari', icon: Car },
  { id: '3d', label: '3D o‘yinlar', icon: Box },
  { id: 'sarguzasht', label: 'Sarguzasht', icon: Compass },
  { id: 'sport', label: 'Sport', icon: Trophy },
  { id: 'mantiqiy', label: 'Mantiqiy o‘yinlar', icon: Puzzle },
  { id: 'favorites', label: 'Sevimlilar', icon: Heart },
  { id: 'recent', label: 'Yaqinda o‘ynalganlar', icon: Clock },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelect,
  favoritesCount,
  recentCount,
  mobileOpen,
  onCloseMobile,
}) => {
  const renderNavContent = () => (
    <nav className="flex flex-col gap-1 p-3">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;
        const count =
          item.id === 'favorites'
            ? favoritesCount
            : item.id === 'recent'
            ? recentCount
            : null;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              audioEngine.playClick();
              onSelect(item.id);
              onCloseMobile();
            }}
            className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-colors whitespace-nowrap ${
              isActive
                ? 'bg-sky-500/15 text-sky-300'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
            }`}
          >
            <span className="flex items-center gap-3">
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
              <span>{item.label}</span>
            </span>
            {count !== null && count > 0 && (
              <span className="font-mono-num text-xs text-slate-500">{count}</span>
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-white/10 bg-[#080c1a] lg:block">
        <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto">
          {renderNavContent()}
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/70"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-50 flex w-72 flex-col border-r border-white/10 bg-[#080c1a]">
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
              <span className="font-display text-base font-bold text-white">Bo‘limlar</span>
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Yopish"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{renderNavContent()}</div>
          </aside>
        </div>
      )}
    </>
  );
};
