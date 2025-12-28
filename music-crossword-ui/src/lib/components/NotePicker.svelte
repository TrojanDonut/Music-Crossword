<script lang="ts">
  import { onMount } from 'svelte';
  import { CHROMATIC_NOTES, noteToLetter } from '$lib/utils/pitchMapping';
  import { userInput, activeCellPosition, activeClueIndex } from '$lib/stores/userInput';
  import { clues } from '$lib/stores/puzzle';
  import { getClueCells } from '$lib/utils/validation';
  
  export let onNoteSelect: (note: string) => void = () => {};
  
  let selectedNote: string | null = null;
  
  // Handle note selection
  function selectNote(note: string) {
    selectedNote = note;
    const gridLetter = noteToLetter(note);
    
    if ($activeCellPosition) {
      const { row, col } = $activeCellPosition;
      userInput.update(grid => {
        const newGrid = grid.map(r => [...r]);
        newGrid[row][col] = gridLetter;
        return newGrid;
      });
      
      // Move to next cell in the active clue
      moveToNextCell();
    }
    
    onNoteSelect(note);
    
    // Clear selection after a short delay
    setTimeout(() => {
      selectedNote = null;
    }, 200);
  }
  
  // Move to the next empty cell in the active clue
  function moveToNextCell() {
    if ($activeClueIndex === null || !$clues[$activeClueIndex]) return;
    
    const cells = getClueCells($clues[$activeClueIndex]);
    const currentIndex = cells.findIndex(
      ([r, c]) => r === $activeCellPosition?.row && c === $activeCellPosition?.col
    );
    
    if (currentIndex === -1) return;
    
    // Find next empty cell
    for (let i = currentIndex + 1; i < cells.length; i++) {
      const [nextRow, nextCol] = cells[i];
      const currentValue = $userInput[nextRow]?.[nextCol];
      if (currentValue === null || currentValue === '') {
        activeCellPosition.set({ row: nextRow, col: nextCol });
        return;
      }
    }
    
    // If no empty cell found, move to the last cell
    if (currentIndex < cells.length - 1) {
      const [nextRow, nextCol] = cells[cells.length - 1];
      activeCellPosition.set({ row: nextRow, col: nextCol });
    }
  }
  
  // Move to the previous cell in the active clue
  function moveToPreviousCell() {
    if ($activeClueIndex === null || !$clues[$activeClueIndex]) return;
    
    const cells = getClueCells($clues[$activeClueIndex]);
    const currentIndex = cells.findIndex(
      ([r, c]) => r === $activeCellPosition?.row && c === $activeCellPosition?.col
    );
    
    if (currentIndex === -1) return;
    
    // If current cell is empty, move to previous
    const currentValue = $userInput[$activeCellPosition.row]?.[$activeCellPosition.col];
    if (currentValue === null || currentValue === '') {
      if (currentIndex > 0) {
        const [prevRow, prevCol] = cells[currentIndex - 1];
        activeCellPosition.set({ row: prevRow, col: prevCol });
      }
    } else {
      // If current cell has value, just clear it and stay
      // (already handled by handleBackspace)
    }
  }
  
  // Clear current cell and move to previous
  function handleBackspace() {
    if ($activeCellPosition) {
      const { row, col } = $activeCellPosition;
      const currentValue = $userInput[row]?.[col];
      
      userInput.update(grid => {
        const newGrid = grid.map(r => [...r]);
        newGrid[row][col] = null;
        return newGrid;
      });
      
      // Move to previous cell after clearing
      moveToPreviousCell();
    }
  }
  
  // Keyboard shortcuts
  function handleKeyboard(event: KeyboardEvent) {
    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      handleBackspace();
      return;
    }
    
    const key = event.key.toUpperCase();
    const isSharp = event.shiftKey;
    
    // Map keys to notes
    const noteMap: Record<string, string> = {
      'C': isSharp ? 'C#' : 'C',
      'D': isSharp ? 'D#' : 'D',
      'E': 'E',
      'F': isSharp ? 'F#' : 'F',
      'G': isSharp ? 'G#' : 'G',
      'A': isSharp ? 'A#' : 'A',
      'B': 'B'
    };
    
    if (noteMap[key]) {
      event.preventDefault();
      selectNote(noteMap[key]);
    }
  }
  
  onMount(() => {
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  });
  
  // Check if a note is a sharp
  function isSharpNote(note: string): boolean {
    return note.includes('#') || note.includes('♯');
  }
</script>

<div class="note-picker">
  <div class="picker-header">
    <h3>Select Note</h3>
    <button class="backspace-btn" on:click={handleBackspace} title="Backspace (Delete)">
      ⌫ Clear
    </button>
  </div>
  
  <div class="piano-keys">
    {#each CHROMATIC_NOTES as note}
      <button
        class="note-button {isSharpNote(note) ? 'sharp' : 'natural'} {selectedNote === note ? 'selected' : ''}"
        on:click={() => selectNote(note)}
        data-note={note}
        title={note}
      >
        <span class="note-name">{note.replace('#', '♯')}</span>
      </button>
    {/each}
  </div>
  
  <div class="keyboard-hint">
    <p>💡 Keyboard: C, D, E, F, G, A, B (Shift for sharps) | Backspace to clear</p>
  </div>
</div>

<style>
  .note-picker {
    background: #f9fafb;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    max-width: 900px;
    margin: 0 auto;
  }
  
  .picker-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .picker-header h3 {
    margin: 0;
    font-size: 1.25rem;
    color: #1f2937;
  }
  
  .backspace-btn {
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .backspace-btn:hover {
    background: #dc2626;
    transform: scale(1.05);
  }
  
  .backspace-btn:active {
    transform: scale(0.95);
  }
  
  .piano-keys {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .note-button {
    padding: 1.25rem 0.5rem;
    border: 2px solid #d1d5db;
    border-radius: 8px;
    font-size: 1.125rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s ease;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
  }
  
  .note-button.natural {
    background: linear-gradient(180deg, #ffffff 0%, #f3f4f6 100%);
    color: #1f2937;
  }
  
  .note-button.sharp {
    background: linear-gradient(180deg, #374151 0%, #1f2937 100%);
    color: white;
    transform: translateY(-4px);
  }
  
  .note-button:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    z-index: 10;
  }
  
  .note-button.sharp:hover {
    transform: translateY(-6px) scale(1.05);
  }
  
  .note-button:active, .note-button.selected {
    transform: translateY(0) scale(0.95);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .note-button.sharp:active, .note-button.sharp.selected {
    transform: translateY(-2px) scale(0.95);
  }
  
  .note-button.selected {
    outline: 3px solid #3b82f6;
    outline-offset: -3px;
  }
  
  .note-name {
    font-family: 'Georgia', serif;
  }
  
  .keyboard-hint {
    text-align: center;
    margin-top: 1rem;
  }
  
  .keyboard-hint p {
    margin: 0;
    font-size: 0.875rem;
    color: #6b7280;
  }
  
  @media (max-width: 768px) {
    .piano-keys {
      grid-template-columns: repeat(6, 1fr);
    }
    
    .note-button {
      padding: 1rem 0.25rem;
      font-size: 1rem;
    }
    
    .keyboard-hint {
      display: none;
    }
  }
  
  @media (max-width: 480px) {
    .piano-keys {
      grid-template-columns: repeat(4, 1fr);
    }
    
    .note-button {
      padding: 0.875rem 0.25rem;
      font-size: 0.875rem;
    }
  }
</style>

