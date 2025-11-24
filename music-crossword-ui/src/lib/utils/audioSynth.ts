/**
 * Web Audio API synthesis for playing melodies
 * Converts musical notes to frequencies and plays them
 */

let audioContext: AudioContext | null = null;

/**
 * Get or create the audio context
 * Must be called after user interaction for browser autoplay policies
 */
export function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

/**
 * Convert pitch class to frequency (A4 = 440Hz)
 * @param pitch - Note name (C, C#, D, etc.)
 * @param octave - Octave number (default 4)
 */
function pitchToFrequency(pitch: string, octave: number = 4): number {
  const pitchMap: Record<string, number> = {
    'C': 0, 'C#': 1, 'Db': 1,
    'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4,
    'F': 5, 'F#': 6, 'Gb': 6,
    'G': 7, 'G#': 8, 'Ab': 8,
    'A': 9, 'A#': 10, 'Bb': 10,
    'B': 11
  };
  
  // Normalize sharp symbol
  const normalizedPitch = pitch.replace('♯', '#');
  const semitones = (pitchMap[normalizedPitch] ?? 0) + (octave - 4) * 12 - 9; // A4 as reference
  return 440 * Math.pow(2, semitones / 12);
}

/**
 * Play a single note with ADSR envelope
 * @param pitch - Note name (C, C#, D, etc.)
 * @param duration - Note duration in seconds
 * @param octave - Octave number (default 4)
 * @param volume - Volume (0-1, default 0.3)
 */
export function playNote(
  pitch: string,
  duration: number = 0.5,
  octave: number = 4,
  volume: number = 0.3
): void {
  const context = getAudioContext();
  const frequency = pitchToFrequency(pitch, octave);
  
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  
  // Use triangle wave for a softer, more musical sound
  oscillator.type = 'triangle';
  oscillator.frequency.value = frequency;
  
  // ADSR envelope (simple attack-decay-sustain-release)
  const now = context.currentTime;
  const attackTime = 0.01;
  const decayTime = 0.1;
  const sustainLevel = volume * 0.7;
  const releaseTime = 0.1;
  
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(volume, now + attackTime); // Attack
  gainNode.gain.linearRampToValueAtTime(sustainLevel, now + attackTime + decayTime); // Decay
  gainNode.gain.setValueAtTime(sustainLevel, now + duration - releaseTime); // Sustain
  gainNode.gain.linearRampToValueAtTime(0, now + duration); // Release
  
  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  
  oscillator.start(now);
  oscillator.stop(now + duration);
}

/**
 * Convert Kern rhythm notation to duration in seconds
 * @param rhythm - Kern rhythm value (e.g., "4", "8", "2.", "16")
 * @param tempo - Tempo in BPM (beats per minute)
 * @returns Duration in seconds
 */
export function rhythmToDuration(rhythm: string, tempo: number = 120): number {
  const beatsPerSecond = tempo / 60;
  
  // Parse rhythm value (handle dots)
  let baseValue: number;
  let isDotted = false;
  
  if (rhythm.endsWith('.')) {
    baseValue = parseFloat(rhythm.slice(0, -1));
    isDotted = true;
  } else {
    baseValue = parseFloat(rhythm);
  }
  
  // Calculate beats: whole note (1) = 4 beats, quarter note (4) = 1 beat
  let beats = 4 / baseValue;
  
  // Dotted notes are 1.5x longer
  if (isDotted) {
    beats *= 1.5;
  }
  
  // Convert to seconds
  return beats / beatsPerSecond;
}

/**
 * Play a melody with rhythm (sequence of notes with rhythm data)
 * @param pitchSequence - Array of note names
 * @param rhythmSequence - Array of rhythm values (Kern notation) or null for equal durations
 * @param tempo - Tempo in BPM (default 120)
 * @param gap - Gap between notes as a fraction of note duration (default 0.1)
 * @param octave - Octave number
 * @param volume - Volume (0-1)
 */
export async function playMelodyWithRhythm(
  pitchSequence: string[],
  rhythmSequence: string[] | null,
  tempo: number = 120,
  gap: number = 0.1,
  octave: number = 4,
  volume: number = 0.3
): Promise<void> {
  const context = getAudioContext();
  let startTime = context.currentTime;
  
  for (let i = 0; i < pitchSequence.length; i++) {
    const pitch = pitchSequence[i];
    if (!pitch.trim()) continue;
    
    // Calculate duration based on rhythm or use default
    let duration: number;
    if (rhythmSequence && rhythmSequence[i]) {
      duration = rhythmToDuration(rhythmSequence[i], tempo);
    } else {
      // Default to quarter notes if no rhythm data
      duration = rhythmToDuration('4', tempo);
    }
    
    const frequency = pitchToFrequency(pitch, octave);
    
    // Create oscillator for this note
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    // Use triangle wave for a softer, more musical sound
    oscillator.type = 'triangle';
    oscillator.frequency.value = frequency;
    
    // ADSR envelope (simple attack-decay-sustain-release)
    const attackTime = 0.01;
    const decayTime = 0.1;
    const sustainLevel = volume * 0.7;
    const releaseTime = Math.min(0.1, duration * 0.2);
    const noteDuration = duration * (1 - gap); // Apply gap
    
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + attackTime); // Attack
    gainNode.gain.linearRampToValueAtTime(sustainLevel, startTime + attackTime + decayTime); // Decay
    gainNode.gain.setValueAtTime(sustainLevel, startTime + noteDuration - releaseTime); // Sustain
    gainNode.gain.linearRampToValueAtTime(0, startTime + noteDuration); // Release
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + noteDuration);
    
    // Move to next note
    startTime += duration;
  }
  
  // Wait for all notes to finish
  const totalDuration = (startTime - context.currentTime) * 1000;
  await new Promise(resolve => setTimeout(resolve, totalDuration));
}

/**
 * Play a melody (sequence of notes) with equal duration
 * @param pitchSequence - Array of note names
 * @param noteDuration - Duration of each note in seconds
 * @param gap - Gap between notes in seconds
 * @param octave - Octave number
 * @param volume - Volume (0-1)
 */
export async function playMelody(
  pitchSequence: string[],
  noteDuration: number = 0.4,
  gap: number = 0.05,
  octave: number = 4,
  volume: number = 0.3
): Promise<void> {
  for (const pitch of pitchSequence) {
    if (pitch.trim()) {
      playNote(pitch, noteDuration, octave, volume);
      await new Promise(resolve => setTimeout(resolve, (noteDuration + gap) * 1000));
    }
  }
}

/**
 * Play a hint - first N notes of a melody
 * @param pitchSequence - Array of note names
 * @param rhythmSequence - Array of rhythm values or null
 * @param numNotes - Number of notes to play (1, 3, or all)
 * @param tempo - Tempo in BPM
 */
export async function playHint(
  pitchSequence: string[],
  rhythmSequence: string[] | null,
  numNotes: number,
  tempo: number = 120
): Promise<void> {
  const notes = numNotes === -1 ? pitchSequence : pitchSequence.slice(0, numNotes);
  const rhythms = rhythmSequence && numNotes !== -1 ? rhythmSequence.slice(0, numNotes) : rhythmSequence;
  await playMelodyWithRhythm(notes, rhythms, tempo, 0.1);
}

/**
 * Stop all currently playing audio
 */
export function stopAudio(): void {
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
}

