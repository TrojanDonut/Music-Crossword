<script lang="ts">
  import { completionStatus } from '$lib/stores/userInput';
  import { onMount } from 'svelte';
  
  let showConfetti = false;
  
  $: if ($completionStatus.isComplete && !showConfetti) {
    showConfetti = true;
    setTimeout(() => {
      showConfetti = false;
    }, 3000);
  }
</script>

<div class="progress-indicator">
  <div class="progress-header">
    <h2 class="progress-title">🎵 Musical Crossword</h2>
    <div class="progress-stats">
      <span class="stat-number">{$completionStatus.solved}</span>
      <span class="stat-separator">/</span>
      <span class="stat-total">{$completionStatus.total}</span>
      <span class="stat-label">melodies solved</span>
    </div>
  </div>
  
  <div class="progress-bar-container">
    <div
      class="progress-bar"
      style="width: {$completionStatus.percentage}%"
    ></div>
  </div>
  
  <div class="progress-percentage">
    {$completionStatus.percentage}% Complete
  </div>
  
  {#if $completionStatus.isComplete}
    <div class="completion-message {showConfetti ? 'show' : ''}">
      🎉 Puzzle Complete! 🎉
    </div>
  {/if}
</div>

{#if showConfetti}
  <div class="confetti-container">
    {#each Array(50) as _, i}
      <div class="confetti" style="
        left: {Math.random() * 100}%;
        animation-delay: {Math.random() * 0.5}s;
        animation-duration: {2 + Math.random()}s;
        background: hsl({Math.random() * 360}, 70%, 60%);
      "></div>
    {/each}
  </div>
{/if}

<style>
  .progress-indicator {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 10px 25px -5px rgba(102, 126, 234, 0.4);
    position: relative;
    overflow: hidden;
  }
  
  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .progress-title {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 800;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .progress-stats {
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
    font-weight: 600;
  }
  
  .stat-number {
    font-size: 2rem;
    font-weight: 800;
  }
  
  .stat-separator {
    font-size: 1.5rem;
    opacity: 0.7;
  }
  
  .stat-total {
    font-size: 1.5rem;
    opacity: 0.9;
  }
  
  .stat-label {
    margin-left: 0.5rem;
    font-size: 0.875rem;
    opacity: 0.9;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .progress-bar-container {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 999px;
    height: 1.25rem;
    overflow: hidden;
    margin-bottom: 0.75rem;
  }
  
  .progress-bar {
    background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
    height: 100%;
    border-radius: 999px;
    transition: width 0.5s ease;
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
  }
  
  .progress-percentage {
    text-align: center;
    font-size: 1rem;
    font-weight: 600;
    opacity: 0.95;
  }
  
  .completion-message {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    font-size: 2rem;
    font-weight: 900;
    text-align: center;
    background: rgba(255, 255, 255, 0.95);
    color: #667eea;
    padding: 2rem 3rem;
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    z-index: 100;
    transition: transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }
  
  .completion-message.show {
    transform: translate(-50%, -50%) scale(1);
  }
  
  .confetti-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1000;
    overflow: hidden;
  }
  
  .confetti {
    position: absolute;
    width: 10px;
    height: 10px;
    top: -10px;
    border-radius: 50%;
    animation: confetti-fall linear forwards;
  }
  
  @keyframes confetti-fall {
    to {
      transform: translateY(100vh) rotate(720deg);
      opacity: 0;
    }
  }
  
  @media (max-width: 640px) {
    .progress-indicator {
      padding: 1.5rem;
    }
    
    .progress-title {
      font-size: 1.5rem;
    }
    
    .stat-number {
      font-size: 1.5rem;
    }
    
    .completion-message {
      font-size: 1.5rem;
      padding: 1.5rem 2rem;
    }
  }
</style>

