import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/dbClient';
import { calculatePlayerProgress } from '@/utils/board';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const lobbyId = (await params).id;
  const lobby = await prisma.lobby.findUnique({
    where: { id: lobbyId },
    include: { puzzle: true, players: true }
  });
  if (!lobby) return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });

  const players = lobby.players.map((player: typeof lobby.players[number]) => {
    const progress = calculatePlayerProgress(lobby.puzzle.puzzle, player.current_board, lobby.puzzle.solution);
    return {
      nickname: player.nickname,
      player_id: player.player_id,
      mistakes: player.mistakes,
      health: 5 - player.mistakes,
      finished: player.finished,
      finish_time: player.finish_time,
      progress,
      current_board: player.current_board,
    };
  });
  return NextResponse.json({
    status: lobby.status,
    puzzle: lobby.puzzle.puzzle,
    players
  });
}
