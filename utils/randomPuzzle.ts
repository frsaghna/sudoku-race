import prisma from './dbClient';

/** Returns a random puzzle id from DB. */
export async function getRandomPuzzleId(): Promise<string> {
  const count = await prisma.puzzle.count();
  const [puzzle] = await prisma.puzzle.findMany({
    orderBy: { id: 'asc' },
    take: 1,
    skip: Math.floor(Math.random() * count)
  });
  return puzzle?.id ?? '';
}

/** Returns a random puzzle full object. */
export async function getRandomPuzzle(): Promise<{id: string, puzzle: string, solution: string}> {
  const count = await prisma.puzzle.count();
  const [puzzleObj] = await prisma.puzzle.findMany({
    orderBy: { id: 'asc' },
    take: 1,
    skip: Math.floor(Math.random() * count)
  });
  if (!puzzleObj) throw new Error('No puzzles in DB');
  return { id: puzzleObj.id, puzzle: puzzleObj.puzzle, solution: puzzleObj.solution };
}
