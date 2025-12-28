#!/usr/bin/env python3
"""
Parser for MTD (Musical Theme Dataset) CSV and JSON files.
Extracts pitch sequences and metadata for the music crossword database.
"""

import csv
import json
from pathlib import Path
from typing import List, Optional, Dict
from dataclasses import dataclass


@dataclass
class MTDNote:
    """Represents a single note from MTD CSV."""
    pitch_midi: int      # MIDI pitch number (60 = C4)
    start_time: float   # Start time in seconds
    duration: float     # Duration in seconds
    
    @property
    def pitch_class(self) -> str:
        """Convert MIDI pitch to pitch class (C, D, E, etc.)."""
        # MIDI 60 = C4, 61 = C#4, etc.
        pitch_classes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        return pitch_classes[self.pitch_midi % 12]
    
    @property
    def octave(self) -> int:
        """Get octave number from MIDI pitch."""
        return (self.pitch_midi // 12) - 1


@dataclass
class MTDTheme:
    """Represents a complete MTD theme."""
    mtd_id: str
    composer: str
    work_id: str
    work_title: str
    instruments: str
    notes: List[MTDNote]
    metadata: Dict
    
    def to_pitch_sequence(self) -> str:
        """Convert to space-separated pitch classes."""
        return " ".join(note.pitch_class for note in self.notes)
    
    def to_rhythm_sequence(self) -> str:
        """
        Convert durations to Kern-like notation.
        Approximates seconds to note values: 0.5s ≈ quarter, 0.25s ≈ eighth, etc.
        """
        rhythms = []
        for note in self.notes:
            # Approximate conversion based on typical tempo
            # This is a simplification - you may want more sophisticated conversion
            if note.duration >= 0.9:
                rhythms.append("2")  # Half note
            elif note.duration >= 0.4:
                rhythms.append("4")  # Quarter note
            elif note.duration >= 0.2:
                rhythms.append("8")  # Eighth note
            elif note.duration >= 0.1:
                rhythms.append("16")  # Sixteenth note
            else:
                rhythms.append("32")  # Thirty-second note
        return " ".join(rhythms)
    
    def to_pitch_indices(self) -> List[int]:
        """
        Convert notes to 12-tone chromatic indices (C=0, C#=1, D=2, ..., B=11).
        Returns list of integers for interval calculations.
        """
        chromatic_map = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
            'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
            'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
        }
        return [chromatic_map[note.pitch_class] for note in self.notes]
    
    def compute_interval_profile(self) -> str:
        """
        Compute interval profile as space-separated semitone differences.
        E.g., "C D E" -> "+2 +2" (up 2 semitones, up 2 semitones)
        """
        indices = self.to_pitch_indices()
        if len(indices) < 2:
            return ""
        intervals = []
        for i in range(1, len(indices)):
            diff = indices[i] - indices[i-1]
            intervals.append(f"{diff:+d}")
        return " ".join(intervals)


class MTDParser:
    """Parser for MTD Dataset files."""
    
    def __init__(self, mtd_root: Path):
        self.mtd_root = Path(mtd_root)
    
    def parse_theme(self, mtd_id: str) -> Optional[MTDTheme]:
        """
        Parse a theme by MTD ID.
        
        Args:
            mtd_id: MTD ID (e.g., "1005" or "MTD1005")
        
        Returns:
            MTDTheme object or None if not found
        """
        # Normalize ID (remove MTD prefix if present)
        if mtd_id.startswith("MTD"):
            mtd_id = mtd_id[3:]
        
        # Find metadata file
        meta_pattern = f"MTD{mtd_id}_*.json"
        meta_files = list(self.mtd_root.glob(f"data_META/{meta_pattern}"))
        
        if not meta_files:
            return None
        
        meta_file = meta_files[0]
        
        # Load metadata
        try:
            with open(meta_file, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
        except Exception as e:
            print(f"⚠️  Error loading metadata {meta_file}: {e}")
            return None
        
        # Find corresponding CSV file
        csv_pattern = f"MTD{mtd_id}_*.csv"
        csv_files = list(self.mtd_root.glob(f"data_SCORE_CSV/{csv_pattern}"))
        
        if not csv_files:
            return None
        
        csv_file = csv_files[0]
        
        # Parse CSV
        notes = []
        try:
            with open(csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f, delimiter=';')
                for row in reader:
                    try:
                        notes.append(MTDNote(
                            pitch_midi=int(float(row['Pitch'])),
                            start_time=float(row['Start']),
                            duration=float(row['Duration'])
                        ))
                    except (ValueError, KeyError) as e:
                        continue  # Skip invalid rows
        except Exception as e:
            print(f"⚠️  Error parsing CSV {csv_file}: {e}")
            return None
        
        if not notes:
            return None
        
        # Extract metadata fields
        composer = metadata.get('ComposerID', 'Unknown')
        work_id = metadata.get('WorkID', '')
        work_title = metadata.get('WorkTitle', '') or work_id
        instruments = metadata.get('ThemeInstruments', '')
        
        return MTDTheme(
            mtd_id=metadata.get('MTDID', mtd_id),
            composer=composer,
            work_id=work_id,
            work_title=work_title,
            instruments=instruments,
            notes=notes,
            metadata=metadata
        )
    
    def parse_theme_from_file(self, meta_file: Path) -> Optional[MTDTheme]:
        """
        Parse a theme from a metadata JSON file path.
        
        Args:
            meta_file: Path to metadata JSON file
        
        Returns:
            MTDTheme object or None if not found
        """
        # Extract MTD ID from filename
        filename = meta_file.stem  # e.g., "MTD1005_Beethoven_Op096-01"
        if not filename.startswith("MTD"):
            return None
        
        # Extract ID (MTD1005 -> 1005)
        parts = filename.split('_')
        if len(parts) < 2:
            return None
        
        mtd_id = parts[0][3:]  # Remove "MTD" prefix
        
        return self.parse_theme(mtd_id)


# Example usage and testing
if __name__ == "__main__":
    mtd_root = Path("MTD")
    
    if not mtd_root.exists():
        print(f"⚠️  MTD directory not found: {mtd_root}")
    else:
        parser = MTDParser(mtd_root)
        
        # Test with a few examples
        test_ids = ["1005", "9270", "0955"]
        
        for mtd_id in test_ids:
            print(f"\n{'='*60}")
            print(f"Parsing MTD{mtd_id}")
            print('='*60)
            
            theme = parser.parse_theme(mtd_id)
            if theme:
                print(f"Composer: {theme.composer}")
                print(f"Work: {theme.work_id} - {theme.work_title}")
                print(f"Instruments: {theme.instruments}")
                print(f"Notes count: {len(theme.notes)}")
                print(f"\nPitch sequence: {theme.to_pitch_sequence()[:100]}...")
                print(f"Interval profile: {theme.compute_interval_profile()[:50]}...")
            else:
                print(f"⚠️  Theme not found: MTD{mtd_id}")

