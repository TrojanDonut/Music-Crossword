#!/usr/bin/env python3
"""
Parser for Humdrum Kern (.krn) files from the Essen Folksong Collection.
Extracts pitch sequences and metadata for the music crossword database.
"""

import re
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass

@dataclass
class KernNote:
    """Represents a single note in Kern format."""
    pitch_class: str  # e.g. "C", "D#", "Eb"
    octave: int       # MIDI-style octave (C4 = middle C)
    duration: str     # e.g. "4" (quarter), "8" (eighth)
    
@dataclass
class KernMelody:
    """Parsed melody with metadata."""
    title: str
    region: str
    source_code: str
    key_signature: str
    time_signature: str
    genre: Optional[str]
    notes: List[KernNote]
    filename: str
    
    def extract_motifs(self, min_length: int = 4, max_length: int = 12, 
                       stride: int = 3) -> List['KernMelody']:
        """
        Extract overlapping melodic motifs (phrases) from the full melody.
        Like sliding window for crossword-sized chunks.
        
        Args:
            min_length: Minimum motif length (default 4 notes)
            max_length: Maximum motif length (default 12 notes)
            stride: Step size for sliding window (default 3 for overlap)
        
        Returns:
            List of KernMelody objects, each representing a motif
        """
        motifs = []
        
        # Extract motifs of varying lengths
        for length in range(min_length, min(max_length + 1, len(self.notes) + 1)):
            for start_idx in range(0, len(self.notes) - length + 1, stride):
                motif_notes = self.notes[start_idx:start_idx + length]
                
                # Create new melody object for this motif
                motif = KernMelody(
                    title=f"{self.title} (motif {start_idx+1}-{start_idx+length})",
                    region=self.region,
                    source_code=self.source_code,
                    key_signature=self.key_signature,
                    time_signature=self.time_signature,
                    genre=self.genre,
                    notes=motif_notes,
                    filename=self.filename
                )
                motifs.append(motif)
        
        return motifs
    
    def to_pitch_sequence(self, reference_octave: int = 4) -> str:
        """
        Convert notes to space-separated pitch sequence in reference octave.
        Transposes all notes to the reference octave (C4-B4 by default).
        """
        pitch_classes = []
        for note in self.notes:
            # Extract just the pitch class, ignore octave
            pitch_classes.append(note.pitch_class)
        return " ".join(pitch_classes)
    
    def to_rhythm_sequence(self) -> str:
        """
        Convert notes to space-separated rhythm sequence (Kern duration notation).
        E.g., "4 4 8 8 2" for quarter, quarter, eighth, eighth, half.
        """
        rhythms = []
        for note in self.notes:
            # Use the duration from Kern notation
            rhythms.append(note.duration if note.duration else "4")
        return " ".join(rhythms)
    
    def to_pitch_indices(self, reference_octave: int = 4) -> List[int]:
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


class KernParser:
    """Parser for Humdrum Kern files."""
    
    # Kern pitch regex: optional accidentals + pitch letter + optional octave indicators
    # Examples: "4f", "8cc", "4.a", "12dd", "8b-", "8r" (rest)
    NOTE_PATTERN = re.compile(r'(\d+\.?)([a-gA-G]+[-#]*|r)')
    
    def __init__(self):
        self.pitch_map = {
            # Lowercase = higher octaves, uppercase = lower octaves in Kern
            # We'll normalize to standard pitch names
        }
    
    def parse_file(self, filepath: Path) -> Optional[KernMelody]:
        """Parse a single .krn file and return melody object."""
        try:
            content = filepath.read_text(encoding='utf-8', errors='ignore')
            return self.parse_content(content, filepath.name)
        except Exception as e:
            print(f"⚠️  Error parsing {filepath}: {e}")
            return None
    
    def parse_content(self, content: str, filename: str) -> Optional[KernMelody]:
        """Parse kern content string."""
        lines = content.strip().split('\n')
        
        # Extract metadata
        metadata = self._extract_metadata(lines)
        
        # Extract notes
        notes = self._extract_notes(lines)
        
        if not notes:
            return None
        
        return KernMelody(
            title=metadata.get('OTL', 'Unknown'),
            region=metadata.get('ARE', 'Unknown'),
            source_code=metadata.get('SCT', ''),
            key_signature=metadata.get('key', ''),
            time_signature=metadata.get('meter', ''),
            genre=metadata.get('AGN', None),
            notes=notes,
            filename=filename
        )
    
    def _extract_metadata(self, lines: List[str]) -> Dict[str, str]:
        """Extract metadata from !!! reference records."""
        metadata = {}
        
        for line in lines:
            if line.startswith('!!!'):
                # Format: !!!TAG: VALUE
                match = re.match(r'!!!([A-Z]+):\s*(.+)', line)
                if match:
                    tag, value = match.groups()
                    metadata[tag] = value.strip()
            
            # Key signature: *k[b-] means F major/D minor (one flat)
            elif line.startswith('*k['):
                key_match = re.match(r'\*k\[([a-g#-]*)\]', line)
                if key_match:
                    metadata['key'] = key_match.group(1) or 'C'
            
            # Time signature: *M4/4
            elif line.startswith('*M'):
                meter_match = re.match(r'\*M(\d+/\d+)', line)
                if meter_match:
                    metadata['meter'] = meter_match.group(1)
            
            # Mode: *F: means F major
            elif line.startswith('*') and ':' in line:
                mode_match = re.match(r'\*([A-Ga-g][#b-]*):', line)
                if mode_match:
                    metadata['mode'] = mode_match.group(1)
        
        return metadata
    
    def _extract_notes(self, lines: List[str]) -> List[KernNote]:
        """Extract pitch sequence from kern data."""
        notes = []
        
        for line in lines:
            # Skip comments, interpretations, barlines
            if line.startswith('!') or line.startswith('*') or line.startswith('=') or not line.strip():
                continue
            
            # Skip terminators
            if line == '*-':
                break
            
            # Parse note tokens
            tokens = line.strip().split()
            for token in tokens:
                # Remove phrase markers and other decorations
                token = token.strip('{}()[]')
                
                match = self.NOTE_PATTERN.match(token)
                if match:
                    duration, pitch_str = match.groups()
                    
                    # Skip rests
                    if pitch_str == 'r':
                        continue
                    
                    # Parse pitch
                    note = self._parse_pitch(pitch_str)
                    if note:
                        note.duration = duration
                        notes.append(note)
        
        return notes
    
    def _parse_pitch(self, pitch_str: str) -> Optional[KernNote]:
        """
        Convert Kern pitch string to KernNote.
        Kern uses: lowercase = higher octave, uppercase = lower octave
        Multiple letters = octave displacement (cc = C5, CC = C2)
        """
        # Extract base pitch and accidentals
        base_match = re.match(r'([a-gA-G]+)([-#]*)', pitch_str)
        if not base_match:
            return None
        
        letters, accidental = base_match.groups()
        
        # Count letter repetitions to determine octave
        base_letter = letters[0].upper()
        octave_count = len(letters)
        
        # Kern convention: lowercase = octave 4+, uppercase = octave 3-
        if letters[0].islower():
            octave = 3 + octave_count  # c=4, cc=5, ccc=6
        else:
            octave = 4 - octave_count  # C=3, CC=2, CCC=1
        
        # Convert accidental notation
        pitch_class = base_letter
        if accidental == '-':
            pitch_class += 'b'
        elif accidental == '#':
            pitch_class += '#'
        elif accidental == '--':
            pitch_class += 'bb'  # double flat (rare)
        
        return KernNote(pitch_class=pitch_class, octave=octave, duration="")
    
    def normalize_pitch_class(self, pitch_class: str) -> str:
        """Normalize pitch class to sharp notation (Bb -> A#, etc.)."""
        flat_to_sharp = {
            'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
        }
        return flat_to_sharp.get(pitch_class, pitch_class)


# Example usage and testing
if __name__ == "__main__":
    parser = KernParser()
    
    # Test with sample files
    test_files = [
        Path("essen-folksong-collection/europa/deutschl/fink/deut001.krn"),
        Path("essen-folksong-collection/europa/deutschl/kinder/kindr001.krn")
    ]
    
    for filepath in test_files:
        if filepath.exists():
            print(f"\n{'='*60}")
            print(f"Parsing: {filepath.name}")
            print('='*60)
            
            melody = parser.parse_file(filepath)
            if melody:
                print(f"Title: {melody.title}")
                print(f"Region: {melody.region}")
                print(f"Genre: {melody.genre}")
                print(f"Key: {melody.key_signature} | Meter: {melody.time_signature}")
                print(f"Notes count: {len(melody.notes)}")
                print(f"\nPitch sequence: {melody.to_pitch_sequence()}")
                print(f"Interval profile: {melody.compute_interval_profile()}")
                print(f"Chromatic indices: {melody.to_pitch_indices()}")
        else:
            print(f"⚠️  File not found: {filepath}")

