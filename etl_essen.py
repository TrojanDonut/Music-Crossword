#!/usr/bin/env python3
"""
ETL pipeline for Essen Folksong Collection → SQLite database.
Parses .krn files, normalizes melodies, and populates the music crossword database.
"""

import sqlite3
import hashlib
import json
from pathlib import Path
from typing import List, Dict, Optional
from dataclasses import dataclass
from krn_parser import KernParser, KernMelody

DB_PATH = Path(__file__).parent / "music_crossword.db"
ESSEN_ROOT = Path(__file__).parent / "essen-folksong-collection"

@dataclass
class ProcessingStats:
    """Statistics for ETL run."""
    total_files: int = 0
    parsed: int = 0
    inserted: int = 0
    duplicates: int = 0
    errors: int = 0
    too_short: int = 0  # < 3 notes
    too_long: int = 0   # > 20 notes (for initial MVP)


class EssenETL:
    """ETL pipeline for Essen Folksong Collection."""
    
    def __init__(self, db_path: Path = DB_PATH, essen_root: Path = ESSEN_ROOT):
        self.db_path = db_path
        self.essen_root = essen_root
        self.parser = KernParser()
        self.stats = ProcessingStats()
        
        if not self.db_path.exists():
            print(f"❌ Database not found: {self.db_path}")
            print("   Run db_init.py first to create the database.")
            raise FileNotFoundError(f"Database not found: {self.db_path}")
    
    def run(self, limit: Optional[int] = None, 
            min_notes: int = 4, max_notes: int = 12,
            regions: Optional[List[str]] = None,
            extract_motifs: bool = True):
        """
        Run the ETL pipeline.
        
        Args:
            limit: Maximum number of files to process (None = all)
            min_notes: Minimum motif length (default 4, crossword-friendly)
            max_notes: Maximum motif length (default 12, crossword-friendly)
            regions: List of region directories to process (None = all)
            extract_motifs: If True, extract short motifs from songs (recommended)
        """
        print(f"🚀 Starting ETL pipeline")
        print(f"   Database: {self.db_path}")
        print(f"   Source: {self.essen_root}")
        print(f"   Motif extraction: {extract_motifs}")
        print(f"   Motif length: {min_notes}-{max_notes} notes")
        
        # Find all .krn files
        krn_files = self._find_krn_files(regions)
        
        if limit:
            krn_files = krn_files[:limit]
            print(f"   Processing: {len(krn_files)} files (limited)")
        else:
            print(f"   Processing: {len(krn_files)} files")
        
        self.stats.total_files = len(krn_files)
        
        # Connect to database
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Process each file
            for i, filepath in enumerate(krn_files, 1):
                if i % 100 == 0:
                    print(f"   Progress: {i}/{len(krn_files)} files...")
                
                self._process_file(filepath, cursor, min_notes, max_notes, extract_motifs)
            
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
    
    def _find_krn_files(self, regions: Optional[List[str]] = None) -> List[Path]:
        """Find all .krn files, optionally filtered by region."""
        if regions:
            files = []
            for region in regions:
                region_path = self.essen_root / region
                if region_path.exists():
                    files.extend(region_path.rglob("*.krn"))
            return sorted(files)
        else:
            return sorted(self.essen_root.rglob("*.krn"))
    
    def _process_file(self, filepath: Path, cursor: sqlite3.Cursor, 
                     min_notes: int, max_notes: int, extract_motifs: bool = True):
        """Process a single .krn file."""
        try:
            # Parse melody
            melody = self.parser.parse_file(filepath)
            
            if not melody:
                self.stats.errors += 1
                return
            
            self.stats.parsed += 1
            
            # Get or create source
            source_id = self._get_or_create_source(cursor, filepath)
            
            # Extract motifs or use full melody
            melodies_to_insert = []
            
            if extract_motifs:
                # Extract crossword-sized motifs from the full song
                motifs = melody.extract_motifs(min_length=min_notes, max_length=max_notes)
                melodies_to_insert = motifs
            else:
                # Use full melody (legacy behavior)
                if len(melody.notes) < min_notes:
                    self.stats.too_short += 1
                    return
                if len(melody.notes) > max_notes:
                    self.stats.too_long += 1
                    return
                melodies_to_insert = [melody]
            
            # Insert each motif
            for motif in melodies_to_insert:
                self._insert_motif(cursor, motif, source_id, filepath.name)
        
        except Exception as e:
            print(f"⚠️  Error processing {filepath.name}: {e}")
            self.stats.errors += 1
    
    def _insert_motif(self, cursor: sqlite3.Cursor, melody: KernMelody, 
                     source_id: int, original_filename: str):
        """Insert a single motif into the database."""
        # Extract data for database
        pitch_sequence = melody.to_pitch_sequence()
        rhythm_sequence = melody.to_rhythm_sequence()
        interval_profile = melody.compute_interval_profile()
        
        # Compute checksum for duplicate detection
        checksum = hashlib.sha256(pitch_sequence.encode()).hexdigest()
        
        # Determine first and last pitch
        first_pitch = melody.notes[0].pitch_class if melody.notes else None
        last_pitch = melody.notes[-1].pitch_class if melody.notes else None
        
        # Compute difficulty (simple heuristic based on length and interval complexity)
        difficulty = self._compute_difficulty(melody)
        
        # Insert motif
        try:
            cursor.execute("""
                INSERT INTO motifs (
                    pitch_sequence, rhythm_sequence, interval_profile, length,
                    allowed_transpositions, first_pitch, last_pitch,
                    source_id, original_filename, descriptor,
                    license, difficulty, checksum
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                pitch_sequence,
                rhythm_sequence,
                interval_profile,
                len(melody.notes),
                '*',  # Allow all transpositions for now
                first_pitch,
                last_pitch,
                source_id,
                original_filename,
                melody.title,
                'Public Domain',
                difficulty,
                checksum
            ))
            
            self.stats.inserted += 1
            
            # Add tags based on genre
            if melody.genre:
                motif_id = cursor.lastrowid
                self._add_genre_tags(cursor, motif_id, melody.genre)
            
        except sqlite3.IntegrityError:
            # Duplicate checksum
            self.stats.duplicates += 1
    
    def _get_or_create_source(self, cursor: sqlite3.Cursor, filepath: Path) -> int:
        """Get or create source record, return source_id."""
        # Extract region and collection from path
        # e.g., europa/deutschl/fink/deut001.krn -> region=deutschl, collection=fink
        parts = filepath.relative_to(self.essen_root).parts
        
        region = parts[1] if len(parts) > 1 else parts[0]
        collection = parts[2] if len(parts) > 2 else "misc"
        
        source_name = f"Essen - {region}/{collection}"
        
        # Check if source exists
        cursor.execute("SELECT id FROM sources WHERE name = ?", (source_name,))
        row = cursor.fetchone()
        
        if row:
            return row[0]
        
        # Create new source
        cursor.execute("""
            INSERT INTO sources (name, region, collection, license, url)
            VALUES (?, ?, ?, ?, ?)
        """, (
            source_name,
            region,
            collection,
            'Public Domain',
            'https://github.com/ccarh/essen-folksong-collection'
        ))
        
        return cursor.lastrowid
    
    def _compute_difficulty(self, melody: KernMelody) -> int:
        """
        Compute difficulty score (1-5) based on length and interval complexity.
        Simple heuristic for MVP.
        """
        length = len(melody.notes)
        indices = melody.to_pitch_indices()
        
        # Compute average absolute interval size
        if len(indices) < 2:
            return 1
        
        total_interval = sum(abs(indices[i] - indices[i-1]) for i in range(1, len(indices)))
        avg_interval = total_interval / (len(indices) - 1)
        
        # Difficulty formula (subjective, can be refined)
        if length <= 5 and avg_interval <= 2:
            return 1
        elif length <= 10 and avg_interval <= 3:
            return 2
        elif length <= 15 and avg_interval <= 4:
            return 3
        elif length <= 20 and avg_interval <= 5:
            return 4
        else:
            return 5
    
    def _add_genre_tags(self, cursor: sqlite3.Cursor, motif_id: int, genre: str):
        """Parse genre string and add tags."""
        # Genre format: "Tageszeiten - Lied, Nacht, Schlaf; Liebe"
        # Split by common delimiters
        genre_lower = genre.lower()
        
        # Common genre keywords to tag
        keywords = ['kinder', 'wiegen', 'lied', 'liebe', 'nacht', 'weihnacht', 
                   'tanz', 'ballade', 'folk', 'children']
        
        for keyword in keywords:
            if keyword in genre_lower:
                tag_id = self._get_or_create_tag(cursor, keyword, 'genre')
                
                # Link motif to tag
                try:
                    cursor.execute("""
                        INSERT INTO motif_tags (motif_id, tag_id)
                        VALUES (?, ?)
                    """, (motif_id, tag_id))
                except sqlite3.IntegrityError:
                    pass  # Already tagged
    
    def _get_or_create_tag(self, cursor: sqlite3.Cursor, 
                          name: str, category: str) -> int:
        """Get or create tag, return tag_id."""
        cursor.execute("SELECT id FROM tags WHERE name = ?", (name,))
        row = cursor.fetchone()
        
        if row:
            return row[0]
        
        cursor.execute("""
            INSERT INTO tags (name, category)
            VALUES (?, ?)
        """, (name, category))
        
        return cursor.lastrowid
    
    def _print_stats(self):
        """Print ETL statistics."""
        print(f"\n{'='*60}")
        print("ETL Pipeline Complete")
        print('='*60)
        print(f"Total files:      {self.stats.total_files}")
        print(f"Successfully parsed: {self.stats.parsed}")
        print(f"Inserted to DB:   {self.stats.inserted}")
        print(f"Duplicates:       {self.stats.duplicates}")
        print(f"Too short:        {self.stats.too_short} (< 3 notes)")
        print(f"Too long:         {self.stats.too_long} (> 20 notes)")
        print(f"Errors:           {self.stats.errors}")
        print('='*60)
        
        if self.stats.inserted > 0:
            print(f"✅ Database populated with {self.stats.inserted} motifs")
        else:
            print("⚠️  No motifs inserted")


def main():
    """Main entry point."""
    import argparse
    
    parser_cli = argparse.ArgumentParser(
        description="ETL pipeline for Essen Folksong Collection"
    )
    parser_cli.add_argument(
        '--limit', type=int, default=None,
        help="Limit number of files to process (for testing)"
    )
    parser_cli.add_argument(
        '--min-notes', type=int, default=4,
        help="Minimum motif length (default: 4, crossword-friendly)"
    )
    parser_cli.add_argument(
        '--max-notes', type=int, default=12,
        help="Maximum motif length (default: 12, crossword-friendly)"
    )
    parser_cli.add_argument(
        '--no-extract-motifs', action='store_true',
        help="Don't extract motifs, use full melodies (not recommended)"
    )
    parser_cli.add_argument(
        '--regions', nargs='+', default=None,
        help="Specific regions to process (e.g., europa/deutschl/kinder)"
    )
    
    args = parser_cli.parse_args()
    
    # Run ETL
    etl = EssenETL()
    etl.run(
        limit=args.limit,
        min_notes=args.min_notes,
        max_notes=args.max_notes,
        regions=args.regions,
        extract_motifs=not args.no_extract_motifs
    )


if __name__ == "__main__":
    main()

