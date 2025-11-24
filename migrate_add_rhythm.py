#!/usr/bin/env python3
"""
Database migration: Add rhythm_sequence column to motifs table
Run this if you have an existing database without rhythm data.
"""

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "music_crossword.db"

def migrate_database():
    """Add rhythm_sequence column to existing database."""
    
    if not DB_PATH.exists():
        print(f"❌ Database not found: {DB_PATH}")
        print("   No migration needed - database will be created with rhythm support.")
        return
    
    print(f"🔄 Migrating database: {DB_PATH}")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if rhythm_sequence column exists
    cursor.execute("PRAGMA table_info(motifs)")
    columns = [row[1] for row in cursor.fetchall()]
    
    if 'rhythm_sequence' in columns:
        print("✅ Database already has rhythm_sequence column - no migration needed")
        conn.close()
        return
    
    print("   Adding rhythm_sequence column...")
    
    try:
        # Add the column (will be NULL for existing rows)
        cursor.execute("""
            ALTER TABLE motifs 
            ADD COLUMN rhythm_sequence TEXT
        """)
        
        conn.commit()
        print("✅ Migration complete!")
        print("   rhythm_sequence column added to motifs table")
        print("\n⚠️  Note: Existing motifs will have NULL rhythm_sequence.")
        print("   Re-run ETL or import_curated_themes.py to populate rhythm data.")
        
    except sqlite3.Error as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()

