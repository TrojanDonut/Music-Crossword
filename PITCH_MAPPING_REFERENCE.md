# Musical Note to Grid Letter Mapping

## Quick Reference

This document explains how musical notes are encoded as letters in the crossword grid.

---

## Why Do We Need This Mapping?

The crossword layout generator expects single-character "letters" to work with. Since we have 12 chromatic notes (C, C#, D, D#, E, F, F#, G, G#, A, A#, B), we map each to a unique letter A-N.

---

## Complete Mapping Table

| Musical Note | Grid Letter | Frequency (A4=440Hz) | Note Type |
|--------------|-------------|----------------------|-----------|
| **C**        | **C**       | ~261.63 Hz          | Natural   |
| **C#/Db**    | **D**       | ~277.18 Hz          | Sharp/Flat|
| **D**        | **E**       | ~293.66 Hz          | Natural   |
| **D#/Eb**    | **F**       | ~311.13 Hz          | Sharp/Flat|
| **E**        | **G**       | ~329.63 Hz          | Natural   |
| **F**        | **H**       | ~349.23 Hz          | Natural   |
| **F#/Gb**    | **I**       | ~369.99 Hz          | Sharp/Flat|
| **G**        | **J**       | ~392.00 Hz          | Natural   |
| **G#/Ab**    | **K**       | ~415.30 Hz          | Sharp/Flat|
| **A**        | **L**       | ~440.00 Hz          | Natural   |
| **A#/Bb**    | **M**       | ~466.16 Hz          | Sharp/Flat|
| **B**        | **N**       | ~493.88 Hz          | Natural   |

---

## Example Melodies

### Star Wars Main Theme (Opening)
```
Musical Notes: G  G  G  E♭ B♭ G  E♭ B♭ G
Grid Letters:  J  J  J  F  M  J  F  M  J
```

### Beethoven's 5th Symphony
```
Musical Notes: G  G  G  E♭ F  F  F  D
Grid Letters:  J  J  J  F  H  H  H  E
```

### Happy Birthday
```
Musical Notes: G  G  A  G  C  B
Grid Letters:  J  J  L  J  C  N
```

### Jaws Theme
```
Musical Notes: E  F  E  F  E  F  E  F
Grid Letters:  G  H  G  H  G  H  G  H
```

---

## Understanding the Grid

When you see a crossword puzzle like this:

```
░ ░ ░ J ░
░ ░ ░ J ░
C E F H J
```

It translates to:

```
░ ░ ░ G ░
░ ░ ░ G ░
C D D# F G
```

---

## Why This Specific Mapping?

The mapping was chosen to:
1. **Keep natural notes recognizable**: C stays C, etc.
2. **Use consecutive letters**: Makes it easier to see the pattern
3. **Avoid confusion**: Using letters that aren't already musical notes where possible

### Alternative Considered (Not Used)
We could use numbers (0-11) or symbols, but letters work better with standard crossword algorithms.

---

## Implementation in Code

### JavaScript (crossword_generator.js)
```javascript
const pitchMap = {
  'C': 'C',
  'C#': 'D',
  'Db': 'D',
  'D': 'E',
  'D#': 'F',
  'Eb': 'F',
  'E': 'G',
  'F': 'H',
  'F#': 'I',
  'Gb': 'I',
  'G': 'J',
  'G#': 'K',
  'Ab': 'K',
  'A': 'L',
  'A#': 'M',
  'Bb': 'M',
  'B': 'N'
};
```

### TypeScript (UI Implementation)
```typescript
export const PITCH_MAP: Record<string, string> = {
  'C': 'C',
  'C#': 'D',
  'Db': 'D',
  'D': 'E',
  'D#': 'F',
  'Eb': 'F',
  'E': 'G',
  'F': 'H',
  'F#': 'I',
  'Gb': 'I',
  'G': 'J',
  'G#': 'K',
  'Ab': 'K',
  'A': 'L',
  'A#': 'M',
  'Bb': 'M',
  'B': 'N'
};

// Reverse mapping for display
export const REVERSE_PITCH_MAP: Record<string, string> = {
  'C': 'C',
  'D': 'C#',
  'E': 'D',
  'F': 'D#',
  'G': 'E',
  'H': 'F',
  'I': 'F#',
  'J': 'G',
  'K': 'G#',
  'L': 'A',
  'M': 'A#',
  'N': 'B'
};
```

### Python (Parser)
```python
PITCH_MAP = {
    'C': 'C',
    'C#': 'D',
    'Db': 'D',
    'D': 'E',
    'D#': 'F',
    'Eb': 'F',
    'E': 'G',
    'F': 'H',
    'F#': 'I',
    'Gb': 'I',
    'G': 'J',
    'G#': 'K',
    'Ab': 'K',
    'A': 'L',
    'A#': 'M',
    'Bb': 'M',
    'B': 'N'
}
```

---

## User-Facing Display

### In the UI, Show Musical Notes (Not Letters)

**DO THIS:**
```
┌───┬───┬───┐
│ G │ A │ B │  <- Show actual note names
└───┴───┴───┘
```

**NOT THIS:**
```
┌───┬───┬───┐
│ J │ L │ N │  <- Too confusing for users!
└───┴───┴───┘
```

### Implementation Strategy

1. **Internal Storage**: Use grid letters (J, L, N)
2. **Display**: Convert to notes (G, A, B) with proper symbols (♯, ♭)
3. **Input**: User selects notes (G, A, B), convert to letters internally

---

## Common Questions

### Q: Why not just use note names directly?
**A:** The crossword layout generator expects single characters. "C#" is two characters, which would break the algorithm.

### Q: Can I change the mapping?
**A:** Yes, but you'd need to update:
1. `crossword_generator.js` (generation)
2. UI code (display/input)
3. Validation logic
4. All existing puzzles in database would become invalid

### Q: What about enharmonic equivalents (C# vs Db)?
**A:** They map to the same letter (both → D). Musically they're the same pitch in 12-tone equal temperament.

### Q: What about octaves?
**A:** We ignore octaves for the crossword. All Cs are just "C", regardless of octave. This makes melodies more recognizable and puzzles solvable.

---

## Testing Your Understanding

### Exercise 1: Convert Notes to Grid
Convert this melody: `C D E C E G`

<details>
<summary>Answer</summary>

Grid: `C E G C G J`
</details>

### Exercise 2: Convert Grid to Notes
What melody is this? `J J J F H H H E`

<details>
<summary>Answer</summary>

Notes: `G G G D# F F F D`  
(This is Beethoven's 5th Symphony!)
</details>

### Exercise 3: Find the Intersection
Two melodies:
- Across: `C E G J` (C D E G)
- Down: `J L N` (G A B)

At what note do they intersect?

<details>
<summary>Answer</summary>

They intersect at **J** = **G**  
The across melody ends with G, and the down melody starts with G.
</details>

---

## Visual Reference: Piano Keyboard

```
┌─┬─┬─┐ ┌─┬─┬─┐ ┌─┬─┬─┬─┐
│ │C│ │ │D│ │ │ │F│ │G│A│
│ │#│ │ │#│ │ │ │#│ │#│#│
│ │D│ │ │F│ │ │ │I│ │K│M│  <- Grid letters (sharps)
├─┼─┼─┤ ├─┼─┼─┤ ├─┼─┼─┼─┤
│C│ │D│ │E│F│ │G│ │A│ │B│
│ │E│ │ │G│ │H│ │J│ │L│ │N  <- Grid letters (naturals)
└─┴─┴─┘ └─┴─┴─┘ └─┴─┴─┴─┘
```

---

## Summary

- **12 chromatic notes** → **12 letters (C-N)**
- **Internal**: Use grid letters for algorithms
- **Display**: Show musical notes for users
- **Always convert** between formats at the boundary

**Key Takeaway:** When debugging, if you see "J" in the grid, remember it's **G**! 🎵

---

*Last updated: November 24, 2024*

