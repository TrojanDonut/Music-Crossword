#!/usr/bin/env python3
"""
Import curated themes from curated_themes.json into the database.
These are hand-picked, highly recognizable musical themes.
"""

import sqlite3
import json
import hashlib
from pathlib import Path

DB_PATH = Path(__file__).parent / "music_crossword.db"
THEMES_PATH = Path(__file__).parent / "curated_themes.json"

def import_curated_themes():
    """Import curated themes from JSON file."""
    
    # Load JSON
    if not THEMES_PATH.exists():
        print(f"❌ File not found: {THEMES_PATH}")
        return
    
    with open(THEMES_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    themes = data['themes']
    print(f"📚 Loaded {len(themes)} curated themes")
    
    # Connect to database
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get or create "Curated Themes" source
    cursor.execute("""
        SELECT id FROM sources WHERE name = 'Curated Themes - Iconic Melodies'
    """)
    row = cursor.fetchone()
    
    if row:
        source_id = row[0]
    else:
        cursor.execute("""
            INSERT INTO sources (name, region, collection, license, url, notes)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            'Curated Themes - Iconic Melodies',
            'Various',
            'curated',
            'Various - see individual entries',
            'https://github.com/tevzs/dap-projekt',
            'Hand-curated collection of the most recognizable musical themes'
        ))
        source_id = cursor.lastrowid
        print(f"✅ Created source: Curated Themes (ID: {source_id})")
    
    # Import each theme
    inserted = 0
    duplicates = 0
    errors = 0
    
    for theme in themes:
        try:
            # Extract data
            pitch_sequence = theme['pitch_sequence']
            rhythm_sequence = theme.get('rhythm_sequence', None)  # Optional, for backwards compatibility
            length = theme['length']
            descriptor = theme['title']
            recognition_score = theme['recognition_score']
            difficulty = theme['difficulty']
            
            # Compute interval profile
            pitch_map = {
                'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
                'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
                'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
            }
            
            pitches = pitch_sequence.split()
            indices = [pitch_map[p] for p in pitches]
            
            intervals = []
            for i in range(1, len(indices)):
                diff = indices[i] - indices[i-1]
                intervals.append(f"{diff:+d}")
            interval_profile = " ".join(intervals)
            
            # First and last pitch
            first_pitch = pitches[0] if pitches else None
            last_pitch = pitches[-1] if pitches else None
            
            # Checksum
            checksum = hashlib.sha256(pitch_sequence.encode()).hexdigest()
            
            # Insert
            cursor.execute("""
                INSERT INTO motifs (
                    pitch_sequence, rhythm_sequence, interval_profile, length,
                    allowed_transpositions, first_pitch, last_pitch,
                    source_id, original_filename, descriptor,
                    license, difficulty, recognition_score, checksum
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                pitch_sequence,
                rhythm_sequence,
                interval_profile,
                length,
                '*',  # All transpositions allowed
                first_pitch,
                last_pitch,
                source_id,
                f"{theme['id']}.json",
                descriptor,
                'Various - see source',
                difficulty,
                recognition_score,
                checksum
            ))
            
            inserted += 1
            
            # Add genre tag
            motif_id = cursor.lastrowid
            genre = theme.get('genre', 'classical')
            
            # Get or create genre tag
            cursor.execute("SELECT id FROM tags WHERE name = ?", (genre,))
            tag_row = cursor.fetchone()
            
            if tag_row:
                tag_id = tag_row[0]
            else:
                cursor.execute("""
                    INSERT INTO tags (name, category)
                    VALUES (?, 'genre')
                """, (genre,))
                tag_id = cursor.lastrowid
            
            # Link motif to tag
            try:
                cursor.execute("""
                    INSERT INTO motif_tags (motif_id, tag_id)
                    VALUES (?, ?)
                """, (motif_id, tag_id))
            except sqlite3.IntegrityError:
                pass  # Already tagged
            
            # Add composer tag if present
            if 'composer' in theme:
                composer = theme['composer']
                cursor.execute("SELECT id FROM tags WHERE name = ?", (composer,))
                comp_row = cursor.fetchone()
                
                if comp_row:
                    comp_tag_id = comp_row[0]
                else:
                    cursor.execute("""
                        INSERT INTO tags (name, category)
                        VALUES (?, 'composer')
                    """, (composer,))
                    comp_tag_id = cursor.lastrowid
                
                try:
                    cursor.execute("""
                        INSERT INTO motif_tags (motif_id, tag_id)
                        VALUES (?, ?)
                    """, (motif_id, comp_tag_id))
                except sqlite3.IntegrityError:
                    pass
            
        except sqlite3.IntegrityError:
            duplicates += 1
        except Exception as e:
            print(f"⚠️  Error importing {theme.get('title', 'unknown')}: {e}")
            errors += 1
    
    # Commit
    conn.commit()
    conn.close()
    
    # Report
    print(f"\n{'='*60}")
    print("Import Complete")
    print('='*60)
    print(f"Themes in file:   {len(themes)}")
    print(f"Successfully imported: {inserted}")
    print(f"Duplicates:       {duplicates}")
    print(f"Errors:           {errors}")
    print('='*60)
    
    if inserted > 0:
        print(f"✅ Added {inserted} curated themes to database")
        print(f"   Recognition scores: 7-10 (highly recognizable)")
    else:
        print("⚠️  No themes imported (might be duplicates)")

if __name__ == "__main__":
    import_curated_themes()

