# Changelog - Musical Crossword UI

## [1.1.0] - 2024-11-24

### 🎵 Added - Rhythm Support

#### Major Features
- **Natural Melody Playback**: Melodies now play with proper rhythm instead of robotic equal durations
- **Tempo Controls**: Users can adjust playback speed (60-180 BPM) with slider and presets
- **Rhythm-Aware Hints**: First note and 3-note hints now maintain correct rhythm timing

#### Technical Changes

##### Type Definitions (`src/lib/types/puzzle.ts`)
- Added `rhythm_sequence: string | null` to `Motif` interface

##### Database Layer (`src/lib/utils/database.ts`)
- Updated `getMotif()` to fetch `rhythm_sequence` from database
- Updated `getMotifs()` to fetch `rhythm_sequence` from database

##### Audio Synthesis (`src/lib/utils/audioSynth.ts`)
- **NEW**: `rhythmToDuration(rhythm, tempo)` - Converts Kern notation to seconds
- **NEW**: `playMelodyWithRhythm(pitches, rhythms, tempo, ...)` - Plays melody with rhythm
- **UPDATED**: `playHint(...)` - Now supports rhythm and tempo parameters

##### Components
- **AudioPlayer.svelte** - Enhanced with:
  - `rhythmSequence` prop for rhythm data
  - Tempo slider (60-180 BPM)
  - Preset buttons (Slow 80, Normal 120, Fast 160 BPM)
  - Visual tempo indicator
  - Rhythm-aware playback for all melodies
  
- **ClueList.svelte** - Updated to pass `rhythmSequence` to AudioPlayer
- **puzzle/[id]/+page.svelte** - Updated to pass `rhythmSequence` to AudioPlayer

#### User-Facing Changes
- 🎼 Melodies sound natural and recognizable (e.g., Beethoven's 5th: ♪♪♪♩)
- 🎚️ Tempo slider for adjusting playback speed
- ⚡ Preset tempo buttons (Slow/Normal/Fast)
- 🎵 Hints maintain musical rhythm
- 📱 Mobile-friendly controls

#### Documentation
- **RHYTHM_INTEGRATION.md** - Complete UI integration guide
- Updated README.md references

### Technical Details

#### Rhythm Notation Support
Supports Kern rhythm notation:
- Whole notes: `1`
- Half notes: `2`
- Quarter notes: `4`
- Eighth notes: `8`
- Sixteenth notes: `16`
- Dotted notes: `4.`, `2.`, etc.

#### Tempo Ranges
- **Slow (80 BPM)**: Learning mode, easier recognition
- **Normal (120 BPM)**: Standard playback
- **Fast (160 BPM)**: Challenge mode

#### Fallback Behavior
- If no rhythm data: defaults to quarter notes
- Last note extended for natural phrasing
- Graceful degradation ensures all melodies playable

### Compatibility
- ✅ All modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile devices (iOS, Android)
- ✅ Desktop and tablet
- ✅ Backwards compatible with motifs without rhythm data

### Performance
- Zero lag: Web Audio API schedules notes in advance
- Smooth playback at all tempo settings
- No blocking or UI freezing
- Efficient memory usage

---

## [1.0.0] - 2024-11-23

### Initial Release

#### Core Features
- Interactive crossword grid
- Note input with 12-tone chromatic picker
- Audio playback with Web Audio API
- Hint system (1 note, 3 notes)
- Progress tracking
- Real-time validation
- Puzzle selection
- Responsive design

#### Components
- CrosswordGrid
- NotePicker
- ClueList
- AudioPlayer (basic)
- ProgressIndicator

#### Database Integration
- SQLite backend
- RESTful API routes
- Puzzle and motif management

---

## Future Plans

### [1.2.0] - Planned
- [ ] User preferences persistence (tempo, volume)
- [ ] Visual rhythm display (musical notation)
- [ ] Enhanced audio synthesis (better instrument sounds)
- [ ] Accessibility improvements

### [1.3.0] - Ideas
- [ ] Daily puzzle mode
- [ ] Leaderboards
- [ ] Social sharing
- [ ] Custom puzzle creator
- [ ] Multiplayer mode

