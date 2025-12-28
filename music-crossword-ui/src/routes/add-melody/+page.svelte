<script lang="ts">
  import { onMount } from 'svelte';
  import { playMelodyWithRhythm, getAudioContext } from '$lib/utils/audioSynth';
  
  let title = '';
  let pitchSequence = '';
  let rhythmSequence = '';
  let difficulty = 3;
  let recognitionScore = 5;
  let submitting = false;
  let success = false;
  let error = '';
  let editingId: number | null = null;
  let motifs: any[] = [];
  let loadingMotifs = false;
  let showMotifList = false;
  
  const validPitches = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
  const validRhythms = ['1', '2', '2.', '4', '4.', '8', '8.', '16'];
  const validOctaves = [2, 3, 4, 5, 6, 7, 8];
  let selectedOctave = 4;
  
  onMount(() => {
    loadMotifs();
  });
  
  function loadMotifs() {
    loadingMotifs = true;
    fetch('/api/motifs')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          motifs = data.motifs || [];
        }
      })
      .catch(err => {
        console.error('Error loading motifs:', err);
      })
      .finally(() => {
        loadingMotifs = false;
      });
  }
  
  function selectMotif(motif: any) {
    editingId = motif.id;
    title = motif.descriptor || '';
    pitchSequence = motif.pitch_sequence || '';
    rhythmSequence = motif.rhythm_sequence || '';
    difficulty = motif.difficulty || 3;
    recognitionScore = motif.recognition_score || 5;
    showMotifList = false;
    error = '';
    success = false;
  }
  
  function startNew() {
    editingId = null;
    title = '';
    pitchSequence = '';
    rhythmSequence = '';
    difficulty = 3;
    recognitionScore = 5;
    error = '';
    success = false;
  }
  
  function handleSubmit() {
    if (!title.trim() || !pitchSequence.trim()) {
      error = 'Please fill in title and pitch sequence';
      return;
    }
    
    submitting = true;
    error = '';
    success = false;
    
    const url = '/api/motifs';
    const method = editingId ? 'PUT' : 'POST';
    const body = editingId
      ? {
          id: editingId,
          title: title.trim(),
          pitch_sequence: pitchSequence.trim(),
          rhythm_sequence: rhythmSequence.trim() || undefined,
          difficulty,
          recognition_score: recognitionScore
        }
      : {
          title: title.trim(),
          pitch_sequence: pitchSequence.trim(),
          rhythm_sequence: rhythmSequence.trim() || undefined,
          difficulty,
          recognition_score: recognitionScore
        };
    
    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          success = true;
          if (!editingId) {
            startNew();
          }
          loadMotifs();
        } else {
          error = data.error || (editingId ? 'Failed to update melody' : 'Failed to add melody');
        }
      })
      .catch(err => {
        error = err.message || 'Network error';
      })
      .finally(() => {
        submitting = false;
      });
  }
  
  async function previewMelody() {
    // Resume audio context on user interaction
    const context = getAudioContext();
    if (context.state === 'suspended') {
      await context.resume();
    }
    
    const pitches = pitchSequence.trim().split(/\s+/).filter(p => p);
    if (pitches.length === 0) return;
    
    const rhythms = rhythmSequence.trim() 
      ? rhythmSequence.trim().split(/\s+/).filter(r => r)
      : null;
    
    await playMelodyWithRhythm(pitches, rhythms, 120, 0.1, 4, 0.3);
  }
  
  function addPitch(pitch: string) {
    const pitchWithOctave = `${pitch}${selectedOctave}`;
    pitchSequence = (pitchSequence + ' ' + pitchWithOctave).trim();
  }
  
  function addRhythm(rhythm: string) {
    rhythmSequence = (rhythmSequence + ' ' + rhythm).trim();
  }
  
  async function playMotif(motif: any, event: MouseEvent) {
    event.stopPropagation(); // Prevent triggering selectMotif
    
    // Resume audio context on user interaction
    const context = getAudioContext();
    if (context.state === 'suspended') {
      await context.resume();
    }
    
    const pitches = (motif.pitch_sequence || '').trim().split(/\s+/).filter(p => p);
    if (pitches.length === 0) return;
    
    const rhythms = motif.rhythm_sequence 
      ? motif.rhythm_sequence.trim().split(/\s+/).filter(r => r)
      : null;
    
    await playMelodyWithRhythm(pitches, rhythms, 120, 0.1, 4, 0.3);
  }
</script>

<svelte:head>
  <title>Add Melody - Musical Crossword</title>
</svelte:head>

<div class="add-melody-page">
  <header class="page-header">
    <h1>{editingId ? 'Edit Melody' : 'Add Your Melody'}</h1>
    <p>{editingId ? 'Edit an existing melody' : 'Contribute a short melody that can be used in crossword puzzles'}</p>
  </header>
  
  <main class="form-container">
    {#if success}
      <div class="success-message">
        <p>✅ Melody {editingId ? 'updated' : 'added'} successfully!</p>
        <p>It will be available for future crossword puzzles.</p>
        <div class="success-actions">
          <button on:click={startNew} class="btn-secondary">
            Add New
          </button>
          <button on:click={() => { success = false; showMotifList = true; }} class="btn-secondary">
            Edit Another
          </button>
        </div>
      </div>
    {:else}
      <div class="mode-selector">
        <button
          type="button"
          on:click={() => { startNew(); showMotifList = false; }}
          class="mode-btn"
          class:active={!editingId && !showMotifList}
        >
          ➕ Add New Melody
        </button>
        <button
          type="button"
          on:click={() => { showMotifList = !showMotifList; }}
          class="mode-btn"
          class:active={showMotifList}
        >
          ✏️ Edit Existing
        </button>
      </div>
      
      {#if showMotifList}
        <div class="motif-list">
          <h2>Select a Melody to Edit</h2>
          {#if loadingMotifs}
            <p>Loading melodies...</p>
          {:else if motifs.length === 0}
            <p>No melodies found. Add one to get started!</p>
          {:else}
            <div class="motif-items">
              {#each motifs as motif}
                <div class="motif-item" role="button" tabindex="0" on:click={() => selectMotif(motif)} on:keydown={(e) => e.key === 'Enter' && selectMotif(motif)}>
                  <div class="motif-content">
                    <div class="motif-header">
                      <h3>{motif.descriptor || 'Untitled'}</h3>
                      <span class="motif-id">ID: {motif.id}</span>
                    </div>
                    <div class="motif-details">
                      <span class="motif-pitch">{motif.pitch_sequence}</span>
                      {#if motif.rhythm_sequence}
                        <span class="motif-rhythm">Rhythm: {motif.rhythm_sequence}</span>
                      {/if}
                      <span class="motif-meta">Difficulty: {motif.difficulty} | Recognition: {motif.recognition_score}</span>
                    </div>
                  </div>
                  <button
                    class="play-motif-btn"
                    on:click={(e) => playMotif(motif, e)}
                    title="Play melody"
                  >
                    ▶
                  </button>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {:else}
        <form on:submit|preventDefault={handleSubmit} class="melody-form">
        <div class="form-group">
          <label for="title">Title / Description *</label>
          <input
            id="title"
            type="text"
            bind:value={title}
            placeholder="e.g., My Favorite Song Opening"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="pitches">Pitch Sequence *</label>
          <p class="help-text">
            Enter notes separated by spaces (3-15 notes). Use C, D, E, F, G, A, B with # or b for sharps/flats. Include octave numbers (e.g., C4, F#5).
          </p>
          <div class="octave-selector">
            <label for="octave">Octave:</label>
            <select id="octave" bind:value={selectedOctave}>
              {#each validOctaves as octave}
                <option value={octave}>{octave}</option>
              {/each}
            </select>
          </div>
          <div class="input-with-buttons">
            <input
              id="pitches"
              type="text"
              bind:value={pitchSequence}
              placeholder="C4 D4 E4 F4 G4 A4 B4"
              required
            />
            <div class="pitch-buttons">
              {#each validPitches as pitch}
                <button
                  type="button"
                  on:click={() => addPitch(pitch)}
                  class="pitch-btn"
                >
                  {pitch}
                </button>
              {/each}
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label for="rhythms">Rhythm Sequence (Optional)</label>
          <p class="help-text">
            Enter rhythm values separated by spaces. Use: 1 (whole), 2 (half), 4 (quarter), 8 (eighth), 16 (sixteenth). Add . for dotted notes.
          </p>
          <div class="input-with-buttons">
            <input
              id="rhythms"
              type="text"
              bind:value={rhythmSequence}
              placeholder="4 4 8 8 2"
            />
            <div class="rhythm-buttons">
              {#each validRhythms as rhythm}
                <button
                  type="button"
                  on:click={() => addRhythm(rhythm)}
                  class="rhythm-btn"
                >
                  {rhythm}
                </button>
              {/each}
            </div>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="difficulty">Difficulty (1-5)</label>
            <input
              id="difficulty"
              type="number"
              bind:value={difficulty}
              min="1"
              max="5"
            />
          </div>
          
          <div class="form-group">
            <label for="recognition">Recognition Score (1-10)</label>
            <input
              id="recognition"
              type="number"
              bind:value={recognitionScore}
              min="1"
              max="10"
            />
            <p class="help-text">How recognizable is this melody? (10 = everyone knows it)</p>
          </div>
        </div>
        
        {#if error}
          <div class="error-message">
            {error}
          </div>
        {/if}
        
        <div class="form-actions">
          <button
            type="button"
            on:click={previewMelody}
            class="btn-preview"
            disabled={!pitchSequence.trim()}
          >
            🎵 Preview Melody
          </button>
          <button
            type="submit"
            class="btn-submit"
            disabled={submitting || !title.trim() || !pitchSequence.trim()}
          >
            {submitting ? (editingId ? 'Updating...' : 'Adding...') : (editingId ? 'Update Melody' : 'Add Melody')}
          </button>
          {#if editingId}
            <button
              type="button"
              on:click={startNew}
              class="btn-secondary"
            >
              Cancel Edit
            </button>
          {/if}
        </div>
      </form>
      {/if}
    {/if}
  </main>
  
  <footer class="page-footer">
    <a href="/">← Back to Puzzles</a>
  </footer>
</div>

<style>
  .add-melody-page {
    min-height: 100vh;
    padding: 2rem;
    max-width: 800px;
    margin: 0 auto;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  
  .page-header {
    text-align: center;
    color: white;
    margin-bottom: 2rem;
  }
  
  .page-header h1 {
    font-size: 2.5rem;
    margin: 0 0 0.5rem 0;
  }
  
  .page-header p {
    font-size: 1.125rem;
    opacity: 0.9;
  }
  
  .form-container {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
  }
  
  .success-message {
    text-align: center;
    padding: 2rem;
  }
  
  .success-message p {
    font-size: 1.125rem;
    color: #10b981;
    margin: 0.5rem 0;
  }
  
  .melody-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  
  .octave-selector {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  .octave-selector label {
    font-weight: 600;
    color: #1f2937;
  }
  
  .octave-selector select {
    padding: 0.5rem;
    border: 2px solid #e5e7eb;
    border-radius: 6px;
    font-size: 1rem;
    background: white;
    cursor: pointer;
  }
  
  .octave-selector select:focus {
    outline: none;
    border-color: #667eea;
  }
  
  label {
    font-weight: 600;
    color: #1f2937;
  }
  
  .help-text {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }
  
  input[type="text"],
  input[type="number"] {
    padding: 0.75rem;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.2s;
  }
  
  input[type="text"]:focus,
  input[type="number"]:focus {
    outline: none;
    border-color: #667eea;
  }
  
  .input-with-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .pitch-buttons,
  .rhythm-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .pitch-btn,
  .rhythm-btn {
    padding: 0.5rem 0.75rem;
    border: 2px solid #e5e7eb;
    border-radius: 6px;
    background: white;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s;
  }
  
  .pitch-btn:hover,
  .rhythm-btn:hover {
    border-color: #667eea;
    background: #f3f4f6;
  }
  
  .error-message {
    padding: 1rem;
    background: #fee2e2;
    border: 2px solid #ef4444;
    border-radius: 8px;
    color: #991b1b;
  }
  
  .form-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }
  
  .btn-preview,
  .btn-submit,
  .btn-secondary {
    padding: 0.875rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-preview {
    background: #f3f4f6;
    color: #1f2937;
  }
  
  .btn-preview:hover:not(:disabled) {
    background: #e5e7eb;
  }
  
  .btn-submit {
    flex: 1;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
  
  .btn-submit:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px -4px rgba(102, 126, 234, 0.5);
  }
  
  .btn-submit:disabled,
  .btn-preview:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn-secondary {
    background: #e5e7eb;
    color: #1f2937;
  }
  
  .btn-secondary:hover {
    background: #d1d5db;
  }
  
  .page-footer {
    text-align: center;
    margin-top: 2rem;
  }
  
  .page-footer a {
    color: white;
    text-decoration: none;
    font-weight: 600;
  }
  
  .page-footer a:hover {
    text-decoration: underline;
  }
  
  .mode-selector {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 2px solid #e5e7eb;
  }
  
  .mode-btn {
    flex: 1;
    padding: 0.875rem 1.5rem;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    background: white;
    color: #1f2937;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .mode-btn:hover {
    border-color: #667eea;
    background: #f3f4f6;
  }
  
  .mode-btn.active {
    border-color: #667eea;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
  
  .motif-list {
    margin-top: 1rem;
  }
  
  .motif-list h2 {
    margin-bottom: 1rem;
    color: #1f2937;
  }
  
  .motif-items {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-height: 400px;
    overflow-y: auto;
  }
  
  .motif-item {
    padding: 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    background: white;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  
  .motif-item:hover {
    border-color: #667eea;
    background: #f3f4f6;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px -2px rgba(102, 126, 234, 0.2);
  }
  
  .motif-content {
    flex: 1;
    min-width: 0;
  }
  
  .motif-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  .motif-header h3 {
    margin: 0;
    font-size: 1.125rem;
    color: #1f2937;
  }
  
  .motif-id {
    font-size: 0.875rem;
    color: #6b7280;
  }
  
  .motif-details {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.875rem;
  }
  
  .motif-pitch {
    font-weight: 600;
    color: #667eea;
  }
  
  .motif-rhythm {
    color: #6b7280;
  }
  
  .motif-meta {
    color: #9ca3af;
    font-size: 0.75rem;
  }
  
  .play-motif-btn {
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 1rem;
    flex-shrink: 0;
  }
  
  .play-motif-btn:hover {
    background: #2563eb;
    transform: scale(1.1);
  }
  
  .play-motif-btn:active {
    transform: scale(0.95);
  }
  
  .success-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 1rem;
  }
  
  @media (max-width: 768px) {
    .form-row {
      grid-template-columns: 1fr;
    }
    
    .form-actions {
      flex-direction: column;
    }
    
    .mode-selector {
      flex-direction: column;
    }
    
    .motif-items {
      max-height: 300px;
    }
  }
</style>

