import React from 'react';
import { GameDefinition, GameResult, GraphicsQuality } from '../../types';

export interface TouchInputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  brake: boolean;
  boost: boolean;
  cameraTrigger: number;
  actionTrigger: number;
}

export function createEmptyTouchInput(): TouchInputState {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    brake: false,
    boost: false,
    cameraTrigger: 0,
    actionTrigger: 0,
  };
}

export interface GameEngineProps {
  game: GameDefinition;
  isPaused: boolean;
  graphicsQuality: GraphicsQuality;
  touchInputRef: React.MutableRefObject<TouchInputState>;
  onComplete: (result: GameResult) => void;
}
