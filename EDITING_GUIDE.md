# Manual Editing Guide - Pitch & Rhythm Data

## Quick Reference

### Data Format
- **Pitch Sequence**: Space-separated pitch classes (e.g., `"C D E F G"`)
- **Rhythm Sequence**: Space-separated Kern notation (e.g., `"4 4 8 8 2"`)
- **Important**: Both must have the **same number of elements**!

### Kern Rhythm Values
| Value | Duration | Name |
|-------|----------|------|
| `1` | 4 beats | Whole note |
| `2` | 2 beats | Half note |
| `4` | 1 beat | Quarter note |
| `8` | 0.5 beats | Eighth note |
| `16` | 0.25 beats | Sixteenth note |
| `4.` | 1.5 beats | Dotted quarter |
| `2.` | 3 beats | Dotted half |

## Workflow for Editing Motifs

### Option 1: Direct SQL Editing (Recommended for Quick Fixes)

#### Step 1: Open the Database

```bash
sqlite3 music_crossword.db
```

#### Step 2: View Existing Motifs

```sql
-- List all motifs with their data
SELECT id, descriptor, pitch_sequence, rhythm_sequence, length 
FROM motifs 
ORDER BY id;

-- Find a specific motif by name
SELECT id, descriptor, pitch_sequence, rhythm_sequence 
FROM motifs 
WHERE descriptor LIKE '%Beethoven%';

-- Find motifs without rhythm data
SELECT id, descriptor, pitch_sequence 
FROM motifs 
WHERE rhythm_sequence IS NULL 
LIMIT 10;
```

#### Step 3: Update a Motif

```sql
-- Update pitch and rhythm for a specific motif
UPDATE motifs 
SET 
  pitch_sequence = 'G G G Eb F F F D',
  rhythm_sequence = '8 8 8 2 8 8 8 2',
  length = 8
WHERE id = 42;

-- Update just the rhythm (keep pitch the same)
UPDATE motifs 
SET rhythm_sequence = '4 4 4 4 4 4 4 2'
WHERE id = 42;

-- Update just the descriptor (title/clue)
UPDATE motifs 
SET descriptor = 'Beethoven - Symphony No. 5'
WHERE id = 42;
```

#### Step 4: Verify the Change

```sql
-- Check the updated motif
SELECT id, descriptor, pitch_sequence, rhythm_sequence, length 
FROM motifs 
WHERE id = 42;

-- Verify pitch and rhythm lengths match
SELECT 
  id,
  descriptor,
  length,
  LENGTH(pitch_sequence) - LENGTH(REPLACE(pitch_sequence, ' ', '')) + 1 AS pitch_count,
  LENGTH(rhythm_sequence) - LENGTH(REPLACE(rhythm_sequence, ' ', '')) + 1 AS rhythm_count
FROM motifs 
WHERE id = 42;
```

#### Step 5: Exit and Test

```sql
.quit
```

Then test in the UI:
```bash
cd music-crossword-ui
npm run dev
```

### Option 2: Python Script (Recommended for Batch Updates)

Create a file `edit_motifs.py`:

```python
#!/usr/bin/env python3
"""
Helper script to edit motifs in the database
"""

import sqlite3

def update_motif(motif_id, pitch_sequence=None, rhythm_sequence=None, descriptor=None):
    """Update a motif's data"""
    conn = sqlite3.connect('music_crossword.db')
    cursor = conn.cursor()
    
    # Validate pitch and rhythm lengths match
    if pitch_sequence and rhythm_sequence:
        pitch_count = len(pitch_sequence.split())
        rhythm_count = len(rhythm_sequence.split())
        if pitch_count != rhythm_count:
            raise ValueError(f"Pitch count ({pitch_count}) != Rhythm count ({rhythm_count})")
    
    # Build update query
    updates = []
    params = []
    
    if pitch_sequence:
        updates.append("pitch_sequence = ?")
        params.append(pitch_sequence)
        # Update length
        updates.append("length = ?")
        params.append(len(pitch_sequence.split()))
    
    if rhythm_sequence:
        updates.append("rhythm_sequence = ?")
        params.append(rhythm_sequence)
    
    if descriptor:
        updates.append("descriptor = ?")
        params.append(descriptor)
    
    if not updates:
        print("Nothing to update!")
        return
    
    params.append(motif_id)
    query = f"UPDATE motifs SET {', '.join(updates)} WHERE id = ?"
    
    cursor.execute(query, params)
    conn.commit()
    
    print(f"✓ Updated motif {motif_id}")
    
    # Show result
    cursor.execute("""
        SELECT id, descriptor, pitch_sequence, rhythm_sequence 
        FROM motifs WHERE id = ?
    """, (motif_id,))
    
    row = cursor.fetchone()
    if row:
        print(f"\nMotif ID: {row[0]}")
        print(f"Title: {row[1]}")
        print(f"Pitch: {row[2]}")
        print(f"Rhythm: {row[3]}")
    
    conn.close()

def list_motifs(search_term=None, limit=20):
    """List motifs (optionally filtered)"""
    conn = sqlite3.connect('music_crossword.db')
    cursor = conn.cursor()
    
    if search_term:
        cursor.execute("""
            SELECT id, descriptor, pitch_sequence, rhythm_sequence 
            FROM motifs 
            WHERE descriptor LIKE ? 
            LIMIT ?
        """, (f'%{search_term}%', limit))
    else:
        cursor.execute("""
            SELECT id, descriptor, pitch_sequence, rhythm_sequence 
            FROM motifs 
            LIMIT ?
        """, (limit,))
    
    rows = cursor.fetchall()
    
    print(f"\nFound {len(rows)} motifs:\n")
    for row in rows:
        print(f"ID {row[0]}: {row[1]}")
        print(f"  Pitch:  {row[2]}")
        print(f"  Rhythm: {row[3]}")
        print()
    
    conn.close()

def add_rhythm_from_pattern(motif_id, pattern='equal'):
    """Add rhythm pattern to a motif without rhythm data"""
    conn = sqlite3.connect('music_crossword.db')
    cursor = conn.cursor()
    
    # Get pitch sequence
    cursor.execute("SELECT pitch_sequence FROM motifs WHERE id = ?", (motif_id,))
    row = cursor.fetchone()
    
    if not row:
        print(f"Motif {motif_id} not found!")
        return
    
    pitch_count = len(row[0].split())
    
    # Generate rhythm based on pattern
    if pattern == 'equal':
        # All quarter notes
        rhythm = ' '.join(['4'] * pitch_count)
    elif pattern == 'long_ending':
        # Quarter notes with half note at end
        rhythm = ' '.join(['4'] * (pitch_count - 1) + ['2'])
    elif pattern == 'short_long':
        # Alternate eighth and quarter notes
        rhythm = ' '.join(['8' if i % 2 == 0 else '4' for i in range(pitch_count)])
    else:
        print(f"Unknown pattern: {pattern}")
        return
    
    # Update
    cursor.execute("UPDATE motifs SET rhythm_sequence = ? WHERE id = ?", (rhythm, motif_id))
    conn.commit()
    
    print(f"✓ Added rhythm pattern '{pattern}' to motif {motif_id}")
    print(f"  Rhythm: {rhythm}")
    
    conn.close()


# Example usage
if __name__ == '__main__':
    import sys
    
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python3 edit_motifs.py list [search_term]")
        print("  python3 edit_motifs.py update <id> 'C D E' '4 4 2' 'Title'")
        print("  python3 edit_motifs.py add-rhythm <id> [pattern]")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == 'list':
        search = sys.argv[2] if len(sys.argv) > 2 else None
        list_motifs(search)
    
    elif command == 'update':
        if len(sys.argv) < 5:
            print("Usage: python3 edit_motifs.py update <id> 'pitch' 'rhythm' ['title']")
            sys.exit(1)
        
        motif_id = int(sys.argv[2])
        pitch = sys.argv[3]
        rhythm = sys.argv[4]
        title = sys.argv[5] if len(sys.argv) > 5 else None
        
        update_motif(motif_id, pitch, rhythm, title)
    
    elif command == 'add-rhythm':
        if len(sys.argv) < 3:
            print("Usage: python3 edit_motifs.py add-rhythm <id> [equal|long_ending|short_long]")
            sys.exit(1)
        
        motif_id = int(sys.argv[2])
        pattern = sys.argv[3] if len(sys.argv) > 3 else 'equal'
        
        add_rhythm_from_pattern(motif_id, pattern)
    
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
```

Make it executable:
```bash
chmod +x edit_motifs.py
```

#### Usage Examples:

```bash
# List all motifs
python3 edit_motifs.py list

# Search for specific motifs
python3 edit_motifs.py list "Beethoven"
python3 edit_motifs.py list "Star Wars"

# Update a motif completely
python3 edit_motifs.py update 42 "G G G Eb F F F D" "8 8 8 2 8 8 8 2" "Beethoven - Symphony No. 5"

# Add rhythm pattern to motif without rhythm
python3 edit_motifs.py add-rhythm 42 long_ending
```

### Option 3: Edit via JSON (For Curated Themes)

Edit `curated_themes.json` directly and re-import:

```json
{
  "id": "custom_theme_1",
  "title": "My Custom Melody",
  "pitch_sequence": "C D E F G A B C",
  "rhythm_sequence": "4 4 4 4 4 4 4 2",
  "interval_profile": "+2 +2 +1 +2 +2 +2 +1",
  "length": 8,
  "first_pitch": "C",
  "last_pitch": "C",
  "difficulty": 3,
  "recognition_score": 7,
  "source": "Custom",
  "region": "Custom",
  "tags": ["custom", "scale"]
}
```

Then re-import:
```bash
python3 import_curated_themes.py
```

## Common Editing Scenarios

### Fix Wrong Note

```sql
-- Wrong: "C D E F H" (H should be G)
-- Right: "C D E F G"

UPDATE motifs 
SET pitch_sequence = 'C D E F G'
WHERE id = 42;
```

### Fix Wrong Rhythm

```sql
-- Make ending note longer
UPDATE motifs 
SET rhythm_sequence = '4 4 4 4 4 4 4 2'  -- last note now half note
WHERE id = 42;
```

### Add Missing Rhythm

```sql
-- Add default rhythm pattern
UPDATE motifs 
SET rhythm_sequence = '4 4 4 4 4 4 4 4'
WHERE id = 42 AND rhythm_sequence IS NULL;
```

### Fix Length Mismatch

```sql
-- Check for mismatches
SELECT 
  id,
  descriptor,
  pitch_sequence,
  rhythm_sequence,
  LENGTH(pitch_sequence) - LENGTH(REPLACE(pitch_sequence, ' ', '')) + 1 AS pitch_count,
  LENGTH(rhythm_sequence) - LENGTH(REPLACE(rhythm_sequence, ' ', '')) + 1 AS rhythm_count
FROM motifs 
WHERE 
  rhythm_sequence IS NOT NULL 
  AND (LENGTH(pitch_sequence) - LENGTH(REPLACE(pitch_sequence, ' ', '')) + 1) 
    != (LENGTH(rhythm_sequence) - LENGTH(REPLACE(rhythm_sequence, ' ', '')) + 1);

-- Fix by removing extra rhythm value
UPDATE motifs 
SET rhythm_sequence = '4 4 4 4 4'  -- match pitch count
WHERE id = 42;
```

## Validation Checklist

Before saving changes, verify:

- [ ] Pitch count = Rhythm count
- [ ] All pitches are valid: `C C# D D# E F F# G G# A A# B` (or `Db Eb Gb Ab Bb`)
- [ ] All rhythms are valid Kern values: `1 2 4 8 16` (with optional dots)
- [ ] Length field matches actual note count
- [ ] Descriptor is meaningful and helps players
- [ ] Recognition score is reasonable (1-10)

## Testing Your Changes

### 1. Verify in Database

```bash
sqlite3 music_crossword.db "SELECT * FROM motifs WHERE id = 42;"
```

### 2. Generate Test Puzzle

```bash
node crossword_generator.js
```

Check if your motif appears in the generated puzzle.

### 3. Test in UI

```bash
cd music-crossword-ui
npm run dev
```

Play the motif and verify:
- Notes sound correct
- Rhythm sounds natural
- Tempo controls work
- Hints work properly

## Backup Before Editing!

Always backup before making changes:

```bash
# Backup the entire database
cp music_crossword.db music_crossword.db.backup

# Or export just the motifs table
sqlite3 music_crossword.db ".dump motifs" > motifs_backup.sql
```

Restore if needed:
```bash
# Restore full database
cp music_crossword.db.backup music_crossword.db

# Or restore just motifs table
sqlite3 music_crossword.db < motifs_backup.sql
```

## Common Pitch Patterns

### Scales
```
C Major:  "C D E F G A B C" rhythm: "4 4 4 4 4 4 4 2"
G Major:  "G A B C D E F# G" rhythm: "4 4 4 4 4 4 4 2"
```

### Common Intervals
```
Octave:   "C C" rhythm: "2 2"
Fifth:    "C G" rhythm: "2 2"
Arpeggio: "C E G C" rhythm: "4 4 4 2"
```

### Famous Patterns
```
Jaws:           "E F E F E F E F" rhythm: "8 8 8 8 8 8 8 8"
Beethoven 5th:  "G G G Eb" rhythm: "8 8 8 2"
Star Wars:      "G D E C G D E C" rhythm: "4 8 8 4 4 8 8 2"
```

## Tools & Resources

### Quick Commands

```bash
# Count motifs
sqlite3 music_crossword.db "SELECT COUNT(*) FROM motifs;"

# Find motifs by difficulty
sqlite3 music_crossword.db "SELECT id, descriptor FROM motifs WHERE difficulty = 3;"

# Find motifs by length
sqlite3 music_crossword.db "SELECT id, descriptor, length FROM motifs WHERE length = 8;"

# Export motifs to CSV
sqlite3 -header -csv music_crossword.db "SELECT * FROM motifs;" > motifs.csv
```

### External Tools

- **SQLite Browser**: GUI for editing SQLite databases
  ```bash
  # Install on Ubuntu/Debian
  sudo apt install sqlitebrowser
  
  # Open database
  sqlitebrowser music_crossword.db
  ```

- **Online Kern Editor**: Test Kern notation
  - http://verovio.humdrum.org/

## Need Help?

- **[RHYTHM_GUIDE.md](RHYTHM_GUIDE.md)** - Rhythm notation reference
- **[PITCH_MAPPING_REFERENCE.md](PITCH_MAPPING_REFERENCE.md)** - Pitch system explained
- **[schema.sql](schema.sql)** - Complete database schema

---

**Happy editing! 🎵**

