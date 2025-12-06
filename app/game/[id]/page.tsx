"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

// --- Types ---
interface Player {
  nickname: string;
  player_id: string;
  mistakes: number;
  health: number;
  finished: boolean;
  progress: number;
  current_board: string;
}

interface GameState {
  status: string;
  puzzle: string;
  players: Player[];
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full h-2 bg-[#24292F] rounded-full overflow-hidden border border-[#30363D]">
      <div
        className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-500 ease-out"
        style={{ width: `${(Math.min(progress, 1) * 100).toFixed(1)}%` }}
      />
    </div>
  );
}

// Helper to generate empty notes array
const createEmptyNotes = () => Array.from({ length: 81 }, () => [] as string[]);

export default function GamePage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [state, setState] = useState<GameState | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Game State
  const [localBoard, setLocalBoard] = useState<string[] | null>(null);
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [notes, setNotes] = useState<string[][]>(createEmptyNotes());
  
  // --- SELECTION & ERROR STATES ---
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [wrongCell, setWrongCell] = useState<number | null>(null);

  const nickname = typeof window !== "undefined" ? localStorage.getItem("nickname") : "";
  const playerId = typeof window !== "undefined" ? localStorage.getItem(`player_id_${id}`) : "";

  // 1. Polling Logic
  const fetchState = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/lobby/${id}/state`);
      if (!res.ok) throw new Error(await res.text());
      const data: GameState = await res.json();
      setState(data);
      
      const myData = data.players.find((p) => p.player_id === playerId);
      if (myData) {
         if (!localBoard) {
            setLocalBoard(myData.current_board.split(''));
         }
      }
      setError("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setInitialLoading(false);
    }
  }, [id, playerId, localBoard]);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 2000);
    return () => clearInterval(interval);
  }, [fetchState]);

  // 2. Input Logic
  async function handleInput(index: number, value: string) {
    if (!playerId || !state || !localBoard) return;

    // A. NOTE MODE
    if (isNoteMode) {
      if (localBoard[index] !== "0") return;
      setNotes(prev => {
        const newNotes = [...prev];
        const currentCellNotes = [...newNotes[index]];
        if (currentCellNotes.includes(value)) {
          newNotes[index] = currentCellNotes.filter(n => n !== value);
        } else {
          newNotes[index] = [...currentCellNotes, value];
        }
        return newNotes;
      });
      return; 
    }

    // B. NORMAL MOVE
    const newBoard = [...localBoard];
    newBoard[index] = value;
    setLocalBoard(newBoard);
    
    setNotes(prev => {
      const newNotes = [...prev];
      newNotes[index] = [];
      return newNotes;
    });

    try {
      const res = await fetch(`/api/lobby/${id}/move`, {
        method: 'POST',
        body: JSON.stringify({ player_id: playerId, cell: index, value }),
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await res.json();

      if (data.success && !data.is_correct) {
        setWrongCell(index);
        setTimeout(() => {
          setLocalBoard(prev => {
             if (!prev) return null;
             const reverted = [...prev];
             reverted[index] = "0"; 
             return reverted;
          });
          setWrongCell(null); 
        }, 500);
      }
    } catch (e) {
      console.error("Move failed", e);
    }
  }

  // 3. Give Up Function (FIXED: Properly closed)
  const handleGiveUp = async () => {
    if (!confirm("Are you sure you want to give up? You will be removed from the game.")) return;
    
    // 1. Get player ID before we delete it
    let pid = null;
    if (typeof window !== "undefined") {
       pid = localStorage.getItem(`player_id_${id}`);
       // Remove local reference immediately
       localStorage.removeItem(`player_id_${id}`);
    }

    // 2. Call API to remove from DB
    if (pid) {
      try {
        await fetch(`/api/lobby/${id}/leave`, {
          method: 'POST',
          body: JSON.stringify({ player_id: pid }),
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (e) {
        console.error("Failed to leave server side", e);
      }
    }

    // 3. Redirect to Main Link (Home)
    router.push('/');
  };

  // 4. Render Grid Function (FIXED: Logic moved here)
  function renderGrid() {
    // Validation check first
    if (!state?.puzzle || !localBoard) return null;

    const myData = state.players.find((p) => p.player_id === playerId);
    const isDead = (myData?.health || 0) <= 0;
    const isFinished = myData?.finished;

    const grid = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const i = r * 9 + c;
        const isClue = state.puzzle[i] !== "0";
        const currentValue = localBoard[i];
        
        // Borders
        const borderRight = (c === 2 || c === 5) ? "border-r-[3px] border-r-[#58A6FF] " : "";
        const borderBottom = (r === 2 || r === 5) ? "border-b-[3px] border-b-[#58A6FF] " : "";
        
        // Styling
        let bgStyle = "bg-[#1C2227]"; 
        let textStyle = "text-sky-300";

        const isSelected = selectedCell === i;
        const isWrong = wrongCell === i;

        if (isClue) {
           bgStyle = "bg-[#161B22]";
           textStyle = "text-zinc-500 font-bold";
        } else if (isWrong) {
           bgStyle = "bg-red-900/50";
           textStyle = "text-red-500 font-bold";
        } else if (isSelected) {
           bgStyle = "bg-[#2A3441]";
           textStyle = "text-sky-300";
        } else if (currentValue === "0") {
           bgStyle = "bg-[#1C2227] hover:bg-[#222]";
           textStyle = "text-sky-400";
        } else {
           bgStyle = "bg-[#1C2227]";
           textStyle = "text-sky-400 font-bold";
        }

        const selectionRing = isSelected ? "ring-2 ring-sky-400 z-20" : "border border-[#30363D]";
        const isDisabled = isClue || isFinished || isDead;

        // PUSH TO GRID ARRAY 
        grid.push(
          <div 
            key={i} 
            className={`relative w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 ${borderRight} ${borderBottom} ${bgStyle} ${selectionRing} transition-colors duration-150`}
          >
            {/* Notes Layer */}
            {currentValue === "0" && !isClue && (
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none p-0.5 z-0">
                {[1,2,3,4,5,6,7,8,9].map(n => (
                  <div key={n} className="flex items-center justify-center text-[8px] sm:text-[10px] leading-none text-zinc-500 font-mono">
                    {notes[i].includes(n.toString()) ? n : ''}
                  </div>
                ))}
              </div>
            )}

            {/* Input Layer */}
            <input
              type="text"
              inputMode="numeric"
              maxLength={1}
              disabled={isDisabled}
              className={`absolute inset-0 w-full h-full bg-transparent text-center outline-none cursor-pointer caret-transparent ${textStyle} text-lg md:text-2xl z-10`}
              value={currentValue === "0" ? "" : currentValue}
              onFocus={() => setSelectedCell(i)}
              onChange={(e) => {
                const val = e.target.value.slice(-1).replace(/[^1-9]/, ""); 
                if (val) {
                    handleInput(i, val);
                    if (isNoteMode) e.target.value = ""; 
                }
              }}
              onKeyDown={(e) => {
                if (e.key.toLowerCase() === 'n') setIsNoteMode(prev => !prev);
              }}
            />
          </div>
        );
      }
    }

    // RETURN THE GRID UI
    return (
      <div className="relative">
        <div className="grid grid-cols-9 bg-[#0d1117] border-[3px] border-[#58A6FF] rounded-lg overflow-hidden shadow-2xl">
          {grid}
        </div>
        {isDead && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-lg backdrop-blur-sm z-20">
            <div className="text-red-500 text-3xl font-bold uppercase tracking-widest">Game Over</div>
          </div>
        )}
      </div>
    );
  }

  // --- MAIN COMPONENT RETURN ---
  if (!id) return <div className="text-center text-red-400 mt-8">Invalid Game ID</div>;
  if (initialLoading) return <div className="min-h-screen flex items-center justify-center bg-[#181C1F] text-sky-400 animate-pulse">Loading Game...</div>;
  if (error) return <div className="text-center text-red-400 mt-8">{error}</div>;

  return (
    <main className="min-h-screen bg-[#0D1117] text-white flex flex-col items-center py-8 px-2 sm:px-4 font-sans">
      <div className="w-full max-w-4xl flex flex-col items-center gap-6">
        
        {/* Header with Give Up */}
        <div className="w-full flex justify-between items-start">
             {/* Left: Give Up Button */}
            <button 
                onClick={handleGiveUp}
                className="text-xs sm:text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 px-3 py-1 rounded border border-transparent hover:border-red-900 transition"
            >
                ← Give Up
            </button>

            {/* Center: Title */}
            <div className="text-center">
                <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">
                    SUDOKU RACE
                </h1>
                <div className="bg-[#161B22] border border-[#30363D] px-4 py-1 rounded-full text-sm font-mono text-zinc-400 mt-2">
                  Lobby: <span className="text-sky-400">{id}</span>
                </div>
            </div>

            {/* Right: Spacer */}
            <div className="w-16"></div> 
        </div>

        {/* Controls */}
        <div className="flex gap-4">
           <button
             onClick={() => setIsNoteMode(!isNoteMode)}
             className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all ${
               isNoteMode 
                 ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]" 
                 : "bg-[#161B22] text-zinc-400 border border-[#30363D] hover:bg-[#21292F]"
             }`}
           >
             {isNoteMode ? "✎ Pencil Mode (ON)" : "✒ Pen Mode (OFF)"}
           </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 w-full items-start justify-center">
          <div className="flex-shrink-0 mx-auto">
             {renderGrid()}
             <div className="mt-4 text-center text-zinc-500 text-sm">
               Press 'N' to toggle Pencil Mode • Tap cell to add notes
             </div>
          </div>

          {/* Leaderboard */}
          <div className="w-full lg:w-80 flex flex-col gap-4">
             <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-4 shadow-lg">
                <h3 className="text-zinc-100 font-bold mb-4 flex items-center gap-2">Live Standings</h3>
                <ul className="space-y-3">
                  {state?.players.sort((a, b) => b.progress - a.progress).map((p) => (
                    <li key={p.player_id} className="relative p-3 rounded-lg border bg-[#0D1117] border-[#30363D]">
                      <div className="flex justify-between items-center mb-2">
                        <span className={`font-bold ${p.player_id === playerId ? "text-sky-400" : "text-zinc-300"}`}>{p.nickname}</span>
                        <span className="text-emerald-400 font-mono font-bold">HP: {p.health}/5</span>
                      </div>
                      <ProgressBar progress={p.progress} />
                    </li>
                  ))}
                </ul>
             </div>
          </div>
        </div>
      </div>
    </main>
  );
}