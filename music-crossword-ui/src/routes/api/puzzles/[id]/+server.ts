/**
 * API route for getting a specific puzzle
 * GET /api/puzzles/[id]
 */

import { json } from '@sveltejs/kit';
import { getPuzzle, getMotifs } from '$lib/utils/database';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const puzzleId = parseInt(params.id);
    
    if (isNaN(puzzleId)) {
      return json({
        success: false,
        error: 'Invalid puzzle ID'
      }, { status: 400 });
    }
    
    const puzzle = getPuzzle(puzzleId);
    
    if (!puzzle) {
      return json({
        success: false,
        error: 'Puzzle not found'
      }, { status: 404 });
    }
    
    // Get motif details for each clue
    const motifs = getMotifs(puzzle.motif_ids);
    const motifMap = new Map(motifs.map(m => [m.id, m]));
    
    // Enrich clues with motif data and normalize position
    const enrichedLayout = {
      ...puzzle.layout,
      result: puzzle.layout.result.map(clue => {
        // Normalize position: the crossword generator uses startx/starty with 1-based indexing
        // We need to convert to 0-based indexing for the grid array
        let position;
        if (clue.position && typeof clue.position === 'object' && 'x' in clue.position && 'y' in clue.position) {
          position = clue.position;
        } else {
          // Convert from 1-based to 0-based indexing
          position = { 
            x: (clue.startx ?? 1) - 1, 
            y: (clue.starty ?? 1) - 1 
          };
        }
        
        return {
          ...clue,
          position,
          motif: motifMap.get(clue.motif_id) || null
        };
      })
    };
    
    return json({
      success: true,
      puzzle: {
        ...puzzle,
        layout: enrichedLayout
      }
    });
  } catch (error) {
    console.error('Error fetching puzzle:', error);
    return json({
      success: false,
      error: 'Failed to fetch puzzle'
    }, { status: 500 });
  }
};

