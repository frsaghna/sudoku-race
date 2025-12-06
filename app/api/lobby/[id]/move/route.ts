import { NextResponse } from 'next/server';
import prisma from '@/utils/dbClient';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Await params (Next.js 15 Fix)
  const { id: lobbyId } = await params;

  // 2. Parse body
  const { player_id, cell, value } = await request.json();
  const cellIndex = Number(cell);

  if (!player_id || isNaN(cellIndex) || !value) {
    return NextResponse.json({ error: 'Invalid move data' }, { status: 400 });
  }

  // 3. Fetch Lobby + Puzzle + Player
  const lobby = await prisma.lobby.findUnique({
    where: { id: lobbyId },
    include: { puzzle: true },
  });

  if (!lobby) return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });
  if (lobby.status !== 'running') return NextResponse.json({ error: 'Game is not running' }, { status: 400 });

  const player = await prisma.lobbyPlayer.findUnique({
    where: {
      lobby_id_player_id: { lobby_id: lobbyId, player_id: player_id }
    }
  });

  if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 });
  if (player.finished) return NextResponse.json({ error: 'Player already finished' }, { status: 400 });
  if (player.mistakes >= 5) return NextResponse.json({ error: 'Player is dead' }, { status: 400 });

  // 4. Validate Move Logic
  const solutionChar = lobby.puzzle.solution[cellIndex];
  const isCorrect = solutionChar === value;

  let newBoard = player.current_board;
  let newMistakes = player.mistakes;
  let isFinished = false;
  let finishTime = null;

  if (isCorrect) {
    // STRING REPLACEMENT LOGIC:
    // JS strings are immutable. We must split, change, join.
    const chars = player.current_board.split('');
    chars[cellIndex] = value;
    newBoard = chars.join('');

    // Check Win Condition (if newBoard matches solution exactly)
    // Note: This is a simple check. If your solution has no zeros, this works.
    if (newBoard === lobby.puzzle.solution) {
      isFinished = true;
      finishTime = new Date();
    }
  } else {
    // Wrong Move: Just increment mistakes. 
    // We do NOT update the board with the wrong number (standard Sudoku rules)
    newMistakes += 1;
  }

  // 5. Save to Database
  const updatedPlayer = await prisma.lobbyPlayer.update({
    where: {
      lobby_id_player_id: { lobby_id: lobbyId, player_id: player_id }
    },
    data: {
      current_board: newBoard,
      mistakes: newMistakes,
      finished: isFinished,
      finish_time: finishTime
    }
  });

  return NextResponse.json({ 
    success: true, 
    is_correct: isCorrect,
    mistakes: updatedPlayer.mistakes,
    board: updatedPlayer.current_board
  });
}