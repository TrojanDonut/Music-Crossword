<script lang="ts">
  import { onMount } from 'svelte';
  import CrosswordCell from './CrosswordCell.svelte';
  import { userInput, activeClueIndex, setCellValue, setActiveCell } from '$lib/stores/userInput';
  import { clues, puzzleStore } from '$lib/stores/puzzle';
  import { validation } from '$lib/stores/userInput';
  import { findCluesAtCell, getClueCells } from '$lib/utils/validation';
  
  $: layout = $puzzleStore.puzzle?.layout;
  $: grid = $userInput;
  
  // Get active cells for highlighting
  $: activeCells = $activeClueIndex !== null && $clues[$activeClueIndex]
    ? (() => {
        const clue = $clues[$activeClueIndex];
        console.log('=== HIGHLIGHTING DEBUG ===');
        console.log('Clue:', clue.clue);
        console.log('Answer:', clue.answer, 'Length:', clue.answer.length);
        console.log('Position from API:', clue.position);
        console.log('Original startx/starty:', clue.startx, '/', clue.starty);
        console.log('Orientation:', clue.orientation);
        const cells = getClueCells(clue);
        console.log('Calculated cells (row,col):', cells);
        console.log('First cell: row', cells[0][0], 'col', cells[0][1]);
        console.log('Last cell: row', cells[cells.length-1][0], 'col', cells[cells.length-1][1]);
        return new Set(cells.map(([r, c]) => `${r},${c}`));
      })()
    : new Set();
  
  function handleCellClick(row: number, col: number) {
    if (!layout) return;
    
    // Check if this cell is part of the puzzle (not empty)
    if (layout.table[row][col] === '-') return;
    
    setActiveCell(row, col);
    
    // Find which clue(s) this cell belongs to
    const clueIndices = findCluesAtCell($clues, row, col);
    
    if (clueIndices.length > 0) {
      // If already on a clue, toggle to the other direction if available
      if ($activeClueIndex !== null && clueIndices.includes($activeClueIndex) && clueIndices.length > 1) {
        const nextIndex = clueIndices.find(i => i !== $activeClueIndex);
        activeClueIndex.set(nextIndex ?? clueIndices[0]);
      } else {
        activeClueIndex.set(clueIndices[0]);
      }
    }
  }
  
  function isCellEmpty(row: number, col: number): boolean {
    return layout?.table[row][col] === '-';
  }
  
  function getCellValidation(row: number, col: number): boolean | null {
    // Only show validation for filled cells
    if (!grid[row] || grid[row][col] === null) return null;
    
    // Check if any clue containing this cell is validated
    const clueIndices = findCluesAtCell($clues, row, col);
    for (const idx of clueIndices) {
      if ($validation.has(idx)) {
        return $validation.get(idx) ?? null;
      }
    }
    return null;
  }
</script>

{#if layout}
  <div
    class="crossword-grid"
    style="
      grid-template-columns: repeat({layout.cols}, 1fr);
      grid-template-rows: repeat({layout.rows}, 1fr);
    "
  >
    {#each Array(layout.rows) as _, row}
      {#each Array(layout.cols) as _, col}
        <CrosswordCell
          value={grid[row]?.[col] ?? null}
          isEmpty={isCellEmpty(row, col)}
          isActive={activeCells.has(`${row},${col}`)}
          isCorrect={getCellValidation(row, col)}
          {row}
          {col}
          onClick={() => handleCellClick(row, col)}
        />
      {/each}
    {/each}
  </div>
{:else}
  <div class="loading">Loading puzzle...</div>
{/if}

<style>
  .crossword-grid {
    display: grid;
    gap: 1px;
    background: #9ca3af;
    padding: 1px;
    width: fit-content;
    max-width: 90vw;
    margin: 0 auto;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border-radius: 4px;
  }
  
  .loading {
    text-align: center;
    padding: 2rem;
    font-size: 1.25rem;
    color: #6b7280;
  }
  
  @media (max-width: 640px) {
    .crossword-grid {
      gap: 0.5px;
      max-width: 95vw;
    }
  }
</style>

