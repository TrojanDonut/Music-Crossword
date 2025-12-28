#!/usr/bin/env python3
"""
Import 50 recognizable musical themes into the music crossword database.
Converts from the React component format to the database schema format.
"""

import sqlite3
import json
import hashlib
import re
from pathlib import Path

DB_PATH = Path(__file__).parent / "music_crossword.db"
JSON_PATH = Path(__file__).parent / "musical_themes_database.json"

# Conversion table: duration fractions to Kern notation
DURATION_TO_KERN = {
    2.0: "1",     # Double whole note (breve)
    1.5: "2.",    # Dotted half
    1.0: "2",     # Half note
    0.75: "4.",   # Dotted quarter
    0.5: "4",     # Quarter note
    0.33: "4",    # Triplet quarter (approximate)
    0.25: "8",    # Eighth note
    0.17: "16",   # Sixteenth note (approximate)
}

def convert_note_to_pitch_class(note_with_octave):
    """Convert 'C4' to 'C', 'D#5' to 'D#', etc."""
    # Remove octave number (last character or last two if note ends with number)
    i = len(note_with_octave) - 1
    while i >= 0 and note_with_octave[i].isdigit():
        i -= 1
    return note_with_octave[:i+1]

def convert_duration_to_kern(duration):
    """Convert beat fraction to Kern notation."""
    # Find closest match
    closest = min(DURATION_TO_KERN.keys(), key=lambda x: abs(x - duration))
    return DURATION_TO_KERN[closest]

def extract_pitch_class(note: str) -> str:
    """Extract pitch class from note with octave (C4 -> C, D#5 -> D#)."""
    import re
    match = re.search(r'^([A-G][#b]*)', note)
    return match.group(1) if match else note

def extract_octave(note: str) -> int:
    """Extract octave number from note (C4 -> 4, D#5 -> 5)."""
    import re
    match = re.search(r'(\d+)$', note)
    return int(match.group(1)) if match else 4

def calculate_interval_profile(pitch_sequence):
    """Calculate interval sequence (semitones between consecutive notes, accounting for octaves)."""
    note_to_semitone = {
        'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
        'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
        'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
    }
    
    notes = pitch_sequence.split()
    intervals = []
    
    for i in range(len(notes) - 1):
        current_note = notes[i]
        next_note = notes[i + 1]
        
        current_pitch = extract_pitch_class(current_note)
        current_octave = extract_octave(current_note)
        next_pitch = extract_pitch_class(next_note)
        next_octave = extract_octave(next_note)
        
        # Calculate semitones including octave
        current_semi = note_to_semitone.get(current_pitch, 0) + current_octave * 12
        next_semi = note_to_semitone.get(next_pitch, 0) + next_octave * 12
        interval = next_semi - current_semi
        
        intervals.append(f"{interval:+d}")
    
    return " ".join(intervals)

def calculate_checksum(pitch_sequence):
    """Calculate SHA256 checksum of normalized pitch sequence."""
    normalized = " ".join(pitch_sequence.split()).lower()
    return hashlib.sha256(normalized.encode()).hexdigest()

def transpose_to_2_octaves(pitch_sequence: str) -> str:
    """
    Transpose a pitch sequence with octaves to fit within 2 octaves (C4-C5).
    Preserves relative intervals while ensuring all notes are in octaves 4 or 5.
    """
    notes = pitch_sequence.split()
    if not notes:
        return pitch_sequence
    
    note_to_semitone = {
        'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
        'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
        'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
    }
    
    # Find the lowest and highest MIDI note numbers
    midi_numbers = []
    pitch_classes = []
    for note in notes:
        pitch_class = extract_pitch_class(note)
        octave = extract_octave(note)
        pitch_semi = note_to_semitone.get(pitch_class, 0)
        midi_num = pitch_semi + octave * 12
        midi_numbers.append(midi_num)
        pitch_classes.append(pitch_class)
    
    if not midi_numbers:
        return pitch_sequence
    
    min_midi = min(midi_numbers)
    max_midi = max(midi_numbers)
    range_semitones = max_midi - min_midi
    
    # Target range: C4 (MIDI 60) to B5 (MIDI 83) = 24 semitones (2 octaves)
    target_min = 60  # C4 in MIDI
    target_max = 83  # B5 in MIDI
    
    # Calculate shift needed
    if range_semitones <= 23:  # Fits in 2 octaves, just shift
        shift = target_min - min_midi
        # Make sure we don't exceed target_max
        if max_midi + shift > target_max:
            shift = target_max - max_midi
    else:
        # Range too large, shift to start at C4 and clamp high notes
        shift = target_min - min_midi
    
    # Apply shift and clamp to C4-C5 range
    result = []
    reverse_map = {0: 'C', 1: 'C#', 2: 'D', 3: 'D#', 4: 'E', 5: 'F',
                  6: 'F#', 7: 'G', 8: 'G#', 9: 'A', 10: 'A#', 11: 'B'}
    
    for i, note in enumerate(notes):
        pitch_class = pitch_classes[i]
        midi_num = midi_numbers[i]
        new_midi = midi_num + shift
        
        # Clamp to C4-B5 range (MIDI 60-83)
        if new_midi < 60:
            new_midi = 60
        elif new_midi > 83:
            new_midi = 83
        
        # Convert back to note with octave
        new_octave = new_midi // 12
        new_pitch_semi = new_midi % 12
        new_pitch_class = reverse_map.get(new_pitch_semi, pitch_class)
        
        result.append(f"{new_pitch_class}{new_octave}")
    
    return " ".join(result)

def categorize_song(name):
    """Categorize song by genre based on name."""
    name_lower = name.lower()
    
    if any(word in name_lower for word in ['christmas', 'jingle', 'silent night', 'rudolph', 'deck']):
        return 'traditional_holiday'
    elif any(word in name_lower for word in ['star wars', 'harry potter', 'pirates', 'bond', 'mission', 'thrones', 'simpsons', 'addams', 'indiana']):
        return 'film_tv'
    elif any(word in name_lower for word in ['mario', 'tetris', 'nokia']):
        return 'game'
    elif any(word in name_lower for word in ['beethoven', 'mozart', 'für elise', 'ode to joy', 'canon', 'eine kleine', 'entertainer', 'wedding march']):
        return 'classical'
    elif any(word in name_lower for word in ['rock you', 'nation army', 'smoke on the water', 'black', 'child']):
        return 'rock'
    elif any(word in name_lower for word in ['happy birthday', 'twinkle', 'mary', 'old macdonald', 'frère', 'yankee', 'amazing grace', 'auld', 'greensleeves', 'camptown', 'susanna', 'london bridge', 'this old man']):
        return 'traditional_folk'
    else:
        return 'popular'

def estimate_difficulty(length, tempo, note_range):
    """Estimate difficulty from 1-5."""
    difficulty = 1
    
    # Length factor
    if length > 12:
        difficulty += 1
    if length > 14:
        difficulty += 1
    
    # Tempo factor
    if tempo > 150:
        difficulty += 1
    
    # Note range factor (chromatic complexity)
    if '#' in note_range or 'b' in note_range:
        difficulty += 1
    
    return min(difficulty, 5)

def estimate_recognition_score(name):
    """Estimate how recognizable the song is (1-10)."""
    name_lower = name.lower()
    
    # Super famous (10/10)
    if any(phrase in name_lower for phrase in ['happy birthday', 'star wars', 'imperial march', 'super mario', 'für elise', 'ode to joy', 'jingle bells', 'twinkle']):
        return 10
    
    # Very famous (9/10)
    if any(phrase in name_lower for phrase in ['harry potter', 'james bond', 'mission impossible', 'tetris', 'beethoven', 'pirates caribbean', 'game of thrones']):
        return 9
    
    # Well known (8/10)
    if any(phrase in name_lower for phrase in ['pink panther', 'wedding march', 'amazing grace', 'silent night', 'canon']):
        return 8
    
    # Known (7/10)
    if any(phrase in name_lower for phrase in ['seven nation', 'smoke on the water', 'greensleeves', 'yankee doodle']):
        return 7
    
    # Moderate (6/10)
    return 6

def import_themes():
    """Import all themes from JSON into database."""
    
    if not DB_PATH.exists():
        print(f"❌ Database not found at {DB_PATH}")
        print("   Run db_init.py first to create the database.")
        return
    
    if not JSON_PATH.exists():
        print(f"❌ JSON file not found at {JSON_PATH}")
        return
    
    # Load JSON data
    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    themes = data['themes']
    print(f"📚 Loaded {len(themes)} themes from {JSON_PATH}")
    
    # Connect to database
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Ensure "Curated Popular Songs" source exists
    cursor.execute("""
        INSERT OR IGNORE INTO sources (name, region, collection, license, notes)
        VALUES (?, ?, ?, ?, ?)
    """, (
        "Curated Popular Songs",
        "International",
        "50 Recognizable Themes",
        "Mixed - see individual themes",
        "Hand-curated collection of 50 highly recognizable songs for crossword puzzles"
    ))
    
    cursor.execute("SELECT id FROM sources WHERE name = ?", ("Curated Popular Songs",))
    source_id = cursor.fetchone()[0]
    
    imported_count = 0
    skipped_count = 0
    
    for theme in themes:
        # Keep notes with octaves, but transpose to fit within C4-C5 (2 octaves)
        original_sequence = " ".join(theme['notes'])
        # Transpose to fit within 2 octaves (C4-C5)
        pitch_sequence = transpose_to_2_octaves(original_sequence)
        
        # Convert durations to Kern notation
        rhythm_sequence = " ".join([convert_duration_to_kern(dur) for dur in theme['durations']])
        
        # Calculate interval profile (with octaves)
        interval_profile = calculate_interval_profile(pitch_sequence)
        
        # Extract metadata
        length = len(theme['notes'])
        first_pitch = pitch_sequence.split()[0] if pitch_sequence else None
        last_pitch = pitch_sequence.split()[-1] if pitch_sequence else None
        
        # Calculate checksum
        checksum = calculate_checksum(pitch_sequence)
        
        # Categorize and estimate metrics
        genre = categorize_song(theme['name'])
        difficulty = estimate_difficulty(length, theme['tempo'], pitch_sequence)
        recognition_score = estimate_recognition_score(theme['name'])
        
        # Prepare descriptor with BPM info
        descriptor = f"{theme['name']} ({theme['tempo']} BPM)"
        
        try:
            cursor.execute("""
                INSERT INTO motifs (
                    pitch_sequence, rhythm_sequence, interval_profile, length,
                    allowed_transpositions, first_pitch, last_pitch,
                    source_id, descriptor, difficulty, recognition_score,
                    checksum
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                pitch_sequence,
                rhythm_sequence,
                interval_profile,
                length,
                '*',  # Allow all transpositions
                first_pitch,
                last_pitch,
                source_id,
                descriptor,
                difficulty,
                recognition_score,
                checksum
            ))
            
            imported_count += 1
            print(f"✅ {theme['name']} (ID: {theme['id']}, Length: {length}, Difficulty: {difficulty}, Recognition: {recognition_score})")
            
        except sqlite3.IntegrityError as e:
            skipped_count += 1
            print(f"⏭️  Skipped {theme['name']} (duplicate)")
    
    # Commit changes
    conn.commit()
    
    # Show summary
    print(f"\n{'='*60}")
    print(f"✅ Import complete!")
    print(f"   Imported: {imported_count} themes")
    print(f"   Skipped: {skipped_count} duplicates")
    print(f"   Total in database: ", end="")
    
    cursor.execute("SELECT COUNT(*) FROM motifs")
    total = cursor.fetchone()[0]
    print(f"{total} motifs")
    
    # Show category breakdown
    print(f"\n📊 Category breakdown:")
    cursor.execute("""
        SELECT 
            CASE 
                WHEN descriptor LIKE '%Christmas%' OR descriptor LIKE '%Jingle%' 
                    OR descriptor LIKE '%Silent Night%' OR descriptor LIKE '%Rudolph%' 
                    OR descriptor LIKE '%Deck%' THEN 'Holiday'
                WHEN descriptor LIKE '%Star Wars%' OR descriptor LIKE '%Harry Potter%' 
                    OR descriptor LIKE '%Pirates%' OR descriptor LIKE '%Bond%' 
                    OR descriptor LIKE '%Thrones%' OR descriptor LIKE '%Simpsons%' THEN 'Film/TV'
                WHEN descriptor LIKE '%Mario%' OR descriptor LIKE '%Tetris%' 
                    OR descriptor LIKE '%Nokia%' THEN 'Games'
                WHEN descriptor LIKE '%Beethoven%' OR descriptor LIKE '%Mozart%' 
                    OR descriptor LIKE '%Elise%' OR descriptor LIKE '%Canon%' THEN 'Classical'
                WHEN descriptor LIKE '%Rock%' OR descriptor LIKE '%Nation%' 
                    OR descriptor LIKE '%Smoke%' OR descriptor LIKE '%Black%' THEN 'Rock'
                ELSE 'Traditional/Folk'
            END as category,
            COUNT(*) as count
        FROM motifs
        WHERE source_id = ?
        GROUP BY category
        ORDER BY count DESC
    """, (source_id,))
    
    for row in cursor.fetchall():
        print(f"   {row[0]}: {row[1]} songs")
    
    conn.close()
    print(f"\n🎵 Database ready at {DB_PATH}")

if __name__ == "__main__":
    import_themes()

