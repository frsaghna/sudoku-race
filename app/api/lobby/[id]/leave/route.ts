import { NextResponse } from 'next/server';
import prisma from '@/utils/dbClient';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: lobbyId } = await params;
  const { player_id } = await request.json();

  if (!player_id) {
    return NextResponse.json({ error: 'Missing player ID' }, { status: 400 });
  }

  try {
    // Delete the player from the lobby
    await prisma.lobbyPlayer.delete({
      where: {
        lobby_id_player_id: {
          lobby_id: lobbyId,
          player_id: player_id
        }
      }
    });

    // Optional: If lobby has 0 players left, you could delete the lobby here too.

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error leaving lobby:", error);
    // Even if error (e.g. player already gone), return success so frontend redirects
    return NextResponse.json({ success: true });
  }
}