/**
 * API route for listing all puzzles
 * GET /api/puzzles
 */

import { json } from '@sveltejs/kit';
import { getPuzzles, getPuzzleCount } from '$lib/utils/database';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  try {
    const puzzles = getPuzzles();
    const count = getPuzzleCount();
    
    return json({
      success: true,
      puzzles,
      count
    });
  } catch (error) {
    console.error('Error fetching puzzles:', error);
    return json({
      success: false,
      error: 'Failed to fetch puzzles'
    }, { status: 500 });
  }
};

