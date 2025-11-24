/**
 * Svelte store for audio state
 */

import { writable } from 'svelte/store';

interface AudioState {
  playing: boolean;
  currentClueIndex: number | null;
  volume: number;
  speed: number;
}

const initialState: AudioState = {
  playing: false,
  currentClueIndex: null,
  volume: 0.3,
  speed: 1.0
};

export const audioStore = writable<AudioState>(initialState);

/**
 * Set playing state
 */
export function setPlaying(playing: boolean, clueIndex: number | null = null) {
  audioStore.update(state => ({
    ...state,
    playing,
    currentClueIndex: playing ? clueIndex : null
  }));
}

/**
 * Set volume (0-1)
 */
export function setVolume(volume: number) {
  audioStore.update(state => ({
    ...state,
    volume: Math.max(0, Math.min(1, volume))
  }));
}

/**
 * Set playback speed
 */
export function setSpeed(speed: number) {
  audioStore.update(state => ({
    ...state,
    speed: Math.max(0.5, Math.min(2.0, speed))
  }));
}

/**
 * Reset audio state
 */
export function resetAudio() {
  audioStore.set(initialState);
}

