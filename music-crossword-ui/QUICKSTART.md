# Musical Crossword - Quick Start Guide

Get the web application up and running in 3 minutes!

## Prerequisites

- Node.js 16+ installed
- `music_crossword.db` database with puzzles in the parent directory

## Setup (One-time)

```bash
# 1. Navigate to the UI directory
cd music-crossword-ui

# 2. Install dependencies
npm install

# 3. Link the database
ln -s ../music_crossword.db ./music_crossword.db

# Or on Windows:
# copy ..\music_crossword.db music_crossword.db
```

## Run Development Server

```bash
npm run dev
```

Then open your browser to: **http://localhost:5173**

## How to Use

1. **Home Page** - See all available puzzles
2. **Click a puzzle** - Start solving!
3. **Click cells** - Select where to enter notes
4. **Click notes** - Fill in the grid (C, D, E, F, G, A, B, + sharps)
5. **Play melodies** - Click ▶ button on clues to hear the melody
6. **Use hints** - "1st Note" or "3 Notes" for help

## Keyboard Shortcuts

- `C, D, E, F, G, A, B` - Natural notes
- `Shift + C, D, F, G, A` - Sharp notes
- `Backspace` - Clear cell

## Generate More Puzzles

Need more puzzles? Run the generator from the parent directory:

```bash
cd ..
node crossword_generator.js
```

## Troubleshooting

### "No puzzles available"
- Make sure database is linked: `ls -l music_crossword.db`
- Generate puzzles: `cd .. && node crossword_generator.js`

### Port already in use
Change the port: `npm run dev -- --port 3000`

### Database errors
Check database has puzzles: `sqlite3 music_crossword.db "SELECT COUNT(*) FROM puzzles;"`

## Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Features

✓ Interactive crossword grid  
✓ 12-note chromatic picker  
✓ Audio playback (Web Audio API)  
✓ Hint system  
✓ Real-time validation  
✓ Progress tracking  
✓ Auto-save  
✓ Responsive design  
✓ Keyboard shortcuts  

## Next Steps

- Read [README.md](README.md) for full documentation
- Check [../UI_IMPLEMENTATION_GUIDE.md](../UI_IMPLEMENTATION_GUIDE.md) for technical details
- See [../PITCH_MAPPING_REFERENCE.md](../PITCH_MAPPING_REFERENCE.md) for note mapping

---

**Have fun solving musical puzzles! 🎵**

