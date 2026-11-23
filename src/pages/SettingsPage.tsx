import React, { useState } from 'react';
import { Monitor, Music, Trash2, Volume2 } from 'lucide-react';
import { AgeGroup, AppSettings, GraphicsQuality, UserProfile } from '../types';
import { AGE_GROUP_LABELS } from '../data/achievements';
import { audioEngine } from '../utils/audio';

interface SettingsPageProps {
  profile: UserProfile;
  settings: AppSettings;
  onUpdateProfile: (patch: Partial<UserProfile>) => void;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onResetAll: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  profile,
  settings,
  onUpdateProfile,
  onUpdateSettings,
  onResetAll,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Sozlamalar</h1>

      {/* Audio Settings */}
      <section className="space-y-5 rounded-2xl border border-white/10 bg-[#0d1326] p-6">
        <h2 className="font-display text-lg font-bold text-white">Ovoz va musiqa</h2>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Music className="h-5 w-5 text-indigo-400" />
            <div>
              <div className="text-sm font-semibold text-white">Fon musiqasi</div>
              <div className="text-xs text-slate-400">Platforma va o‘yinlar uchun elektron musiqa</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              audioEngine.unlock();
              onUpdateSettings({ musicEnabled: !settings.musicEnabled });
            }}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
              settings.musicEnabled ? 'bg-sky-500 text-white' : 'bg-white/10 text-slate-400'
            }`}
          >
            {settings.musicEnabled ? 'Yoqilgan' : 'O‘chirilgan'}
          </button>
        </div>

        <div>
          <div className="mb-1.5 flex justify-between text-xs text-slate-400">
            <span>Musiqa balandligi</span>
            <span className="font-mono-num">{Math.round(settings.musicVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.musicVolume}
            onChange={(e) => onUpdateSettings({ musicVolume: Number(e.target.value) })}
            className="w-full accent-sky-500"
          />
        </div>

        <div className="border-t border-white/10 pt-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Volume2 className="h-5 w-5 text-sky-400" />
              <div>
                <div className="text-sm font-semibold text-white">O‘yin effektlari (SFX)</div>
                <div className="text-xs text-slate-400">Dvigatel ovozi, tugmalar va yutuq tovushlari</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                audioEngine.unlock();
                onUpdateSettings({ sfxEnabled: !settings.sfxEnabled });
              }}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                settings.sfxEnabled ? 'bg-sky-500 text-white' : 'bg-white/10 text-slate-400'
              }`}
            >
              {settings.sfxEnabled ? 'Yoqilgan' : 'O‘chirilgan'}
            </button>
          </div>

          <div className="mt-4">
            <div className="mb-1.5 flex justify-between text-xs text-slate-400">
              <span>Effektlar balandligi</span>
              <span className="font-mono-num">{Math.round(settings.sfxVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.sfxVolume}
              onChange={(e) => onUpdateSettings({ sfxVolume: Number(e.target.value) })}
              className="w-full accent-sky-500"
            />
          </div>
        </div>
      </section>

      {/* Graphics & Age Preferences */}
      <section className="space-y-5 rounded-2xl border border-white/10 bg-[#0d1326] p-6">
        <div className="flex items-center gap-2.5">
          <Monitor className="h-5 w-5 text-sky-400" />
          <h2 className="font-display text-lg font-bold text-white">3D Grafika va yosh toifasi</h2>
        </div>

        <div>
          <label className="mb-2 block text-xs text-slate-400">Grafika sifati</label>
          <div className="grid grid-cols-3 gap-2.5">
            {(
              [
                ['auto', 'Avtomatik'],
                ['high', 'Yuqori (60 FPS)'],
                ['eco', 'Tejamkor'],
              ] as [GraphicsQuality, string][]
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  audioEngine.playClick();
                  onUpdateSettings({ graphicsQuality: val });
                }}
                className={`rounded-xl border py-2.5 text-xs font-semibold transition-colors ${
                  settings.graphicsQuality === val
                    ? 'border-sky-400 bg-sky-500/20 text-white'
                    : 'border-white/10 bg-[#070913] text-slate-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs text-slate-400">Tanlangan yosh toifasi</label>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {(Object.keys(AGE_GROUP_LABELS) as AgeGroup[]).map((ag) => (
              <button
                key={ag}
                type="button"
                onClick={() => {
                  audioEngine.playClick();
                  onUpdateProfile({ ageGroup: ag });
                }}
                className={`rounded-xl border py-2.5 text-xs font-semibold transition-colors ${
                  profile.ageGroup === ag
                    ? 'border-sky-400 bg-sky-500/20 text-white'
                    : 'border-white/10 bg-[#070913] text-slate-400 hover:text-white'
                }`}
              >
                {AGE_GROUP_LABELS[ag]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Reset Account */}
      <section className="rounded-2xl border border-rose-500/20 bg-[#0d1326] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-white">Profilni qayta boshlash</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Barcha natijalar, sevimlilar va yosh sozlamalarini o‘chirib, boshidan boshlash
            </p>
          </div>

          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/15 px-4 py-2.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/25"
            >
              <Trash2 className="h-4 w-4" />
              <span>Ma‘lumotlarni tozalash</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onResetAll}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500"
              >
                Tasdiqlash
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300"
              >
                Bekor qilish
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
