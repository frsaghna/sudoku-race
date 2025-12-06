import { NextResponse } from 'next/server';
import prisma from '@/utils/dbClient';
import { v4 as uuidv4 } from 'uuid';

// 1. Update the type definition to wrap params in Promise<...>
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> } 
) {
  // 2. Await the params before accessing the ID
  const { id: lobbyId } = await params;

  const { nickname } = await request.json();
  
  if (!nickname) {
    return NextResponse.json({ error: 'Missing nickname' }, { status: 400 });
  }

  const playerId = uuidv4();
  
  // Now lobbyId is a valid string, so this will work
  const lobby = await prisma.lobby.findUnique({ where: { id: lobbyId } });
  
  if (!lobby) {
    return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });
  }

  const puzzle = await prisma.puzzle.findUnique({ where: { id: lobby.puzzle_id } });
  
  if (!puzzle) {
    return NextResponse.json({ error: 'Puzzle not found' }, { status: 500 });
  }

  // Set all current_board to puzzle.puzzle
  await prisma.lobbyPlayer.create({
    data: {
      lobby_id: lobbyId,
      player_id: playerId,
      nickname,
      current_board: puzzle.puzzle,
    }
  });

  return NextResponse.json({ player_id: playerId });
}