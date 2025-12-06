import { NextResponse } from 'next/server';
import prisma from '@/utils/dbClient';

// 1. Change type to Promise<{ id: string }>
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  // 2. Await the params to get the ID
  const { id: lobbyId } = await params;

  try {
    const updated = await prisma.lobby.update({
      where: { id: lobbyId },
      data: {
        status: 'running',
        start_time: new Date(),
      }
    });
    
    return NextResponse.json({ status: 'running', start_time: updated.start_time });
  } catch (error) {
    // Prisma .update() throws if the record isn't found. Catch it here.
    return NextResponse.json({ error: 'Unable to start lobby: Lobby not found' }, { status: 404 });
  }
}