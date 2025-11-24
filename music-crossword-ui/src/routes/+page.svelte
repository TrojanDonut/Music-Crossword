<script lang="ts">
  import { onMount } from 'svelte';
  import type { Puzzle } from '$lib/types/puzzle';
  
  let puzzles: Puzzle[] = [];
  let loading = true;
  let error = '';
  
  onMount(async () => {
    try {
      const response = await fetch('/api/puzzles');
      const data = await response.json();
      
      if (data.success) {
        puzzles = data.puzzles;
      } else {
        error = data.error || 'Failed to load puzzles';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      loading = false;
    }
  });
  
  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  function getDifficultyLabel(difficulty: number): string {
    const labels = ['Easy', 'Medium', 'Hard', 'Expert', 'Master'];
    return labels[difficulty - 1] || 'Unknown';
  }
  
  function getDifficultyColor(difficulty: number): string {
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
    return colors[difficulty - 1] || '#6b7280';
  }
</script>

<svelte:head>
  <title>Musical Crossword Puzzles</title>
  <meta name="description" content="Solve musical crossword puzzles by recognizing melodies" />
</svelte:head>

<div class="home-page">
  <header class="hero">
    <div class="hero-content">
      <h1 class="hero-title">🎵 Musical Crossword</h1>
      <p class="hero-subtitle">
        Solve crossword puzzles by recognizing famous melodies
      </p>
      <p class="hero-description">
        Each "word" is a melody. Listen, recognize, and fill in the notes!
      </p>
    </div>
  </header>
  
  <main class="main-content">
    {#if loading}
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading puzzles...</p>
      </div>
    {:else if error}
      <div class="error-state">
        <p class="error-icon">⚠️</p>
        <p class="error-message">{error}</p>
        <button on:click={() => window.location.reload()} class="retry-btn">
          Try Again
        </button>
      </div>
    {:else if puzzles.length === 0}
      <div class="empty-state">
        <p class="empty-icon">🎹</p>
        <p class="empty-message">No puzzles available yet</p>
        <p class="empty-hint">
          Generate a puzzle using the crossword generator script
        </p>
      </div>
    {:else}
      <div class="puzzles-section">
        <h2 class="section-title">Available Puzzles ({puzzles.length})</h2>
        
        <div class="puzzle-grid">
          {#each puzzles as puzzle}
            <a href="/puzzle/{puzzle.id}" class="puzzle-card">
              <div class="puzzle-header">
                <span
                  class="puzzle-difficulty"
                  style="background-color: {getDifficultyColor(puzzle.difficulty)}"
                >
                  {getDifficultyLabel(puzzle.difficulty)}
                </span>
                <span class="puzzle-id">#{puzzle.id}</span>
              </div>
              
              <div class="puzzle-info">
                <div class="info-item">
                  <span class="info-label">Grid Size</span>
                  <span class="info-value">
                    {puzzle.layout.rows} × {puzzle.layout.cols}
                  </span>
                </div>
                
                <div class="info-item">
                  <span class="info-label">Melodies</span>
                  <span class="info-value">
                    {puzzle.layout.result.length}
                  </span>
                </div>
                
                <div class="info-item">
                  <span class="info-label">Created</span>
                  <span class="info-value">
                    {formatDate(puzzle.created_at)}
                  </span>
                </div>
              </div>
              
              <div class="puzzle-action">
                <button class="play-button">
                  Play Puzzle →
                </button>
              </div>
            </a>
          {/each}
        </div>
      </div>
    {/if}
  </main>
  
  <footer class="footer">
    <p>Made with ♪ for music lovers</p>
  </footer>
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
  }
  
  .home-page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  
  .hero {
    padding: 4rem 2rem 3rem;
    text-align: center;
    color: white;
  }
  
  .hero-content {
    max-width: 800px;
    margin: 0 auto;
  }
  
  .hero-title {
    font-size: 3.5rem;
    font-weight: 900;
    margin: 0 0 1rem 0;
    text-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    letter-spacing: -0.02em;
  }
  
  .hero-subtitle {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 0.75rem 0;
    opacity: 0.95;
  }
  
  .hero-description {
    font-size: 1.125rem;
    opacity: 0.9;
    margin: 0;
  }
  
  .main-content {
    flex: 1;
    padding: 2rem;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
  }
  
  .loading-state,
  .error-state,
  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    background: white;
    border-radius: 16px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  }
  
  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid #e5e7eb;
    border-top-color: #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  .error-icon,
  .empty-icon {
    font-size: 4rem;
    margin: 0 0 1rem 0;
  }
  
  .error-message,
  .empty-message {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 0.5rem 0;
  }
  
  .empty-hint {
    color: #6b7280;
    margin: 0 0 1rem 0;
  }
  
  .retry-btn {
    background: #667eea;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .retry-btn:hover {
    background: #5568d3;
    transform: translateY(-2px);
  }
  
  .puzzles-section {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  }
  
  .section-title {
    margin: 0 0 2rem 0;
    font-size: 2rem;
    font-weight: 800;
    color: #1f2937;
  }
  
  .puzzle-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }
  
  .puzzle-card {
    background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    text-decoration: none;
    color: inherit;
    transition: all 0.3s ease;
  }
  
  .puzzle-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px -4px rgba(102, 126, 234, 0.3);
    border-color: #667eea;
  }
  
  .puzzle-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .puzzle-difficulty {
    display: inline-block;
    padding: 0.375rem 0.75rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: white;
  }
  
  .puzzle-id {
    font-size: 0.875rem;
    font-weight: 600;
    color: #6b7280;
  }
  
  .puzzle-info {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .info-label {
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
  }
  
  .info-value {
    font-size: 1rem;
    font-weight: 700;
    color: #1f2937;
  }
  
  .puzzle-action {
    margin-top: auto;
  }
  
  .play-button {
    width: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0.875rem;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .play-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px -4px rgba(102, 126, 234, 0.5);
  }
  
  .play-button:active {
    transform: translateY(0);
  }
  
  .footer {
    text-align: center;
    padding: 2rem;
    color: white;
    opacity: 0.8;
    font-size: 0.875rem;
  }
  
  @media (max-width: 768px) {
    .hero-title {
      font-size: 2.5rem;
    }
    
    .hero-subtitle {
      font-size: 1.25rem;
    }
    
    .puzzle-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
