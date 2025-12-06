"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  // State
  const [nickname, setNickname] = useState("");
  const [tempName, setTempName] = useState(""); // Used for the input field
  const [hasNickname, setHasNickname] = useState(false);
  
  const [lobbyInput, setLobbyInput] = useState("");
  const [joinError, setJoinError] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  // 1. Load Nickname on Mount
  useEffect(() => {
    const saved = typeof window !== "undefined" && window.localStorage.getItem("nickname");
    if (saved) {
      setNickname(saved);
      setHasNickname(true);
    }
  }, []);

  // 2. Handle Name Submission
  function handleNicknameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (tempName.trim().length < 2) return;
    
    const finalName = tempName.trim();
    localStorage.setItem("nickname", finalName);
    setNickname(finalName);
    setHasNickname(true);
  }

  // 3. Handle Change Name (Reset Identity)
  function handleChangeName() {
    if (!confirm("Change nickname? This will reset your identity.")) return;
    localStorage.removeItem("nickname");
    setNickname("");
    setTempName("");
    setHasNickname(false);
  }

  // 4. Lobby Actions
  async function handleCreateLobby() {
    setCreating(true);
    try {
      const res = await fetch("/api/lobby/create", { method: "POST" });
      const data = await res.json();
      if (data.lobby_id) {
        router.push(`/lobby/${data.lobby_id}`);
      }
    } catch (error) {
      console.error(error);
      setCreating(false);
    }
  }

  function handleLobbyInput(e: React.FormEvent) {
    e.preventDefault();
    const cleanId = lobbyInput.trim();
    if (cleanId.length < 5) {
      setJoinError("Invalid Lobby ID");
      return;
    }
    setJoinError("");
    setJoining(true);
    router.push(`/lobby/${cleanId}`);
  }

  // --- VIEW 1: ENTER NICKNAME ---
  if (!hasNickname) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-[#181C1F] p-4">
        <div className="bg-[#0D1117] border border-[#30363D] text-white p-8 rounded-2xl shadow-xl text-center w-full max-w-sm">
          <h1 className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400 mb-6">
            SUDOKU RACE
          </h1>
          
          <form onSubmit={handleNicknameSubmit} className="flex flex-col gap-4">
            <div className="text-left">
              <label className="text-sm text-zinc-400 font-bold ml-1">Choose Nickname / Nama</label>
              <input
                className="w-full mt-1 border border-[#30363D] outline-none bg-[#161B22] rounded-xl px-4 py-3 text-lg text-white focus:border-sky-500 transition"
                value={tempName}
                onChange={e => setTempName(e.target.value)}
                placeholder="e.g. SpeedSolver"
                minLength={2}
                maxLength={16}
                autoFocus
                required
              />
            </div>
            <button
              type="submit"
              disabled={!tempName.trim()}
              className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-xl py-3 font-bold shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Playing
            </button>
          </form>
        </div>
      </main>
    );
  }

  // --- VIEW 2: MAIN MENU ---
  return (
    <main className="flex flex-col min-h-screen bg-[#181C1F] items-center justify-center p-4">
      <div className="bg-[#0D1117] border border-[#30363D] text-white p-8 rounded-3xl shadow-2xl max-w-sm w-full flex flex-col gap-6">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400 mb-2">
            SUDOKU RACE
          </h1>
          <div className="flex items-center justify-center gap-2 text-zinc-400 bg-[#161B22] py-1 px-3 rounded-full text-sm inline-block mx-auto border border-[#30363D]">
            <span>Player: <b className="text-sky-300">{nickname}</b></span>
            <button 
              onClick={handleChangeName} 
              className="ml-2 text-xs text-zinc-500 hover:text-white border-l border-zinc-600 pl-2 transition"
            >
              Change
            </button>
          </div>
        </div>

        {/* Create Lobby */}
        <button
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white font-bold shadow-lg border border-emerald-500/30 transition transform active:scale-95 flex items-center justify-center gap-2"
          onClick={handleCreateLobby}
          disabled={creating}
        >
          {creating ? (
            <span className="animate-pulse">Creating...</span>
          ) : (
            <>
              <span>+ Create New Lobby</span>
            </>
          )}
        </button>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#30363D]"></div>
            <span className="flex-shrink-0 mx-4 text-zinc-600 text-xs font-bold uppercase">Or Join Game</span>
            <div className="flex-grow border-t border-[#30363D]"></div>
        </div>

        {/* Join Lobby */}
        <form onSubmit={handleLobbyInput} className="w-full flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              className="flex-1 border border-[#30363D] outline-none bg-[#161B22] rounded-xl px-4 py-3 text-base text-white focus:border-sky-500 font-mono transition"
              placeholder="Paste Lobby ID"
              value={lobbyInput}
              onChange={e => setLobbyInput(e.target.value)}
              required
            />
            <button
              type="submit"
              className="bg-[#21262D] hover:bg-[#30363D] border border-[#30363D] text-white font-bold px-6 rounded-xl transition shadow"
              disabled={joining}
            >
              {joining ? "..." : "Join"}
            </button>
          </div>
          {joinError && <div className="text-center text-xs text-red-400 font-bold mt-1">{joinError}</div>}
        </form>

      </div>
    </main>
  );
}