import React, { useEffect, useState } from 'react';
import { AgeGroup, AppSettings, GameResult, SidebarSection, UserProfile } from './types';
import { GAMES_CATALOG } from './data/games';
import {
  clearProfileStorage,
  createInitialProfile,
  loadProfile,
  loadSettings,
  recordGameCompletion,
  recordGameLaunch,
  saveProfile,
  saveSettings,
  toggleFavoriteGame,
} from './utils/storage';
import { audioEngine } from './utils/audio';
import { WelcomeModal } from './components/WelcomeModal';
import { TopNav } from './components/TopNav';
import { Sidebar } from './components/Sidebar';
import { HomePage } from './pages/HomePage';
import { LibraryPage } from './pages/LibraryPage';
import { GameDetailsPage } from './pages/GameDetailsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(() => loadProfile());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [activeSection, setActiveSection] = useState<SidebarSection>('home');
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    audioEngine.configure(settings);
    saveSettings(settings);
  }, [settings]);

  const handleCompleteOnboarding = (username: string, ageGroup: AgeGroup) => {
    const newProfile = createInitialProfile(username, ageGroup);
    saveProfile(newProfile);
    setProfile(newProfile);
    setActiveSection('home');
    setActiveGameId(null);
  };

  const handleUpdateProfile = (patch: Partial<UserProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...patch };
    saveProfile(updated);
    setProfile(updated);
  };

  const handleUpdateSettings = (patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  const handlePlayGame = (gameId: string) => {
    setActiveGameId(gameId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectSection = (section: SidebarSection) => {
    setActiveGameId(null);
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (q.trim() && (activeGameId || activeSection === 'home' || activeSection === 'profile' || activeSection === 'settings')) {
      setActiveGameId(null);
      setActiveSection('all');
    }
  };

  const handleToggleFavorite = (gameId: string) => {
    if (!profile) return;
    setProfile(toggleFavoriteGame(profile, gameId));
  };

  const handleLaunchGame = (gameId: string) => {
    if (!profile) return;
    setProfile(recordGameLaunch(profile, gameId));
  };

  const handleFinishGame = (gameId: string, result: GameResult): string[] => {
    if (!profile) return [];
    const { profile: updated, newlyUnlocked } = recordGameCompletion(profile, gameId, result);
    setProfile(updated);
    return newlyUnlocked;
  };

  const handleResetAll = () => {
    clearProfileStorage();
    setProfile(null);
    setActiveGameId(null);
    setActiveSection('home');
  };

  if (!profile) {
    return <WelcomeModal onComplete={handleCompleteOnboarding} />;
  }

  const activeGame = activeGameId ? GAMES_CATALOG.find((g) => g.id === activeGameId) || null : null;

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100">
      <TopNav
        profile={profile}
        settings={settings}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSelectSection={handleSelectSection}
        onChangeAgeFilter={(ageGroup) => handleUpdateProfile({ ageGroup })}
        onToggleSfx={() => handleUpdateSettings({ sfxEnabled: !settings.sfxEnabled })}
        onToggleMobileMenu={() => setMobileMenuOpen((v) => !v)}
      />

      <div className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar
          activeSection={activeGame ? 'all' : activeSection}
          onSelect={handleSelectSection}
          favoritesCount={profile.favorites.length}
          recentCount={profile.recentlyPlayed.length}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        <main className="min-w-0 flex-1 px-4 pt-6 sm:px-8">
          {activeGame ? (
            <GameDetailsPage
              game={activeGame}
              profile={profile}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onBack={() => setActiveGameId(null)}
              onPlayGame={handlePlayGame}
              onToggleFavorite={handleToggleFavorite}
              onLaunch={handleLaunchGame}
              onFinish={handleFinishGame}
            />
          ) : activeSection === 'home' ? (
            <HomePage
              profile={profile}
              onPlayGame={handlePlayGame}
              onToggleFavorite={handleToggleFavorite}
              onNavigate={handleSelectSection}
            />
          ) : activeSection === 'profile' ? (
            <ProfilePage
              profile={profile}
              onUpdateProfile={handleUpdateProfile}
              onPlayGame={handlePlayGame}
              onToggleFavorite={handleToggleFavorite}
            />
          ) : activeSection === 'settings' ? (
            <SettingsPage
              profile={profile}
              settings={settings}
              onUpdateProfile={handleUpdateProfile}
              onUpdateSettings={handleUpdateSettings}
              onResetAll={handleResetAll}
            />
          ) : (
            <LibraryPage
              section={activeSection}
              profile={profile}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              onPlayGame={handlePlayGame}
              onToggleFavorite={handleToggleFavorite}
            />
          )}
        </main>
      </div>
    </div>
  );
}
