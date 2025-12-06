import { NextResponse } from 'next/server';
// Use the default import
import prisma from '@/utils/dbClient'; 
import { getRandomPuzzleId } from '@/utils/randomPuzzle';

export async function POST() {
  try {
    const puzzleId = await getRandomPuzzleId();
    
    if (!puzzleId) {
      return NextResponse.json({ error: 'No puzzles available' }, { status: 500 });
    }

    const lobby = await prisma.lobby.create({
      data: {
        puzzle_id: puzzleId,
        status: 'waiting',
      },
    });

    return NextResponse.json({ lobby_id: lobby.id });
  } catch (error) {
    console.error("Lobby creation error:", error);
    return NextResponse.json({ error: 'Failed to create lobby' }, { status: 500 });
  }
}