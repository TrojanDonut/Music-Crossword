# Rhythm Data Guide

## Overview

The music crossword database now includes rhythm information for melodies. Without rhythm, all notes play with equal duration, making melodies sound robotic and unrecognizable. With rhythm data, melodies sound natural and musical.

## Rhythm Notation

We use **Kern rhythm notation**, which is simple and intuitive:

| Value | Duration | Example |
|-------|----------|---------|
| `1` | Whole note | 4 beats |
| `2` | Half note | 2 beats |
| `4` | Quarter note | 1 beat |
| `8` | Eighth note | 0.5 beats |
| `16` | Sixteenth note | 0.25 beats |
| `4.` | Dotted quarter | 1.5 beats |
| `2.` | Dotted half | 3 beats |

### Example: Beethoven's 5th Symphony

```json
{
  "pitch_sequence": "G G G Eb F F F D",
  "rhythm_sequence": "8 8 8 2 8 8 8 2"
}
```

This creates the famous "short-short-short-LONG" rhythm: ♪♪♪♩ ♪♪♪♩

## Database Structure

### Schema

```sql
CREATE TABLE motifs (
    ...
    pitch_sequence TEXT NOT NULL,      -- "C D E F G"
    rhythm_sequence TEXT,               -- "4 4 4 4 4"
    ...
);
```

### Data Format

- **pitch_sequence**: Space-separated pitch classes (e.g., "E E F G G F E D")
- **rhythm_sequence**: Space-separated duration values (e.g., "4 4 4 4 4 4 4 4")
- Both sequences must have the **same number of elements**

## Using Rhythm in Audio Playback

### Parsing Rhythm Data

```javascript
// Parse pitch and rhythm from database
const pitchSequence = "C D E F G";
const rhythmSequence = "4 4 8 8 2";

const pitches = pitchSequence.split(' ');      // ["C", "D", "E", "F", "G"]
const rhythms = rhythmSequence.split(' ');     // ["4", "4", "8", "8", "2"]
```

### Converting to Duration (seconds)

```javascript
// Assuming tempo = 120 BPM (2 beats per second)
function rhythmToDuration(rhythm, tempo = 120) {
  const beatsPerSecond = tempo / 60;
  
  // Parse rhythm value (handle dots)
  let baseValue, isDotted = false;
  if (rhythm.endsWith('.')) {
    baseValue = parseFloat(rhythm.slice(0, -1));
    isDotted = true;
  } else {
    baseValue = parseFloat(rhythm);
  }
  
  // Calculate beats: whole note (1) = 4 beats
  let beats = 4 / baseValue;
  
  // Dotted notes are 1.5x longer
  if (isDotted) {
    beats *= 1.5;
  }
  
  // Convert to seconds
  return beats / beatsPerSecond;
}

// Examples at 120 BPM:
rhythmToDuration("4")   // 0.5 seconds (quarter note)
rhythmToDuration("8")   // 0.25 seconds (eighth note)
rhythmToDuration("2")   // 1.0 seconds (half note)
rhythmToDuration("4.")  // 0.75 seconds (dotted quarter)
```

### Web Audio API Example

```javascript
function playMelody(pitches, rhythms, tempo = 120) {
  const audioContext = new AudioContext();
  let startTime = audioContext.currentTime;
  
  for (let i = 0; i < pitches.length; i++) {
    const frequency = pitchToFrequency(pitches[i]);
    const duration = rhythmToDuration(rhythms[i], tempo);
    
    // Create oscillator for this note
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.frequency.value = frequency;
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // ADSR envelope for natural sound
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);  // Attack
    gainNode.gain.linearRampToValueAtTime(0.2, startTime + duration * 0.8);  // Sustain
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);  // Release
    
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
    
    // Move to next note
    startTime += duration;
  }
}

// Convert pitch class to frequency (A4 = 440 Hz)
function pitchToFrequency(pitchClass, octave = 4) {
  const pitchMap = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
    'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
  };
  
  const semitones = pitchMap[pitchClass];
  const midiNote = (octave + 1) * 12 + semitones;
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

// Usage:
const pitches = ["E", "E", "F", "G", "G", "F", "E", "D"];
const rhythms = ["4", "4", "4", "4", "4", "4", "4", "4"];
playMelody(pitches, rhythms, 120);
```

## Comparison: With vs Without Rhythm

### ❌ Without Rhythm (Robotic)

```javascript
// All notes same duration = 0.5 seconds
C: ━━ D: ━━ E: ━━ F: ━━ G: ━━
```

Sounds monotonous and unnatural. Melody is hard to recognize.

### ✅ With Rhythm (Musical)

```javascript
// Beethoven's 5th: "8 8 8 2"
G: ━ G: ━ G: ━ Eb: ━━━━━━━━
   (short)(short)(short)(LONG!)
```

Instantly recognizable! The rhythm carries the musical character.

## Migration Guide

### For Existing Databases

1. **Run migration script**:
   ```bash
   python3 migrate_add_rhythm.py
   ```

2. **Re-import curated themes** (with rhythm data):
   ```bash
   python3 import_curated_themes.py
   ```

3. **Re-run ETL** (to extract rhythm from Kern files):
   ```bash
   python3 etl_essen.py --limit 50
   ```

### For New Projects

Just run `db_init.py` - the schema already includes `rhythm_sequence`.

## Adding Rhythm to Custom Themes

When adding custom themes to `curated_themes.json`:

```json
{
  "id": "my_theme",
  "title": "My Custom Theme",
  "pitch_sequence": "C D E F G",
  "rhythm_sequence": "4 4 8 8 2",  // ← Add this!
  "length": 5,
  ...
}
```

**Important**: The rhythm sequence must have the same number of elements as the pitch sequence.

## SvelteKit UI Integration

In your `AudioPlayer.svelte` component:

```javascript
// Load motif from database
const motif = await fetch(`/api/motifs/${id}`).then(r => r.json());

// Play with rhythm
playMelody(
  motif.pitch_sequence.split(' '),
  motif.rhythm_sequence.split(' '),
  120  // tempo (BPM)
);
```

## Performance Tips

### Adjust Tempo for Difficulty

```javascript
// Slower = easier to recognize
playMelody(pitches, rhythms, 80);   // Slow (learning mode)
playMelody(pitches, rhythms, 120);  // Normal
playMelody(pitches, rhythms, 160);  // Fast (challenge mode)
```

### Relative Durations

If you don't have exact rhythm data, use relative durations:

```javascript
// Simple pattern: mostly quarter notes
const defaultRhythm = pitches.map(() => "4");

// Last note longer (common in phrases)
defaultRhythm[defaultRhythm.length - 1] = "2";
```

## Examples from Curated Themes

### Happy Birthday
```
Pitch:  G G A G C B
Rhythm: 8. 16 4 4 4 2
        ↑  ↑ (swing rhythm + long ending)
```

### Jaws Theme
```
Pitch:  E F E F E F E F
Rhythm: 8 8 8 8 8 8 8 8
        (accelerating danger - equal eighths)
```

### Super Mario
```
Pitch:  E E E C E G G
Rhythm: 8 8 8 16 16 4 2
        (bouncy, energetic)
```

## Troubleshooting

### ❌ "Rhythm and pitch sequences don't match"

```python
# Check lengths
pitch_count = len(pitch_sequence.split())
rhythm_count = len(rhythm_sequence.split())
assert pitch_count == rhythm_count, "Mismatch!"
```

### ❌ "Notes sound too fast/slow"

Adjust the tempo parameter:
- Too fast: Lower tempo (60-100 BPM)
- Too slow: Raise tempo (140-180 BPM)
- Standard: 120 BPM

### ❌ "Dotted rhythms not working"

Make sure to handle the dot character:

```javascript
if (rhythm.endsWith('.')) {
  duration *= 1.5;  // Dotted notes are 1.5x longer
}
```

## Resources

- **Kern Notation**: http://www.humdrum.org/guide/ch02/
- **Web Audio API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- **Music Theory**: https://www.musictheory.net/lessons/12

---

**Version**: 1.0  
**Author**: DAP Project Team  
**Last Updated**: November 2024

