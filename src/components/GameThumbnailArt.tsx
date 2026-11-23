import React from 'react';
import { GameDefinition } from '../types';

interface GameThumbnailArtProps {
  game: GameDefinition;
  className?: string;
}

export const GameThumbnailArt: React.FC<GameThumbnailArtProps> = ({ game, className = '' }) => {
  if (game.heroImage) {
    return (
      <div className={`relative overflow-hidden bg-slate-900 ${className}`}>
        <img
          src={game.heroImage}
          alt={game.title}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(7,9,19,0.05) 0%, rgba(7,9,19,0.25) 60%, rgba(7,9,19,0.85) 100%)',
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: `radial-gradient(120% 90% at 85% 15%, ${game.accentColor}40 0%, rgba(13,17,32,0.95) 55%, #070913 100%)`,
      }}
    >
      <svg
        viewBox="0 0 400 240"
        className="h-full w-full transition-transform duration-500 group-hover:scale-105"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`grad-${game.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={game.accentColor} stopOpacity="0.85" />
            <stop offset="100%" stopColor={game.secondaryColor} stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id={`road-${game.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e293b" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        {/* Ambient grid horizon */}
        <g opacity="0.18" stroke={game.accentColor} strokeWidth="1">
          <line x1="0" y1="150" x2="400" y2="150" />
          <line x1="0" y1="175" x2="400" y2="175" />
          <line x1="0" y1="205" x2="400" y2="205" />
          <line x1="200" y1="130" x2="40" y2="240" />
          <line x1="200" y1="130" x2="140" y2="240" />
          <line x1="200" y1="130" x2="260" y2="240" />
          <line x1="200" y1="130" x2="360" y2="240" />
        </g>

        {/* Sun / Glow Orb */}
        <circle cx="315" cy="65" r="48" fill={game.accentColor} opacity="0.22" />
        <circle cx="315" cy="65" r="28" fill={`url(#grad-${game.id})`} opacity="0.8" />

        {/* Variant-specific center illustration */}
        {renderVariantArt(game)}

        {/* Ground shadow scrim */}
        <rect x="0" y="185" width="400" height="55" fill={`url(#road-${game.id})`} opacity="0.45" />
      </svg>
    </div>
  );
};

function renderVariantArt(game: GameDefinition) {
  const c1 = game.accentColor;
  const c2 = game.secondaryColor;

  switch (game.variant) {
    case 'colorful-cars':
    case 'mini-racer':
    case 'super-car':
    case 'street-racing':
    case 'ultimate-gt':
    case 'hypercar-highway':
    case 'drift-masters':
    case 'formula-pro':
      return (
        <g>
          {/* Curved racing track */}
          <path d="M-20 240 Q 190 120 420 180 L 420 240 Z" fill="#131b2e" stroke={c1} strokeWidth="2.5" />
          <path d="M50 240 Q 205 148 390 198" fill="none" stroke="#f8fafc" strokeWidth="3" strokeDasharray="12 10" opacity="0.55" />
          {/* Sleek sports/formula car silhouette */}
          <g transform="translate(115, 118)">
            <ellipse cx="85" cy="62" rx="76" ry="12" fill="#000000" opacity="0.5" />
            <path d="M12 46 L28 24 L74 16 L124 22 L156 38 L158 52 L10 52 Z" fill={`url(#grad-${game.id})`} />
            <path d="M46 25 L72 19 L106 23 L114 34 L42 34 Z" fill="#0b1120" stroke={c2} strokeWidth="1.5" />
            {/* Spoiler */}
            <path d="M8 28 L22 28 L16 38 L6 38 Z" fill={c2} />
            {/* Wheels */}
            <circle cx="38" cy="52" r="15" fill="#090d16" stroke="#64748b" strokeWidth="3" />
            <circle cx="38" cy="52" r="6" fill={c1} />
            <circle cx="130" cy="52" r="15" fill="#090d16" stroke="#64748b" strokeWidth="3" />
            <circle cx="130" cy="52" r="6" fill={c1} />
            {/* Headlight beam */}
            <polygon points="156,40 230,28 230,54" fill={c2} opacity="0.22" />
          </g>
        </g>
      );

    case 'super-bike':
      return (
        <g transform="translate(120, 102)">
          <ellipse cx="80" cy="82" rx="68" ry="10" fill="#000" opacity="0.45" />
          <circle cx="34" cy="66" r="20" fill="#0f172a" stroke="#94a3b8" strokeWidth="4" />
          <circle cx="128" cy="66" r="20" fill="#0f172a" stroke="#94a3b8" strokeWidth="4" />
          <path d="M34 66 L68 38 L112 34 L132 58 L78 58 Z" fill={`url(#grad-${game.id})`} />
          <path d="M74 28 L96 16 L112 28 L94 40 Z" fill="#e2e8f0" />
          <circle cx="102" cy="14" r="10" fill={c2} />
        </g>
      );

    case 'offroad-4x4':
    case 'extreme-stunt':
      return (
        <g>
          <path d="M0 190 L90 155 L170 175 L270 135 L400 185 L400 240 L0 240 Z" fill="#1b2432" />
          <g transform="translate(120, 108)">
            <rect x="20" y="22" width="118" height="36" rx="8" fill={`url(#grad-${game.id})`} />
            <path d="M40 22 L54 4 L106 4 L120 22 Z" fill="#1e293b" stroke={c2} strokeWidth="2" />
            <circle cx="44" cy="62" r="18" fill="#090d16" stroke="#64748b" strokeWidth="4" />
            <circle cx="116" cy="62" r="18" fill="#090d16" stroke="#64748b" strokeWidth="4" />
          </g>
        </g>
      );

    case 'find-animals':
      return (
        <g>
          <ellipse cx="200" cy="195" rx="140" ry="28" fill="#14532d" opacity="0.6" />
          {/* Stylized cute elephant & lion silhouettes */}
          <g transform="translate(105, 86)">
            <circle cx="46" cy="48" r="32" fill={c1} />
            <circle cx="46" cy="48" r="22" fill={c2} />
            <circle cx="38" cy="44" r="3.5" fill="#0f172a" />
            <circle cx="54" cy="44" r="3.5" fill="#0f172a" />
            <path d="M42 54 Q46 59 50 54" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
          </g>
          <g transform="translate(215, 76)">
            <rect x="14" y="34" width="52" height="44" rx="14" fill="#38bdf8" />
            <circle cx="16" cy="44" r="14" fill="#7dd3fc" />
            <circle cx="64" cy="44" r="14" fill="#7dd3fc" />
            <path d="M40 54 Q46 76 58 72" fill="none" stroke="#38bdf8" strokeWidth="8" strokeLinecap="round" />
          </g>
        </g>
      );

    case 'shapes-world':
      return (
        <g>
          <rect x="75" y="75" width="58" height="58" rx="10" fill={c1} transform="rotate(-12 104 104)" />
          <circle cx="205" cy="96" r="34" fill={c2} />
          <polygon points="295,62 332,132 258,132" fill="#38bdf8" />
          <polygon points="155,140 165,162 188,165 170,180 175,204 155,192 135,204 140,180 122,165 145,162" fill="#fbbf24" />
        </g>
      );

    case 'collect-fruits':
      return (
        <g>
          {/* Floating fruits */}
          <circle cx="115" cy="72" r="22" fill="#ef4444" />
          <path d="M115 50 Q124 38 132 46" stroke="#22c55e" strokeWidth="4" fill="none" />
          <circle cx="205" cy="56" r="20" fill="#f97316" />
          <path d="M258 84 Q282 54 304 82 Q280 96 258 84 Z" fill="#facc15" />
          {/* Basket */}
          <path d="M135 148 L265 148 L248 194 L152 194 Z" fill="#d97706" stroke="#fbbf24" strokeWidth="3" />
          <line x1="145" y1="168" x2="255" y2="168" stroke="#92400e" strokeWidth="3" />
        </g>
      );

    case 'dino-world':
      return (
        <g>
          <path d="M250 180 L300 78 L330 78 L375 180 Z" fill="#451a03" />
          <circle cx="315" cy="64" r="14" fill="#f97316" opacity="0.85" />
          <g transform="translate(86, 84)">
            <path d="M24 88 Q40 46 86 44 L112 20 L144 22 L144 42 L118 46 L104 88 L88 88 L88 106 L74 106 L74 88 L48 88 L48 106 L34 106 Z" fill={`url(#grad-${game.id})`} />
            <circle cx="132" cy="30" r="3" fill="#0f172a" />
          </g>
        </g>
      );

    case 'city-builder':
      return (
        <g>
          <rect x="75" y="96" width="44" height="96" rx="4" fill="#1e293b" stroke={c1} strokeWidth="2" />
          <rect x="132" y="54" width="58" height="138" rx="4" fill="#0f172a" stroke={c2} strokeWidth="2" />
          <rect x="204" y="76" width="48" height="116" rx="4" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
          <rect x="266" y="114" width="54" height="78" rx="4" fill="#0f172a" stroke="#22c55e" strokeWidth="2" />
          <g fill={c1} opacity="0.85">
            <rect x="144" y="70" width="12" height="10" rx="1" />
            <rect x="166" y="70" width="12" height="10" rx="1" />
            <rect x="144" y="92" width="12" height="10" rx="1" />
            <rect x="166" y="92" width="12" height="10" rx="1" />
            <rect x="216" y="92" width="10" height="10" rx="1" />
            <rect x="232" y="92" width="10" height="10" rx="1" />
          </g>
        </g>
      );

    case 'space-explorer':
      return (
        <g>
          <circle cx="285" cy="95" r="34" fill={c1} opacity="0.75" />
          <ellipse cx="285" cy="95" rx="62" ry="14" fill="none" stroke={c2} strokeWidth="4" transform="rotate(-18 285 95)" />
          <g transform="translate(105, 86) rotate(-14)">
            <path d="M0 24 L64 6 L94 24 L64 42 Z" fill={`url(#grad-${game.id})`} />
            <polygon points="10,24 -26,14 -26,34" fill="#38bdf8" opacity="0.7" />
            <circle cx="58" cy="24" r="8" fill="#e0f2fe" />
          </g>
          <circle cx="70" cy="45" r="3" fill="#fff" />
          <circle cx="155" cy="40" r="2.5" fill="#fde047" />
          <circle cx="220" cy="175" r="3" fill="#fff" />
        </g>
      );

    case 'football-3d':
      return (
        <g>
          <rect x="40" y="110" width="320" height="105" rx="8" fill="#065f46" stroke="#34d399" strokeWidth="2" />
          <circle cx="200" cy="162" r="28" fill="none" stroke="#ecfdf5" strokeWidth="2" opacity="0.7" />
          <rect x="145" y="70" width="110" height="44" fill="none" stroke="#f8fafc" strokeWidth="3" />
          <circle cx="200" cy="144" r="18" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
          <polygon points="200,134 208,140 205,150 195,150 192,140" fill="#0f172a" />
        </g>
      );

    default:
      return (
        <g>
          <path d="M40 180 Q 130 110 200 145 T 360 120 L 360 220 L 40 220 Z" fill={c1} opacity="0.35" />
          <circle cx="200" cy="112" r="38" fill={`url(#grad-${game.id})`} />
          <polygon points="190,94 224,112 190,130" fill="#0f172a" />
        </g>
      );
  }
}
