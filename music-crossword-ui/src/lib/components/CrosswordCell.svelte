<script lang="ts">
  import { letterToNote } from '$lib/utils/pitchMapping';
  
  export let value: string | null = null;
  export let isActive = false;
  export let isCorrect: boolean | null = null;
  export let isEmpty = false;
  export let row = 0;
  export let col = 0;
  export let onClick: () => void = () => {};
  
  $: displayValue = value ? letterToNote(value) : '';
  $: cellClass = isEmpty ? 'empty' : 
                 isCorrect === true ? 'correct' : 
                 isCorrect === false ? 'incorrect' : 
                 isActive ? 'active' : 
                 value ? 'filled' : '';
</script>

<button
  class="crossword-cell {cellClass}"
  data-row={row}
  data-col={col}
  on:click={onClick}
  disabled={isEmpty}
  aria-label="Cell at row {row}, column {col}"
>
  {#if !isEmpty}
    <span class="cell-value">{displayValue}</span>
  {/if}
</button>

<style>
  .crossword-cell {
    aspect-ratio: 1;
    background: #ffffff;
    border: 1px solid #d1d5db;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: clamp(1rem, 3vw, 1.5rem);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    padding: 0;
    min-height: 40px;
    user-select: none;
  }
  
  .crossword-cell:not(.empty):hover {
    background: #e0e7ff;
    transform: scale(1.05);
    z-index: 10;
  }
  
  .crossword-cell:not(.empty):active {
    transform: scale(0.95);
  }
  
  .crossword-cell.empty {
    background: #1f2937;
    cursor: default;
  }
  
  .crossword-cell.filled {
    background: #f3f4f6;
    color: #1f2937;
  }
  
  .crossword-cell.active {
    background: #dbeafe;
    outline: 3px solid #3b82f6;
    outline-offset: -3px;
    z-index: 20;
  }
  
  .crossword-cell.correct {
    background: #10b981;
    color: white;
    animation: bounce 0.5s ease;
  }
  
  .crossword-cell.incorrect {
    background: #ef4444;
    color: white;
    animation: shake 0.3s ease;
  }
  
  .cell-value {
    font-family: 'Georgia', serif;
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
  }
  
  @keyframes bounce {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
  
  @media (max-width: 640px) {
    .crossword-cell {
      font-size: 1rem;
      min-height: 32px;
    }
  }
</style>

