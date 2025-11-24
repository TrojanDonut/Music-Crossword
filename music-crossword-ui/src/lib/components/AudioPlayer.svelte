<script lang="ts">
  import { playMelodyWithRhythm, playHint, getAudioContext } from '$lib/utils/audioSynth';
  import { parsePitchSequence } from '$lib/utils/pitchMapping';
  import { audioStore, setPlaying } from '$lib/stores/audio';
  
  export let pitchSequence: string;
  export let rhythmSequence: string | null = null;
  export let clueIndex: number;
  export let compact = false;
  
  $: notes = parsePitchSequence(pitchSequence);
  $: rhythms = rhythmSequence ? rhythmSequence.split(' ') : null;
  $: isPlaying = $audioStore.playing && $audioStore.currentClueIndex === clueIndex;
  
  let tempo = 120; // BPM (beats per minute)
  
  async function play(hintLevel: number = -1) {
    // Resume audio context on user interaction
    const context = getAudioContext();
    if (context.state === 'suspended') {
      await context.resume();
    }
    
    setPlaying(true, clueIndex);
    
    try {
      if (hintLevel === -1) {
        // Play full melody with rhythm
        await playMelodyWithRhythm(notes, rhythms, tempo, 0.1, 4, $audioStore.volume);
      } else {
        // Play hint (first N notes)
        await playHint(notes, rhythms, hintLevel, tempo);
      }
    } finally {
      setPlaying(false);
    }
  }
  
  function handlePlay() {
    if (!isPlaying) {
      play();
    }
  }
  
  function handleHint(level: number) {
    if (!isPlaying) {
      play(level);
    }
  }
</script>

{#if compact}
  <div class="audio-controls-compact">
    <button
      class="play-btn {isPlaying ? 'playing' : ''}"
      on:click={handlePlay}
      disabled={isPlaying}
      title="Play melody"
    >
      {isPlaying ? '⏸' : '▶'}
    </button>
  </div>
{:else}
  <div class="audio-controls">
    <button
      class="play-btn-large {isPlaying ? 'playing' : ''}"
      on:click={handlePlay}
      disabled={isPlaying}
    >
      <span class="icon">{isPlaying ? '⏸' : '▶'}</span>
      <span class="label">{isPlaying ? 'Playing...' : 'Play Melody'}</span>
    </button>
    
    <div class="hint-buttons">
      <button
        class="hint-btn"
        on:click={() => handleHint(1)}
        disabled={isPlaying}
        title="Play first note"
      >
        1st Note
      </button>
      <button
        class="hint-btn"
        on:click={() => handleHint(3)}
        disabled={isPlaying}
        title="Play first 3 notes"
      >
        3 Notes
      </button>
    </div>
    
    <div class="tempo-control">
      <label for="tempo-slider">
        <span class="tempo-label">Tempo:</span>
        <span class="tempo-value">{tempo} BPM</span>
      </label>
      <input
        id="tempo-slider"
        type="range"
        bind:value={tempo}
        min="60"
        max="180"
        step="10"
        disabled={isPlaying}
        title="Adjust playback speed"
      />
      <div class="tempo-presets">
        <button 
          class="preset-btn"
          on:click={() => tempo = 80} 
          disabled={isPlaying}
          title="Slow - easier to recognize"
        >
          Slow
        </button>
        <button 
          class="preset-btn"
          on:click={() => tempo = 120} 
          disabled={isPlaying}
          title="Normal tempo"
        >
          Normal
        </button>
        <button 
          class="preset-btn"
          on:click={() => tempo = 160} 
          disabled={isPlaying}
          title="Fast - challenge mode"
        >
          Fast
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .audio-controls-compact {
    display: flex;
    gap: 0.25rem;
  }
  
  .play-btn {
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.875rem;
  }
  
  .play-btn:hover:not(:disabled) {
    background: #2563eb;
    transform: scale(1.1);
  }
  
  .play-btn:active:not(:disabled) {
    transform: scale(0.95);
  }
  
  .play-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .play-btn.playing {
    animation: pulse 1s ease-in-out infinite;
  }
  
  .audio-controls {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .play-btn-large {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    border: none;
    border-radius: 12px;
    padding: 1rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 1.125rem;
    font-weight: 600;
    box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
  }
  
  .play-btn-large:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 12px -1px rgba(59, 130, 246, 0.4);
  }
  
  .play-btn-large:active:not(:disabled) {
    transform: translateY(0);
  }
  
  .play-btn-large:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  .play-btn-large.playing {
    animation: pulse 1s ease-in-out infinite;
  }
  
  .icon {
    font-size: 1.25rem;
  }
  
  .hint-buttons {
    display: flex;
    gap: 0.5rem;
  }
  
  .hint-btn {
    flex: 1;
    background: #f3f4f6;
    color: #374151;
    border: 2px solid #d1d5db;
    border-radius: 8px;
    padding: 0.625rem 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .hint-btn:hover:not(:disabled) {
    background: #e5e7eb;
    border-color: #9ca3af;
    transform: translateY(-1px);
  }
  
  .hint-btn:active:not(:disabled) {
    transform: translateY(0);
  }
  
  .hint-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }
  
  .tempo-control {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-top: 0.75rem;
    border-top: 2px solid #e5e7eb;
  }
  
  .tempo-control label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
  }
  
  .tempo-label {
    color: #6b7280;
  }
  
  .tempo-value {
    color: #3b82f6;
    font-weight: 700;
  }
  
  #tempo-slider {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: linear-gradient(to right, #e5e7eb 0%, #3b82f6 50%, #e5e7eb 100%);
    outline: none;
    -webkit-appearance: none;
    appearance: none;
  }
  
  #tempo-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.4);
    transition: all 0.2s;
  }
  
  #tempo-slider::-webkit-slider-thumb:hover {
    background: #2563eb;
    transform: scale(1.2);
  }
  
  #tempo-slider::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.4);
    transition: all 0.2s;
  }
  
  #tempo-slider::-moz-range-thumb:hover {
    background: #2563eb;
    transform: scale(1.2);
  }
  
  #tempo-slider:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .tempo-presets {
    display: flex;
    gap: 0.5rem;
  }
  
  .preset-btn {
    flex: 1;
    background: #f9fafb;
    color: #6b7280;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .preset-btn:hover:not(:disabled) {
    background: #f3f4f6;
    color: #3b82f6;
    border-color: #3b82f6;
  }
  
  .preset-btn:active:not(:disabled) {
    transform: scale(0.95);
  }
  
  .preset-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  @media (max-width: 640px) {
    .hint-buttons {
      flex-direction: column;
    }
    
    .tempo-presets {
      flex-direction: column;
    }
  }
</style>

