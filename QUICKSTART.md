# Quick Start Guide - Glasbena Križanka

## 🎵 Get Your Musical Crossword Generator Running in 3 Minutes

### Step 1: Setup (30 seconds)

```bash
cd /home/tevzs/Gits/dap-projekt

# Initialize database
python3 db_init.py

# Install Node.js dependencies
npm install
```

### Step 2: Load Music Data (1-2 minutes)

**Option A: Quick test** (20 songs → ~1,500 motifs)
```bash
python3 etl_essen.py --limit 20 --min-notes 5 --max-notes 10
```

**Option B: Children's songs** (213 songs → ~15,000 motifs)
```bash
python3 etl_essen.py --regions europa/deutschl/kinder --min-notes 5 --max-notes 10
```

**Option C: Full German collection** (5,000+ songs → takes ~10 minutes)
```bash
python3 etl_essen.py --regions europa/deutschl --min-notes 5 --max-notes 10
```

### Step 3: Generate Crossword (instant)

```bash
node crossword_generator.js
```

You'll see:
```
🎵 Generating musical crossword...
   Fetching 10 motifs (5-8 notes)...
   Found 20 candidate motifs
   Generating layout...
✅ Crossword generated successfully
   Grid size: 17 x 9
   Words placed: 10

📊 Crossword Grid:
[ASCII grid display]

📝 Clues:
1. → Die Schlangenkoechin 'Oh, where have you been, (motif 28-32)
...

💾 Saved puzzle to database (ID: 1)
```

## 🔍 Explore Your Data

### Check what's in the database
```bash
# Count motifs
sqlite3 music_crossword.db "SELECT COUNT(*) FROM motifs;"

# See motif length distribution
sqlite3 music_crossword.db "SELECT length, COUNT(*) as count FROM motifs GROUP BY length;"

# View sample motifs
sqlite3 music_crossword.db "SELECT id, length, pitch_sequence, descriptor FROM motifs LIMIT 10;"

# List generated puzzles
sqlite3 music_crossword.db "SELECT id, difficulty, created_at FROM puzzles;"
```

### Generate more puzzles
```bash
# Generate 5 puzzles
for i in {1..5}; do node crossword_generator.js; done

# Generate harder puzzle (7-10 note motifs)
# Edit crossword_generator.js line 153: minLength: 7, maxLength: 10
node crossword_generator.js
```

## 🧪 Test Individual Components

### Test the parser
```bash
python3 krn_parser.py
# Shows parsed output from sample files
```

### Test ETL with verbose output
```bash
python3 etl_essen.py --limit 5 --min-notes 5 --max-notes 10
# Watch it process 5 files with statistics
```

### Inspect specific motif
```bash
sqlite3 music_crossword.db "SELECT * FROM motifs WHERE id=1;"
```

## 📊 What the Numbers Mean

After loading 20 test files, you should see:
```
Total files:      20
Successfully parsed: 20
Inserted to DB:   ~1,486
Duplicates:       ~352
```

**Why so many motifs from 20 songs?**
Each song is chunked into overlapping 5-10 note phrases:
- A 70-note song → ~80 motifs
- 20 songs × ~75 motifs avg = ~1,500 total

**Why duplicates?**
Common melodic patterns appear in multiple songs (e.g., "do-re-mi").

## 🚨 Troubleshooting

### "Database not found"
```bash
python3 db_init.py  # Create it first
```

### "No motifs found"
```bash
python3 etl_essen.py --limit 20 --min-notes 5 --max-notes 10  # Load data
```

### "npm install fails"
```bash
# Make sure Node.js 16+ is installed
node --version

# Try clearing cache
rm -rf node_modules package-lock.json
npm install
```

### "generateLayout is not a function"
Already fixed in the code! (Uses `createRequire` for CommonJS interop)

## 🎯 Next Steps

1. **Load more data**: Run ETL on full Essen collection
2. **Experiment with motif lengths**: Try 4-8, 6-12, etc.
3. **Build the UI**: Start SvelteKit frontend (Step 3 in projekt plan)
4. **Add audio playback**: Integrate Web Audio API

## 📝 File Overview

- `schema.sql` - Database structure
- `db_init.py` - Creates empty database
- `krn_parser.py` - Parses .krn music files
- `etl_essen.py` - Loads data into database
- `crossword_generator.js` - Generates puzzles
- `music_crossword.db` - Your puzzle database (created after init)

## 💡 Pro Tips

1. **Start small**: Use `--limit 20` to test before processing thousands of files
2. **Adjust lengths**: Standard crosswords average 5-6 letters, so 5-8 notes is ideal
3. **Check variety**: Query `SELECT DISTINCT descriptor FROM motifs LIMIT 20` to see clue diversity
4. **Save puzzles**: Each generated puzzle is stored in the `puzzles` table for later retrieval

---

**Questions?** Check `README.md` for full documentation or `IMPLEMENTATION_SUMMARY.md` for technical details.

Happy puzzle generating! 🎵🎮

