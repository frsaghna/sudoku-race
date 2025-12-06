-- CreateTable
CREATE TABLE "Puzzle" (
    "id" TEXT NOT NULL,
    "puzzle" TEXT NOT NULL,
    "solution" TEXT NOT NULL,

    CONSTRAINT "Puzzle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lobby" (
    "id" TEXT NOT NULL,
    "puzzle_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "start_time" TIMESTAMP(3),

    CONSTRAINT "Lobby_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LobbyPlayer" (
    "id" TEXT NOT NULL,
    "lobby_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "mistakes" INTEGER NOT NULL DEFAULT 0,
    "finished" BOOLEAN NOT NULL DEFAULT false,
    "finish_time" TIMESTAMP(3),
    "current_board" TEXT NOT NULL,

    CONSTRAINT "LobbyPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LobbyPlayer_lobby_id_player_id_key" ON "LobbyPlayer"("lobby_id", "player_id");

-- AddForeignKey
ALTER TABLE "Lobby" ADD CONSTRAINT "Lobby_puzzle_id_fkey" FOREIGN KEY ("puzzle_id") REFERENCES "Puzzle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LobbyPlayer" ADD CONSTRAINT "LobbyPlayer_lobby_id_fkey" FOREIGN KEY ("lobby_id") REFERENCES "Lobby"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
