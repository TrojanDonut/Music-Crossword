# Music Crossword 🎵

Crossword puzzle game where you fill in musical notes instead of letters. Recognize melodies to solve the puzzle.

## Quick Start

```bash
# First time setup
./first_run.sh

# Run with Docker
./run.sh

# Or run in development mode
cd music-crossword-ui && npm run dev
```

## Structure

- `music-crossword-ui/` - SvelteKit frontend
- `crossword_generator.js` - Puzzle generation logic
- `scripts/` - Database setup and import scripts
- `schema.sql` - Database schema

## Tech Stack

- **Frontend**: SvelteKit, Web Audio API
- **Backend**: Node.js, SQLite
- **Deployment**: Docker

