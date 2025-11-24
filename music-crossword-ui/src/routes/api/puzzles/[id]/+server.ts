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
    
    // Enrich clues with motif data
    const enrichedLayout = {
      ...puzzle.layout,
      result: puzzle.layout.result.map(clue => ({
        ...clue,
        motif: motifMap.get(clue.motif_id) || null
      }))
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

