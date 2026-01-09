#!/usr/bin/env python3
"""
Initialize the SQLite database for the music crossword project.
Reads schema.sql and creates the database with all tables and indexes.
"""

import sqlite3
import sys
import shutil
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "music_crossword.db"
SCHEMA_PATH = Path(__file__).parent.parent / "schema.sql"

def init_database():
    """Create database and execute schema."""
    if DB_PATH.exists():
        print(f"⚠️  Database already exists at {DB_PATH}")
        response = input("Overwrite? [y/N]: ").strip().lower()
        if response != 'y':
            print("Aborted.")
            sys.exit(0)
        # Remove file or directory
        if DB_PATH.is_dir():
            shutil.rmtree(DB_PATH)
        else:
            DB_PATH.unlink()
    
    # Read schema
    if not SCHEMA_PATH.exists():
        print(f"❌ Schema file not found: {SCHEMA_PATH}")
        sys.exit(1)
    
    schema_sql = SCHEMA_PATH.read_text(encoding='utf-8')
    
    # Create database and execute schema
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.executescript(schema_sql)
        conn.commit()
        
        # Verify tables were created
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
        tables = [row[0] for row in cursor.fetchall()]
        
        print(f"✅ Database initialized at {DB_PATH}")
        print(f"📊 Created tables: {', '.join(tables)}")
        
        conn.close()
    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    init_database()

