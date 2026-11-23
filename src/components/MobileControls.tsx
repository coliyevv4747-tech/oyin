import React from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Camera, Zap } from 'lucide-react';
import { TouchInputState } from '../games/engine/types';

interface MobileControlsProps {
  mode: 'racing' | 'dpad' | 'tap';
  touchInputRef: React.MutableRefObject<TouchInputState>;
  actionLabel?: string;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  mode,
  touchInputRef,
  actionLabel = 'Harakat',
}) => {
  if (mode === 'tap') return null;

  const bindHold = (key: keyof Pick<TouchInputState, 'up' | 'down' | 'left' | 'right' | 'brake' | 'boost'>) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      touchInputRef.current[key] = true;
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      touchInputRef.current[key] = false;
    },
    onPointerLeave: () => {
      touchInputRef.current[key] = false;
    },
    onPointerCancel: () => {
      touchInputRef.current[key] = false;
    },
  });

  if (mode === 'racing') {
    return (
      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex items-end justify-between px-3 sm:px-5 lg:hidden">
        {/* Left: Steering */}
        <div className="pointer-events-auto flex items-center gap-2.5">
          <button
            type="button"
            aria-label="Chapga burilish"
            {...bindHold('left')}
            className="flex h-14 w-14 touch-none select-none items-center justify-center rounded-2xl border border-white/15 bg-[#0a0f1e]/85 text-slate-100 active:scale-95 active:bg-sky-500/40"
          >
            <ArrowLeft className="h-7 w-7" />
          </button>
          <button
            type="button"
            aria-label="O'ngga burilish"
            {...bindHold('right')}
            className="flex h-14 w-14 touch-none select-none items-center justify-center rounded-2xl border border-white/15 bg-[#0a0f1e]/85 text-slate-100 active:scale-95 active:bg-sky-500/40"
          >
            <ArrowRight className="h-7 w-7" />
          </button>
        </div>

        {/* Right: Camera, Nitro, Brake, Gas */}
        <div className="pointer-events-auto flex items-end gap-2">
          <button
            type="button"
            aria-label="Kamera"
            onClick={() => {
              touchInputRef.current.cameraTrigger += 1;
            }}
            className="flex h-11 w-11 touch-none select-none items-center justify-center rounded-xl border border-white/15 bg-[#0a0f1e]/85 text-slate-200 active:scale-95"
          >
            <Camera className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Tezlik"
            {...bindHold('boost')}
            className="flex h-12 w-12 touch-none select-none items-center justify-center rounded-xl border border-amber-400/40 bg-amber-500/20 text-amber-300 active:scale-95"
          >
            <Zap className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Tormoz"
            {...bindHold('down')}
            className="flex h-14 w-14 touch-none select-none items-center justify-center rounded-2xl border border-rose-500/40 bg-rose-600/30 text-xs font-semibold text-rose-100 active:scale-95"
          >
            Tormoz
          </button>
          <button
            type="button"
            aria-label="Gaz"
            {...bindHold('up')}
            className="flex h-16 w-16 touch-none select-none items-center justify-center rounded-2xl border border-emerald-400/50 bg-emerald-500/35 text-sm font-bold text-emerald-50 active:scale-95"
          >
            GAZ
          </button>
        </div>
      </div>
    );
  }

  // dpad mode (voxel, football, fruit basket)
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex items-end justify-between px-3 sm:px-5 lg:hidden">
      <div className="pointer-events-auto grid grid-cols-3 gap-1.5">
        <div />
        <button
          type="button"
          aria-label="Oldinga"
          {...bindHold('up')}
          className="flex h-12 w-12 touch-none select-none items-center justify-center rounded-xl border border-white/15 bg-[#0a0f1e]/85 text-white active:bg-sky-500/40"
        >
          <ArrowUp className="h-6 w-6" />
        </button>
        <div />
        <button
          type="button"
          aria-label="Chapga"
          {...bindHold('left')}
          className="flex h-12 w-12 touch-none select-none items-center justify-center rounded-xl border border-white/15 bg-[#0a0f1e]/85 text-white active:bg-sky-500/40"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <button
          type="button"
          aria-label="Orqaga"
          {...bindHold('down')}
          className="flex h-12 w-12 touch-none select-none items-center justify-center rounded-xl border border-white/15 bg-[#0a0f1e]/85 text-white active:bg-sky-500/40"
        >
          <ArrowDown className="h-6 w-6" />
        </button>
        <button
          type="button"
          aria-label="O'ngga"
          {...bindHold('right')}
          className="flex h-12 w-12 touch-none select-none items-center justify-center rounded-xl border border-white/15 bg-[#0a0f1e]/85 text-white active:bg-sky-500/40"
        >
          <ArrowRight className="h-6 w-6" />
        </button>
      </div>

      <div className="pointer-events-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            touchInputRef.current.actionTrigger += 1;
          }}
          {...bindHold('brake')}
          className="flex h-14 min-w-20 touch-none select-none items-center justify-center rounded-2xl border border-sky-400/50 bg-sky-500/35 px-4 text-sm font-bold text-white active:scale-95"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
};
