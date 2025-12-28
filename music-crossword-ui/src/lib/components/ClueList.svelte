<script lang="ts">
  import AudioPlayer from './AudioPlayer.svelte';
  import { activeClueIndex } from '$lib/stores/userInput';
  import { validation } from '$lib/stores/userInput';
  import type { Clue } from '$lib/types/puzzle';
  
  export let clues: Clue[]; // Filtered clues (across or down)
  export let allClues: Clue[]; // Full clues array for global index calculation
  export let title: string;
  
  function handleClueClick(index: number) {
    activeClueIndex.set(index);
  }
  
  function isClueCompleted(index: number): boolean {
    return $validation.get(index) === true;
  }
  
  function isClueActive(index: number): boolean {
    return $activeClueIndex === index;
  }
  
  // Find the global index of a clue in the full clues array
  // Use motif_id as the primary identifier since it's unique
  function getGlobalIndex(clue: Clue): number {
    const index = allClues.findIndex(c => c.motif_id === clue.motif_id);
    if (index === -1) {
      console.warn('Could not find clue by motif_id, using fallback:', clue);
      // Fallback to position + orientation if motif_id match fails
      const fallbackIndex = allClues.findIndex(c => 
        c.position?.x === clue.position?.x && 
        c.position?.y === clue.position?.y && 
        c.orientation === clue.orientation
      );
      return fallbackIndex;
    }
    return index;
  }
</script>

<div class="clue-list">
  <h3 class="clue-title">{title}</h3>
  
  <div class="clues">
    {#each clues as clue, index (index)}
      {@const globalIndex = getGlobalIndex(clue)}
      <div
        class="clue-item {isClueActive(globalIndex) ? 'active' : ''} {isClueCompleted(globalIndex) ? 'completed' : ''}"
        on:click={() => handleClueClick(globalIndex)}
        on:keydown={(e) => e.key === 'Enter' && handleClueClick(globalIndex)}
        role="button"
        tabindex="0"
      >
        <div class="clue-content">
          <div class="clue-number-and-status">
            <span class="clue-number">{index + 1}.</span>
            {#if isClueCompleted(globalIndex)}
              <span class="check-mark">✓</span>
            {/if}
          </div>
          
          <div class="clue-text">
            <p class="clue-descriptor">{clue.clue || 'Unknown melody'}</p>
            <p class="clue-info">
              {clue.answer.length} notes • {clue.orientation}
            </p>
          </div>
        </div>
        
        <div class="clue-audio">
          {#if clue.motif?.pitch_sequence}
            <AudioPlayer
              pitchSequence={clue.motif.pitch_sequence}
              rhythmSequence={clue.motif.rhythm_sequence}
              clueIndex={globalIndex}
              compact={true}
            />
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .clue-list {
    background: #ffffff;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  
  .clue-title {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: #1f2937;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .clues {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .clue-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: #f9fafb;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .clue-item:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
    transform: translateX(4px);
  }
  
  .clue-item.active {
    background: #dbeafe;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .clue-item.completed {
    background: #d1fae5;
    border-color: #10b981;
  }
  
  .clue-item.completed.active {
    background: #a7f3d0;
  }
  
  .clue-content {
    flex: 1;
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
  }
  
  .clue-number-and-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 3rem;
  }
  
  .clue-number {
    font-weight: 700;
    color: #6b7280;
    font-size: 1rem;
  }
  
  .check-mark {
    color: #10b981;
    font-size: 1.25rem;
    font-weight: bold;
  }
  
  .clue-text {
    flex: 1;
  }
  
  .clue-descriptor {
    margin: 0 0 0.25rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
    line-height: 1.4;
  }
  
  .clue-info {
    margin: 0;
    font-size: 0.75rem;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .clue-audio {
    flex-shrink: 0;
  }
  
  @media (max-width: 640px) {
    .clue-list {
      padding: 1rem;
    }
    
    .clue-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }
    
    .clue-audio {
      width: 100%;
      display: flex;
      justify-content: center;
    }
  }
</style>

