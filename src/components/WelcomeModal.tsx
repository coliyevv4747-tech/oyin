import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, CheckCircle2, Gamepad2, Sparkles } from 'lucide-react';
import { AgeGroup } from '../types';
import { AGE_GROUP_DESCRIPTIONS, AGE_GROUP_LABELS } from '../data/achievements';
import { audioEngine } from '../utils/audio';

interface WelcomeModalProps {
  onComplete: (username: string, ageGroup: AgeGroup) => void;
}

const AGE_CARDS: {
  id: AgeGroup;
  title: string;
  desc: string;
  image?: string;
  gradient: string;
  accent: string;
}[] = [
  {
    id: '3-5',
    title: AGE_GROUP_LABELS['3-5'],
    desc: AGE_GROUP_DESCRIPTIONS['3-5'],
    image: '/src/assets/images/age_card_3_5_1795407680122.jpg',
    gradient: 'from-rose-500/25 via-amber-500/15 to-[#0d1326]',
    accent: '#fb7185',
  },
  {
    id: '6-9',
    title: AGE_GROUP_LABELS['6-9'],
    desc: AGE_GROUP_DESCRIPTIONS['6-9'],
    image: '/src/assets/images/hero_voxel_adventure_1795407680296.jpg',
    gradient: 'from-emerald-500/25 via-sky-500/15 to-[#0d1326]',
    accent: '#34d399',
  },
  {
    id: '10-15',
    title: AGE_GROUP_LABELS['10-15'],
    desc: AGE_GROUP_DESCRIPTIONS['10-15'],
    image: '/src/assets/images/age_card_10_15_1795407681281.jpg',
    gradient: 'from-sky-500/25 via-indigo-500/15 to-[#0d1326]',
    accent: '#38bdf8',
  },
  {
    id: '16-20',
    title: AGE_GROUP_LABELS['16-20'],
    desc: AGE_GROUP_DESCRIPTIONS['16-20'],
    image: '/src/assets/images/hero_formula_pro_1795407680037.jpg',
    gradient: 'from-indigo-500/25 via-purple-500/15 to-[#0d1326]',
    accent: '#818cf8',
  },
];

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'age' | 'name' | 'welcome'>('age');
  const [selectedAge, setSelectedAge] = useState<AgeGroup | null>(null);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSelectAge = (age: AgeGroup) => {
    audioEngine.unlock();
    audioEngine.playClick();
    setSelectedAge(age);
    setStep('name');
  };

  const handleSubmitName = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (trimmed.length < 2) {
      setError('Iltimos, kamida 2 ta harfdan iborat ism kiriting.');
      return;
    }
    if (trimmed.length > 24) {
      setError('Ism 24 ta belgidan oshmasligi kerak.');
      return;
    }
    setError('');
    audioEngine.playCollect();
    setStep('welcome');

    window.setTimeout(() => {
      if (selectedAge) {
        onComplete(trimmed, selectedAge);
      }
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#050711] p-4 sm:p-8">
      {/* Subtle Ambient Background */}
      <div
        className="pointer-events-none fixed inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(circle at 20% 20%, rgba(56,189,248,0.18), transparent 45%), radial-gradient(circle at 80% 80%, rgba(99,102,241,0.2), transparent 45%)',
        }}
      />

      <div className="relative z-10 w-full max-w-5xl">
        {/* Brand Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20">
              <Gamepad2 className="h-6 w-6" />
            </div>
            <span className="font-display text-2xl font-bold tracking-wider text-white sm:text-3xl">
              ZENTRO GAMES
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Premium 3D Onlayn O‘yin Platformasi
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'age' && (
            <motion.div
              key="step-age"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mb-6 text-center">
                <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
                  1-qadam: Yoshingizni tanlang
                </h1>
                <p className="mt-1.5 text-sm text-slate-400">
                  Sizning yoshingizga mos xavfsiz va qiziqarli 3D o‘yinlarni tavsiya qilamiz
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {AGE_CARDS.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => handleSelectAge(card.id)}
                    className={`group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b ${card.gradient} text-left transition-all duration-200 hover:-translate-y-1.5 hover:border-sky-400/50 hover:shadow-xl hover:shadow-sky-500/10 focus-visible:outline-2 focus-visible:outline-sky-400`}
                  >
                    <div className="relative h-40 w-full overflow-hidden bg-[#0a0f1e]">
                      {card.image && (
                        <img
                          src={card.image}
                          alt={card.title}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d1326] via-transparent to-transparent" />
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-5">
                      <div>
                        <h2 className="font-display text-2xl font-bold text-white">
                          {card.title}
                        </h2>
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                          {card.desc}
                        </p>
                      </div>
                      <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-sky-400">
                        <span>Tanlash</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'name' && (
            <motion.div
              key="step-name"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
              className="mx-auto max-w-md rounded-2xl border border-white/10 bg-[#0d1326] p-7 shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setStep('age')}
                className="mb-4 flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Yoshni o‘zgartirish ({selectedAge ? AGE_GROUP_LABELS[selectedAge] : ''})</span>
              </button>

              <h1 className="font-display text-2xl font-bold text-white">
                Ismingizni kiriting
              </h1>
              <p className="mt-1.5 text-sm text-slate-400">
                Natijalaringiz va yutuqlaringiz shu profilga saqlanadi
              </p>

              <form onSubmit={handleSubmitName} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="zentro-username" className="sr-only">
                    Ismingizni kiriting
                  </label>
                  <input
                    id="zentro-username"
                    type="text"
                    autoFocus
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Masalan: Azizbek"
                    className="w-full rounded-xl border border-white/15 bg-[#070913] px-4 py-3.5 text-base text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none"
                  />
                  {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
                </div>

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 py-3.5 font-display text-base font-bold text-white shadow-lg shadow-sky-500/20 transition-transform hover:scale-[1.01] active:scale-[0.99]"
                >
                  <span>Davom etish</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </motion.div>
          )}

          {step === 'welcome' && (
            <motion.div
              key="step-welcome"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-auto max-w-md rounded-2xl border border-sky-400/30 bg-[#0d1326] p-8 text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <h2 className="mt-4 font-display text-2xl font-bold text-white sm:text-3xl">
                Xush kelibsiz, {username.trim()}!
              </h2>
              <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-sky-300">
                <Sparkles className="h-4 w-4" />
                <span>O‘yinlar kutubxonasi tayyorlanmoqda...</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
