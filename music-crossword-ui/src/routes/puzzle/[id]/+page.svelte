<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import CrosswordGrid from '$lib/components/CrosswordGrid.svelte';
  import NotePicker from '$lib/components/NotePicker.svelte';
  import ClueList from '$lib/components/ClueList.svelte';
  import ProgressIndicator from '$lib/components/ProgressIndicator.svelte';
  import AudioPlayer from '$lib/components/AudioPlayer.svelte';
  import { puzzleStore, loadPuzzle, acrossClues, downClues } from '$lib/stores/puzzle';
  import { userInput, initializeGrid, clearGrid, saveProgress, loadProgress, activeClueIndex } from '$lib/stores/userInput';
  
  $: puzzleId = parseInt($page.params.id || '0');
  
  let showHints = false;
  
  onMount(async () => {
    await loadPuzzle(puzzleId);
    
    if ($puzzleStore.puzzle) {
      const { rows, cols } = $puzzleStore.puzzle.layout;
      
      // Try to load saved progress
      const savedProgress = loadProgress(puzzleId);
      if (savedProgress) {
        userInput.set(savedProgress);
      } else {
        initializeGrid(rows, cols);
      }
    }
  });
  
  onDestroy(() => {
    // Auto-save progress when leaving
    if ($puzzleStore.puzzle) {
      saveProgress(puzzleId);
    }
  });
  
  function handleClearPuzzle() {
    if (confirm('Are you sure you want to clear all your answers?')) {
      clearGrid();
    }
  }
  
  function handleGoBack() {
    goto('/');
  }
  
  $: currentClue = $activeClueIndex !== null && $puzzleStore.puzzle
    ? $puzzleStore.puzzle.layout.result[$activeClueIndex]
    : null;
</script>

<svelte:head>
  <title>Puzzle #{puzzleId} | Musical Crossword</title>
</svelte:head>

<div class="puzzle-page">
  {#if $puzzleStore.loading}
    <div class="loading-screen">
      <div class="spinner"></div>
      <p>Loading puzzle...</p>
    </div>
  {:else if $puzzleStore.error}
    <div class="error-screen">
      <p class="error-icon">⚠️</p>
      <p class="error-message">{$puzzleStore.error}</p>
      <button on:click={handleGoBack} class="back-btn">
        ← Back to Puzzles
      </button>
    </div>
  {:else if $puzzleStore.puzzle}
    <header class="puzzle-header">
      <button on:click={handleGoBack} class="back-button">
        ← Back
      </button>
      <h1 class="puzzle-title">Puzzle #{puzzleId}</h1>
      <button on:click={handleClearPuzzle} class="clear-button">
        🗑️ Clear
      </button>
    </header>
    
    <div class="progress-section">
      <ProgressIndicator />
    </div>
    
    <div class="puzzle-content">
      <div class="grid-section">
        <CrosswordGrid />
        
        {#if currentClue}
          <div class="current-clue-player">
            <div class="current-clue-info">
              <h3>Now Playing</h3>
              <p class="clue-text">{currentClue.clue || 'Unknown melody'}</p>
              <p class="clue-details">
                {currentClue.answer.length} notes • {currentClue.orientation}
              </p>
            </div>
            {#if currentClue.motif?.pitch_sequence}
              <AudioPlayer
                pitchSequence={currentClue.motif.pitch_sequence}
                rhythmSequence={currentClue.motif.rhythm_sequence}
                clueIndex={$activeClueIndex ?? 0}
                compact={false}
              />
            {/if}
          </div>
        {/if}
        
        <div class="input-section">
          <NotePicker />
        </div>
      </div>
      
      <div class="clues-section">
        <div class="clues-container">
          <ClueList clues={$acrossClues} title="Across" />
          <ClueList clues={$downClues} title="Down" />
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  :global(body) {
    margin: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
  }
  
  .puzzle-page {
    min-height: 100vh;
    padding: 1rem;
  }
  
  .loading-screen,
  .error-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 80vh;
    color: white;
    text-align: center;
  }
  
  .spinner {
    width: 64px;
    height: 64px;
    border: 6px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  .error-icon {
    font-size: 5rem;
    margin-bottom: 1rem;
  }
  
  .error-message {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 2rem;
  }
  
  .puzzle-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1400px;
    margin: 0 auto 1.5rem;
    padding: 0 1rem;
  }
  
  .back-button,
  .clear-button {
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    padding: 0.75rem 1.25rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .back-button:hover,
  .clear-button:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }
  
  .back-btn {
    background: white;
    color: #667eea;
    border: none;
    border-radius: 8px;
    padding: 1rem 2rem;
    font-size: 1.125rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .back-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  }
  
  .puzzle-title {
    margin: 0;
    color: white;
    font-size: 2rem;
    font-weight: 800;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  .progress-section {
    max-width: 1400px;
    margin: 0 auto 2rem;
  }
  
  .puzzle-content {
    max-width: 1400px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 2rem;
    align-items: start;
  }
  
  .grid-section {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  .current-clue-player {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  
  .current-clue-info h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6b7280;
    font-weight: 700;
  }
  
  .clue-text {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: #1f2937;
  }
  
  .clue-details {
    margin: 0 0 1rem 0;
    font-size: 0.875rem;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .input-section {
    position: sticky;
    top: 1rem;
  }
  
  .clues-section {
    position: sticky;
    top: 1rem;
    max-height: calc(100vh - 2rem);
    overflow-y: auto;
  }
  
  .clues-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  /* Custom scrollbar */
  .clues-section::-webkit-scrollbar {
    width: 8px;
  }
  
  .clues-section::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
  
  .clues-section::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
  }
  
  .clues-section::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }
  
  @media (max-width: 1200px) {
    .puzzle-content {
      grid-template-columns: 1fr;
    }
    
    .clues-section {
      position: static;
      max-height: none;
    }
    
    .input-section {
      position: static;
    }
  }
  
  @media (max-width: 768px) {
    .puzzle-page {
      padding: 0.5rem;
    }
    
    .puzzle-header {
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    
    .puzzle-title {
      font-size: 1.5rem;
      width: 100%;
      text-align: center;
      order: -1;
      margin-bottom: 0.5rem;
    }
    
    .back-button,
    .clear-button {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }
  }
</style>

