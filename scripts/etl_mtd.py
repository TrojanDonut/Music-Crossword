#!/usr/bin/env python3
"""
ETL pipeline for MTD Dataset → SQLite database.
Parses CSV files and JSON metadata, normalizes melodies, and populates the database.
"""

import sqlite3
import hashlib
import json
from pathlib import Path
from typing import List, Optional, Set
from dataclasses import dataclass
from mtd_parser import MTDParser, MTDTheme

DB_PATH = Path(__file__).parent.parent / "music_crossword.db"
MTD_ROOT = Path(__file__).parent.parent / "nonessential/data/MTD"

# Most recognizable composers (for filtering)
RECOGNIZABLE_COMPOSERS = {
    'Beethoven', 'Mozart', 'Bach', 'Chopin', 'Tchaikovsky', 'Vivaldi',
    'Handel', 'Schubert', 'Brahms', 'Debussy', 'Haydn', 'Schumann',
    'Mendelssohn', 'Liszt', 'Wagner', 'Strauss', 'Dvorak', 'Prokofiev',
    'Rachmaninoff', 'Stravinsky', 'Bizet', 'Puccini', 'Verdi', 'Rossini'
}

@dataclass
class ProcessingStats:
    """Statistics for ETL run."""
    total_files: int = 0
    parsed: int = 0
    inserted: int = 0
    duplicates: int = 0
    errors: int = 0
    too_short: int = 0  # < 4 notes
    too_long: int = 0   # > 15 notes (for crossword)
    filtered_out: int = 0  # Not in recognizable composers list


class MTDETL:
    """ETL pipeline for MTD Dataset."""
    
    def __init__(self, db_path: Path = DB_PATH, mtd_root: Path = MTD_ROOT):
        self.db_path = db_path
        self.mtd_root = mtd_root
        self.parser = MTDParser(mtd_root)
        self.stats = ProcessingStats()
        
        if not self.db_path.exists():
            print(f"❌ Database not found: {self.db_path}")
            print("   Run db_init.py first to create the database.")
            raise FileNotFoundError(f"Database not found: {self.db_path}")
    
    def run(self, limit: Optional[int] = None,
            min_notes: int = 4, max_notes: int = 15,
            only_recognizable: bool = True):
        """
        Run the ETL pipeline.
        
        Args:
            limit: Maximum number of themes to process (None = all)
            min_notes: Minimum motif length (default 4, crossword-friendly)
            max_notes: Maximum motif length (default 15, crossword-friendly)
            only_recognizable: If True, only import themes from recognizable composers
        """
        print(f"🚀 Starting MTD ETL pipeline")
        print(f"   Database: {self.db_path}")
        print(f"   Source: {self.mtd_root}")
        print(f"   Motif length: {min_notes}-{max_notes} notes")
        print(f"   Only recognizable composers: {only_recognizable}")
        
        # Find all metadata files
        meta_files = sorted(self.mtd_root.glob("data_META/*.json"))
        
        if limit:
            meta_files = meta_files[:limit]
            print(f"   Processing: {len(meta_files)} themes (limited)")
        else:
            print(f"   Processing: {len(meta_files)} themes")
        
        self.stats.total_files = len(meta_files)
        
        # Connect to database
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Get or create MTD source
            source_id = self._get_or_create_source(cursor)
            
            # Process each theme
            for i, meta_file in enumerate(meta_files, 1):
                if i % 50 == 0:
                    print(f"   Progress: {i}/{len(meta_files)} themes...")
                
                self._process_theme(meta_file, cursor, source_id, min_notes, max_notes, only_recognizable)
            
            # Commit all changes
            conn.commit()
            
            # Print statistics
            self._print_stats()
            
        except Exception as e:
            print(f"❌ ETL failed: {e}")
            conn.rollback()
            raise
        finally:
            conn.close()
    
    def _process_theme(self, meta_file: Path, cursor: sqlite3.Cursor,
                      source_id: int, min_notes: int, max_notes: int,
                      only_recognizable: bool):
        """Process a single theme."""
        try:
            # Parse theme
            theme = self.parser.parse_theme_from_file(meta_file)
            
            if not theme:
                self.stats.errors += 1
                return
            
            self.stats.parsed += 1
            
            # Filter by composer if requested
            if only_recognizable and theme.composer not in RECOGNIZABLE_COMPOSERS:
                self.stats.filtered_out += 1
                return
            
            # Check length
            if len(theme.notes) < min_notes:
                self.stats.too_short += 1
                return
            
            if len(theme.notes) > max_notes:
                self.stats.too_long += 1
                return
            
            # Insert theme
            if self._insert_theme(cursor, theme, source_id):
                self.stats.inserted += 1
            else:
                self.stats.duplicates += 1
        
        except Exception as e:
            print(f"⚠️  Error processing {meta_file.name}: {e}")
            self.stats.errors += 1
    
    def _insert_theme(self, cursor: sqlite3.Cursor, theme: MTDTheme, source_id: int) -> bool:
        """Insert theme into database. Returns True if inserted, False if duplicate."""
        # Extract data for database
        pitch_sequence = theme.to_pitch_sequence()
        rhythm_sequence = theme.to_rhythm_sequence()
        interval_profile = theme.compute_interval_profile()
        
        # Compute checksum for duplicate detection
        checksum = hashlib.sha256(pitch_sequence.encode()).hexdigest()
        
        # Determine first and last pitch
        first_pitch = theme.notes[0].pitch_class if theme.notes else None
        last_pitch = theme.notes[-1].pitch_class if theme.notes else None
        
        # Compute difficulty (simple heuristic based on length and interval complexity)
        difficulty = self._compute_difficulty(theme)
        
        # Recognition score: higher for recognizable composers
        recognition_score = 8 if theme.composer in RECOGNIZABLE_COMPOSERS else 6
        
        # Create descriptor
        descriptor = f"{theme.composer} - {theme.work_title}"
        if not theme.work_title or theme.work_title == theme.work_id:
            descriptor = f"{theme.composer} - {theme.work_id}"
        
        # Insert motif
        try:
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
                len(theme.notes),
                '*',  # Allow all transpositions
                first_pitch,
                last_pitch,
                source_id,
                f"MTD{theme.mtd_id}.csv",
                descriptor,
                'Public Domain',  # Most classical works are PD
                difficulty,
                recognition_score,
                checksum
            ))
            
            # Add composer tag
            motif_id = cursor.lastrowid
            self._add_composer_tag(cursor, motif_id, theme.composer)
            
            return True
            
        except sqlite3.IntegrityError:
            # Duplicate checksum
            return False
    
    def _get_or_create_source(self, cursor: sqlite3.Cursor) -> int:
        """Get or create MTD source."""
        cursor.execute("SELECT id FROM sources WHERE name = ?", ("MTD - Musical Theme Dataset",))
        row = cursor.fetchone()
        
        if row:
            return row[0]
        
        cursor.execute("""
            INSERT INTO sources (name, region, collection, license, url, notes)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            "MTD - Musical Theme Dataset",
            "Various",
            "MTD",
            "Public Domain",
            "https://github.com/MTG/MTD",
            "2,067 classical and modern musical themes"
        ))
        
        return cursor.lastrowid
    
    def _add_composer_tag(self, cursor: sqlite3.Cursor, motif_id: int, composer: str):
        """Add composer tag."""
        # Get or create tag
        cursor.execute("SELECT id FROM tags WHERE name = ?", (composer,))
        row = cursor.fetchone()
        
        if row:
            tag_id = row[0]
        else:
            cursor.execute("""
                INSERT INTO tags (name, category)
                VALUES (?, 'composer')
            """, (composer,))
            tag_id = cursor.lastrowid
        
        # Link motif to tag
        try:
            cursor.execute("""
                INSERT INTO motif_tags (motif_id, tag_id)
                VALUES (?, ?)
            """, (motif_id, tag_id))
        except sqlite3.IntegrityError:
            pass  # Already tagged
    
    def _compute_difficulty(self, theme: MTDTheme) -> int:
        """
        Compute difficulty score (1-5) based on length and interval complexity.
        Simple heuristic for MVP.
        """
        length = len(theme.notes)
        indices = theme.to_pitch_indices()
        
        # Compute average absolute interval size
        if len(indices) < 2:
            return 1
        
        total_interval = sum(abs(indices[i] - indices[i-1]) for i in range(1, len(indices)))
        avg_interval = total_interval / (len(indices) - 1)
        
        # Difficulty formula (subjective, can be refined)
        if length <= 5 and avg_interval <= 2:
            return 1
        elif length <= 8 and avg_interval <= 3:
            return 2
        elif length <= 12 and avg_interval <= 4:
            return 3
        elif length <= 15 and avg_interval <= 5:
            return 4
        else:
            return 5
    
    def _print_stats(self):
        """Print ETL statistics."""
        print(f"\n{'='*60}")
        print("MTD ETL Pipeline Complete")
        print('='*60)
        print(f"Total themes:     {self.stats.total_files}")
        print(f"Successfully parsed: {self.stats.parsed}")
        print(f"Inserted to DB:   {self.stats.inserted}")
        print(f"Duplicates:       {self.stats.duplicates}")
        print(f"Too short:        {self.stats.too_short}")
        print(f"Too long:         {self.stats.too_long}")
        print(f"Filtered out:    {self.stats.filtered_out} (not recognizable)")
        print(f"Errors:           {self.stats.errors}")
        print('='*60)
        
        if self.stats.inserted > 0:
            print(f"✅ Database populated with {self.stats.inserted} MTD themes")
        else:
            print("⚠️  No themes inserted")


def clean_database(db_path: Path = DB_PATH):
    """Clean all motifs from database, keep schema."""
    if not db_path.exists():
        print(f"⚠️  Database not found: {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Delete all user progress first (references puzzles)
        cursor.execute("DELETE FROM user_progress")
        
        # Delete all puzzles
        cursor.execute("DELETE FROM puzzles")
        
        # Delete all motif-tag links (many-to-many)
        cursor.execute("DELETE FROM motif_tags")
        
        # Delete all motifs
        cursor.execute("DELETE FROM motifs")
        
        # Delete all sources
        cursor.execute("DELETE FROM sources")
        
        # Delete all tags
        cursor.execute("DELETE FROM tags")
        
        conn.commit()
        
        # Verify cleanup
        cursor.execute("SELECT COUNT(*) FROM motifs")
        motif_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM motif_tags")
        tag_link_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM sources")
        source_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM tags")
        tag_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM puzzles")
        puzzle_count = cursor.fetchone()[0]
        
        print(f"✅ Database cleaned")
        print(f"   Remaining motifs: {motif_count}")
        print(f"   Remaining tag links: {tag_link_count}")
        print(f"   Remaining sources: {source_count}")
        print(f"   Remaining tags: {tag_count}")
        print(f"   Remaining puzzles: {puzzle_count}")
        
    except Exception as e:
        print(f"❌ Error cleaning database: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="ETL pipeline for MTD Dataset"
    )
    parser.add_argument(
        '--limit', type=int, default=None,
        help="Limit number of themes to process (for testing)"
    )
    parser.add_argument(
        '--min-notes', type=int, default=4,
        help="Minimum motif length (default: 4, crossword-friendly)"
    )
    parser.add_argument(
        '--max-notes', type=int, default=15,
        help="Maximum motif length (default: 15, crossword-friendly)"
    )
    parser.add_argument(
        '--all-composers', action='store_true',
        help="Import all composers, not just recognizable ones"
    )
    parser.add_argument(
        '--clean', action='store_true',
        help="Clean database before importing"
    )
    
    args = parser.parse_args()
    
    # Clean database if requested
    if args.clean:
        print("🧹 Cleaning database...")
        clean_database()
        print()
    
    # Run ETL
    etl = MTDETL()
    etl.run(
        limit=args.limit,
        min_notes=args.min_notes,
        max_notes=args.max_notes,
        only_recognizable=not args.all_composers
    )


if __name__ == "__main__":
    main()

