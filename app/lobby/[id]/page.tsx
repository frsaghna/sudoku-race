"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

export default function LobbyPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [lobbyState, setLobbyState] = useState<any>(null);
  const [playerId, setPlayerId] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");

  // 1. Check LocalStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedName = localStorage.getItem("nickname");
    
    // If no name found, send them back to Home to set it
    if (!storedName) {
      router.push('/');
      return;
    }
    setNickname(storedName);
    
    const storedId = localStorage.getItem(`player_id_${id}`);
    if (storedId) setPlayerId(storedId);
  }, [id, router]);

  // 2. Join Lobby
  useEffect(() => {
    if (!id || !nickname || playerId) return;
    
    fetch(`/api/lobby/${id}/join`, {
      method: 'POST',
      body: JSON.stringify({ nickname }),
      headers: {'Content-Type':'application/json'}
    })
      .then(res => res.json())
      .then(res => {
        if (res.player_id) {
          setPlayerId(res.player_id);
          localStorage.setItem(`player_id_${id}`, res.player_id);
        } else {
          setError(res.error || 'Failed to join');
        }
      });
  }, [id, nickname, playerId]);

  // 3. Poll Logic
  const pollState = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/lobby/${id}/state`);
      if (res.status === 404) {
         setError("Lobby does not exist");
         return;
      }
      const data = await res.json();
      setLobbyState(data);

      if (data.status === 'running' && playerId) {
        router.push(`/game/${id}`);
      }
    } catch (err) { console.error(err); }
  }, [id, playerId, router]);

  useEffect(() => {
    pollState();
    const interval = setInterval(pollState, 2000);
    return () => clearInterval(interval);
  }, [pollState]);

  async function startGame() {
    await fetch(`/api/lobby/${id}/start`, { method: 'POST' });
  }

  // NEW: Leave Lobby Function
  const leaveLobby = async () => {
    if (playerId) {
      // Call API to remove from DB
      await fetch(`/api/lobby/${id}/leave`, {
        method: 'POST',
        body: JSON.stringify({ player_id: playerId }),
        headers: { 'Content-Type': 'application/json' }
      });
      localStorage.removeItem(`player_id_${id}`);
    }
    router.push('/');
  };

  // --- Render ---

  if (!lobbyState) return <div className="text-center text-sky-400 mt-10 animate-pulse">Loading lobby...</div>;

  return (
    <main className="min-h-screen bg-[#181C1F] text-white flex flex-col items-center justify-start py-16 px-4">
      <div className="max-w-lg w-full bg-neutral-900 border border-[#24292F] rounded-2xl shadow-xl p-8 mt-4 relative">
        
        {/* Back / Leave Button */}
        <button 
          onClick={leaveLobby}
          className="absolute top-4 left-4 text-zinc-500 hover:text-white text-sm flex items-center gap-1 transition"
        >
          ← Back to Menu
        </button>

        <h1 className="text-2xl font-bold text-center mt-4">Lobby <span className="text-sky-400 font-mono">{id}</span></h1>
        <div className="text-center text-zinc-500 text-sm mb-6">Waiting for host to start...</div>

        {error && <div className="bg-red-900/20 text-red-400 p-3 rounded mb-4 text-center">{error}</div>}

        <div className="mb-8">
          <div className="font-bold mb-3 text-zinc-300">Players ({lobbyState?.players?.length || 0}):</div>
          <ul className="space-y-2">
            {lobbyState?.players?.map((p: any) => (
              <li key={p.player_id} className="flex items-center justify-between bg-[#21292F] px-4 py-3 rounded border border-[#30363D]">
                <span className="text-zinc-200 font-medium">{p.nickname}</span>
                {p.player_id === playerId && (
                   <span className="text-xs bg-sky-900/50 text-sky-300 px-2 py-1 rounded border border-sky-800">YOU</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {lobbyState?.status === 'waiting' ? (
          <button
            className="w-full py-4 rounded-xl font-bold text-lg bg-sky-600 hover:bg-sky-500 text-white transition shadow-lg"
            onClick={startGame}
          >
            Start Game
          </button>
        ) : (
          <div className="text-center text-emerald-400 font-bold animate-pulse">
             Game starting...
          </div>
        )}
      </div>
    </main>
  );
}