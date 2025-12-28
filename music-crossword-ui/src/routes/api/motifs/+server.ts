/**
 * API route for motifs
 * GET /api/motifs - Get all motifs
 * POST /api/motifs - Create a new motif
 * PUT /api/motifs - Update an existing motif
 */

import { json } from '@sveltejs/kit';
import { getAllMotifs, createMotif, updateMotif } from '$lib/utils/database';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  try {
    const motifs = getAllMotifs();
    
    return json({
      success: true,
      motifs
    });
  } catch (error) {
    console.error('Error fetching motifs:', error);
    return json({
      success: false,
      error: 'Failed to fetch motifs'
    }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { title, pitch_sequence, rhythm_sequence, difficulty, recognition_score } = body;
    
    if (!title || !pitch_sequence) {
      return json({
        success: false,
        error: 'Title and pitch_sequence are required'
      }, { status: 400 });
    }
    
    const notes = pitch_sequence.trim().split(/\s+/);
    if (notes.length < 3 || notes.length > 15) {
      return json({
        success: false,
        error: 'Pitch sequence must contain 3-15 notes'
      }, { status: 400 });
    }
    
    const id = createMotif({
      descriptor: title,
      pitch_sequence,
      rhythm_sequence: rhythm_sequence || null,
      difficulty: difficulty || 3,
      recognition_score: recognition_score || 5
    });
    
    return json({
      success: true,
      id
    });
  } catch (error: any) {
    console.error('Error creating motif:', error);
    return json({
      success: false,
      error: error.message || 'Failed to create motif'
    }, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, title, pitch_sequence, rhythm_sequence, difficulty, recognition_score } = body;
    
    if (!id) {
      return json({
        success: false,
        error: 'ID is required for updating'
      }, { status: 400 });
    }
    
    const updateData: any = {};
    if (title !== undefined) updateData.descriptor = title;
    if (pitch_sequence !== undefined) {
      const notes = pitch_sequence.trim().split(/\s+/);
      if (notes.length < 3 || notes.length > 15) {
        return json({
          success: false,
          error: 'Pitch sequence must contain 3-15 notes'
        }, { status: 400 });
      }
      updateData.pitch_sequence = pitch_sequence;
    }
    if (rhythm_sequence !== undefined) updateData.rhythm_sequence = rhythm_sequence;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (recognition_score !== undefined) updateData.recognition_score = recognition_score;
    
    const success = updateMotif(id, updateData);
    
    if (!success) {
      return json({
        success: false,
        error: 'Motif not found'
      }, { status: 404 });
    }
    
    return json({
      success: true
    });
  } catch (error: any) {
    console.error('Error updating motif:', error);
    return json({
      success: false,
      error: error.message || 'Failed to update motif'
    }, { status: 500 });
  }
};

