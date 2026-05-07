"use client";
import React, { useState, useEffect, useRef } from "react";

// ---------- Dice ----------
const DiePips = ({ value, size = 56 }) => {
  // pip positions on a 3x3 grid, indexed 1..9
  const layouts = {
    1: [5],
    2: [1, 9],
    3: [1, 5, 9],
    4: [1, 3, 7, 9],
    5: [1, 3, 5, 7, 9],
    6: [1, 3, 4, 6, 7, 9],
  };
  const cells = layouts[value] || [];
  const pip = size * 0.14;
  return (
    <div
      className="grid grid-cols-3 grid-rows-3 p-[14%]"
      style={{ width: size, height: size }}
    >
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
        <div key={i} className="flex items-center justify-center">
          {cells.includes(i) && (
            <div
              className="rounded-full bg-stone-900"
              style={{ width: pip, height: pip }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

const Die = ({ value, held, rolling, onClick, size = 64 }) => {
  return (
    <button
      onClick={onClick}
      className={`relative shrink-0 rounded-2xl border-2 transition-all duration-200 active:scale-95 ${
        held
          ? "border-amber-500 bg-amber-50 shadow-[0_0_0_4px_rgba(245,158,11,0.15)]"
          : "border-stone-300 bg-white shadow-md hover:shadow-lg"
      } ${rolling && !held ? "animate-spin-slow" : ""}`}
      style={{ width: size + 12, height: size + 12 }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <DiePips value={value} size={size} />
      </div>
      {held && (
        <div className="absolute -top-2 -right-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow">
          Vast
        </div>
      )}
    </button>
  );
};

// ---------- Yahtzee scoring ----------
const counts = (dice) => {
  const c = [0, 0, 0, 0, 0, 0, 0];
  dice.forEach((d) => (c[d] = (c[d] || 0) + 1));
  return c;
};
const sumDice = (dice) => dice.reduce((a, b) => a + b, 0);
const sumOfFace = (dice, face) =>
  dice.filter((d) => d === face).reduce((a, b) => a + b, 0);

const scorers = {
  ones: (d) => sumOfFace(d, 1),
  twos: (d) => sumOfFace(d, 2),
  threes: (d) => sumOfFace(d, 3),
  fours: (d) => sumOfFace(d, 4),
  fives: (d) => sumOfFace(d, 5),
  sixes: (d) => sumOfFace(d, 6),
  threeKind: (d) => (counts(d).some((c) => c >= 3) ? sumDice(d) : 0),
  fourKind: (d) => (counts(d).some((c) => c >= 4) ? sumDice(d) : 0),
  fullHouse: (d) => {
    const c = counts(d).filter((x) => x > 0);
    return c.includes(3) && c.includes(2) ? 25 : 0;
  },
  smallStraight: (d) => {
    const set = new Set(d);
    const runs = [
      [1, 2, 3, 4],
      [2, 3, 4, 5],
      [3, 4, 5, 6],
    ];
    return runs.some((r) => r.every((n) => set.has(n))) ? 30 : 0;
  },
  largeStraight: (d) => {
    const set = new Set(d);
    const runs = [
      [1, 2, 3, 4, 5],
      [2, 3, 4, 5, 6],
    ];
    return runs.some((r) => r.every((n) => set.has(n))) ? 40 : 0;
  },
  yahtzee: (d) => (counts(d).some((c) => c === 5) ? 50 : 0),
  chance: (d) => sumDice(d),
};

const categories = [
  { key: "ones", label: "Enen", help: "Som van alle 1-en" },
  { key: "twos", label: "Tweeën", help: "Som van alle 2-en" },
  { key: "threes", label: "Drieën", help: "Som van alle 3-en" },
  { key: "fours", label: "Vieren", help: "Som van alle 4-en" },
  { key: "fives", label: "Vijven", help: "Som van alle 5-en" },
  { key: "sixes", label: "Zessen", help: "Som van alle 6-en" },
  { key: "threeKind", label: "Three of a Kind", help: "3 dezelfde — som van alle dobbelstenen" },
  { key: "fourKind", label: "Four of a Kind", help: "4 dezelfde — som van alle dobbelstenen" },
  { key: "fullHouse", label: "Full House", help: "3 + 2 = 25 punten" },
  { key: "smallStraight", label: "Kleine Straat", help: "4 op rij = 30 punten" },
  { key: "largeStraight", label: "Grote Straat", help: "5 op rij = 40 punten" },
  { key: "yahtzee", label: "Yahtzee", help: "5 dezelfde = 50 punten" },
  { key: "chance", label: "Chance", help: "Som van alle dobbelstenen" },
];

const upperKeys = ["ones", "twos", "threes", "fours", "fives", "sixes"];

const blankCard = () =>
  Object.fromEntries(categories.map((c) => [c.key, null]));

const upperSubtotal = (card) =>
  upperKeys.reduce((s, k) => s + (card[k] ?? 0), 0);
const upperBonus = (card) => (upperSubtotal(card) >= 63 ? 35 : 0);
const totalScore = (card) =>
  categories.reduce((s, c) => s + (card[c.key] ?? 0), 0) + upperBonus(card);

// ---------- App ----------
export default function App() {
  const [mode, setMode] = useState("menu"); // menu | yahtzee | freedice
  return (
    <div className="min-h-screen bg-stone-100 font-serif text-stone-900">
      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        .animate-spin-slow { animation: spin-slow 0.45s linear infinite; }
        @keyframes pop { 0%{transform:scale(.8);opacity:0} 100%{transform:scale(1);opacity:1} }
        .animate-pop { animation: pop .25s ease-out; }
      `}</style>
      {mode === "menu" && <Menu onPick={setMode} />}
      {mode === "yahtzee" && <Yahtzee onExit={() => setMode("menu")} />}
      {mode === "freedice" && <FreeDice onExit={() => setMode("menu")} />}
    </div>
  );
}

function Menu({ onPick }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-10">
      <div className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-amber-700">
        Terras Editie
      </div>
      <h1 className="mb-1 text-center text-5xl font-black tracking-tight">
        Dobbel
      </h1>
      <p className="mb-10 text-center text-stone-600">
        Geen spel meegenomen? Geen probleem.
      </p>

      <button
        onClick={() => onPick("yahtzee")}
        className="group mb-4 flex w-full items-center justify-between rounded-2xl border-2 border-stone-900 bg-stone-900 p-6 text-white shadow-lg transition active:scale-[0.98]"
      >
        <div className="text-left">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Klassieker
          </div>
          <div className="text-2xl font-bold">Yahtzee</div>
          <div className="text-sm text-stone-300">Met scorekaart, 1–4 spelers</div>
        </div>
        <div className="text-3xl">→</div>
      </button>

      <button
        onClick={() => onPick("freedice")}
        className="group flex w-full items-center justify-between rounded-2xl border-2 border-stone-900 bg-white p-6 shadow-lg transition active:scale-[0.98]"
      >
        <div className="text-left">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-700">
            Voor andere spellen
          </div>
          <div className="text-2xl font-bold">Losse dobbelstenen</div>
          <div className="text-sm text-stone-600">1–6 stuks, gewoon rollen</div>
        </div>
        <div className="text-3xl">→</div>
      </button>

      <div className="mt-12 text-center text-xs text-stone-500">
        Tik op een dobbelsteen om hem te <span className="font-bold text-amber-700">houden</span> tussen worpen.
      </div>
    </div>
  );
}

// ---------- Shake detection hook ----------
function useShake(onShake, enabled = true) {
  const [needsPermission, setNeedsPermission] = useState(false);
  const [granted, setGranted] = useState(false);
  const lastShake = useRef(0);
  const onShakeRef = useRef(onShake);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    onShakeRef.current = onShake;
  }, [onShake]);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // Detect once whether iOS-style permission is required
  useEffect(() => {
    if (typeof window === "undefined") return;
    const needsPerm =
      typeof DeviceMotionEvent !== "undefined" &&
      typeof DeviceMotionEvent.requestPermission === "function";
    if (needsPerm && !granted) {
      setNeedsPermission(true);
    }
  }, [granted]);

  // Attach the motion listener once we have permission (or on Android where none is needed)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const needsPerm =
      typeof DeviceMotionEvent !== "undefined" &&
      typeof DeviceMotionEvent.requestPermission === "function";
    if (needsPerm && !granted) return;

    const handler = (e) => {
      if (!enabledRef.current) return;
      const a = e.accelerationIncludingGravity || e.acceleration;
      if (!a) return;
      const mag = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2);
      if (mag > 22) {
        const now = Date.now();
        if (now - lastShake.current > 800) {
          lastShake.current = now;
          onShakeRef.current && onShakeRef.current();
        }
      }
    };
    window.addEventListener("devicemotion", handler);
    return () => window.removeEventListener("devicemotion", handler);
  }, [granted]);

  // CRUCIAL for iOS: call requestPermission directly inside the click handler,
  // synchronously — no async/await wrapper before the call.
  const requestPermission = () => {
    if (
      typeof DeviceMotionEvent !== "undefined" &&
      typeof DeviceMotionEvent.requestPermission === "function"
    ) {
      DeviceMotionEvent.requestPermission()
        .then((res) => {
          if (res === "granted") {
            setGranted(true);
            setNeedsPermission(false);
          } else {
            alert("Toegang geweigerd. Schudden werkt nu niet — je kunt op de werp-knop tikken.");
          }
        })
        .catch(() => {
          alert("Schudden kon niet worden geactiveerd op dit apparaat.");
        });
    } else {
      // No permission needed on this device
      setGranted(true);
      setNeedsPermission(false);
    }
  };

  return { needsPermission, requestPermission };
}

// ---------- Free dice ----------
function FreeDice({ onExit }) {
  const [count, setCount] = useState(2);
  const [dice, setDice] = useState([1, 1]);
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    setDice((prev) => {
      const next = Array.from({ length: count }, (_, i) => prev[i] ?? 1);
      return next;
    });
  }, [count]);

  const roll = () => {
    if (rolling) return;
    setRolling(true);
    if (navigator.vibrate) navigator.vibrate(40);
    let ticks = 0;
    const id = setInterval(() => {
      setDice(Array.from({ length: count }, () => 1 + Math.floor(Math.random() * 6)));
      ticks++;
      if (ticks > 8) {
        clearInterval(id);
        setRolling(false);
      }
    }, 60);
  };

  const { needsPermission, requestPermission } = useShake(roll, true);

  const total = sumDice(dice);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-6">
      <header className="mb-6 flex items-center justify-between">
        <button onClick={onExit} className="text-sm font-bold text-stone-600">
          ← Menu
        </button>
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-amber-700">
          Losse Dobbelstenen
        </div>
        <div className="w-12" />
      </header>

      <div className="mb-6 rounded-2xl border-2 border-stone-300 bg-white p-4">
        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">
          Aantal dobbelstenen
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              className={`h-10 flex-1 rounded-lg border-2 font-bold transition ${
                count === n
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-300 bg-white text-stone-700"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-stone-300 bg-gradient-to-br from-emerald-700 to-emerald-900 p-6 shadow-inner">
        <div className="flex flex-wrap justify-center gap-3">
          {dice.map((v, i) => (
            <Die key={i} value={v} held={false} rolling={rolling} onClick={() => {}} size={56} />
          ))}
        </div>
        <div className="mt-6 rounded-full bg-white/10 px-4 py-1 text-sm font-bold text-amber-300">
          Totaal: {total}
        </div>
      </div>

      <button
        onClick={roll}
        disabled={rolling}
        className="rounded-2xl border-2 border-stone-900 bg-amber-400 p-5 text-2xl font-black uppercase tracking-wider text-stone-900 shadow-lg transition active:scale-[0.98] disabled:opacity-60"
      >
        {rolling ? "Rollen…" : "Werp"}
      </button>

      {needsPermission ? (
        <button
          onClick={requestPermission}
          className="mt-3 rounded-xl border-2 border-amber-500 bg-amber-50 p-3 text-sm font-bold text-amber-800"
        >
          📱 Tik hier om schudden te activeren
        </button>
      ) : (
        <div className="mt-3 text-center text-xs text-stone-500">
          📱 Of schud je telefoon om te werpen
        </div>
      )}
    </div>
  );
}

// ---------- Yahtzee ----------
function Yahtzee({ onExit }) {
  const [setupDone, setSetupDone] = useState(false);
  const [players, setPlayers] = useState(["Speler 1", "Speler 2"]);
  const [cards, setCards] = useState(null);
  const [turnIdx, setTurnIdx] = useState(0);
  const [dice, setDice] = useState([1, 1, 1, 1, 1]);
  const [held, setHeld] = useState([false, false, false, false, false]);
  const [rollsLeft, setRollsLeft] = useState(3);
  const [rolling, setRolling] = useState(false);
  const [hasRolled, setHasRolled] = useState(false);
  const [showScoreSheet, setShowScoreSheet] = useState(false);

  const startGame = () => {
    setCards(players.map(() => blankCard()));
    setTurnIdx(0);
    setDice([1, 1, 1, 1, 1]);
    setHeld([false, false, false, false, false]);
    setRollsLeft(3);
    setHasRolled(false);
    setSetupDone(true);
  };

  const roll = () => {
    if (rollsLeft === 0 || rolling) return;
    setRolling(true);
    if (navigator.vibrate) navigator.vibrate(40);
    let ticks = 0;
    const id = setInterval(() => {
      setDice((prev) =>
        prev.map((v, i) => (held[i] ? v : 1 + Math.floor(Math.random() * 6)))
      );
      ticks++;
      if (ticks > 8) {
        clearInterval(id);
        setRolling(false);
        setRollsLeft((r) => r - 1);
        setHasRolled(true);
      }
    }, 60);
  };

  const toggleHold = (i) => {
    if (!hasRolled || rolling) return;
    setHeld((h) => h.map((v, idx) => (idx === i ? !v : v)));
  };

  const { needsPermission, requestPermission } = useShake(
    roll,
    rollsLeft > 0 && !rolling && !showScoreSheet
  );

  const allFilled = (card) => categories.every((c) => card[c.key] !== null);

  const score = (catKey) => {
    if (!hasRolled) return;
    const card = cards[turnIdx];
    if (card[catKey] !== null) return;
    const points = scorers[catKey](dice);
    const newCards = cards.map((c, i) =>
      i === turnIdx ? { ...c, [catKey]: points } : c
    );
    setCards(newCards);

    // next turn
    const finished = newCards.every(allFilled);
    if (finished) {
      // stay so user sees final state; show sheet
      setShowScoreSheet(true);
      return;
    }
    setTurnIdx((t) => (t + 1) % players.length);
    setDice([1, 1, 1, 1, 1]);
    setHeld([false, false, false, false, false]);
    setRollsLeft(3);
    setHasRolled(false);
  };

  if (!setupDone) {
    return (
      <YahtzeeSetup
        players={players}
        setPlayers={setPlayers}
        onStart={startGame}
        onExit={onExit}
      />
    );
  }

  const card = cards[turnIdx];
  const gameOver = cards.every(allFilled);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-5">
      <header className="mb-3 flex items-center justify-between">
        <button onClick={onExit} className="text-sm font-bold text-stone-600">
          ← Menu
        </button>
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-amber-700">
          Yahtzee
        </div>
        <button
          onClick={() => setShowScoreSheet(true)}
          className="rounded-full border border-stone-400 px-3 py-1 text-xs font-bold text-stone-700"
        >
          Scores
        </button>
      </header>

      {/* player tabs */}
      <div className="mb-3 flex gap-2 overflow-x-auto">
        {players.map((p, i) => (
          <div
            key={i}
            className={`flex-1 rounded-xl border-2 px-3 py-2 text-center transition ${
              i === turnIdx
                ? "border-amber-500 bg-amber-50"
                : "border-stone-200 bg-white opacity-60"
            }`}
          >
            <div className="truncate text-xs font-bold uppercase tracking-wider text-stone-600">
              {p}
            </div>
            <div className="text-lg font-black">{totalScore(cards[i])}</div>
          </div>
        ))}
      </div>

      {/* dice tray */}
      <div className="mb-3 rounded-2xl border-2 border-stone-300 bg-gradient-to-br from-emerald-700 to-emerald-900 p-4 shadow-inner">
        <div className="mb-3 flex items-center justify-between text-white">
          <div className="text-sm font-bold">{players[turnIdx]} aan zet</div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
            {rollsLeft} {rollsLeft === 1 ? "worp" : "worpen"} over
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {dice.map((v, i) => (
            <Die
              key={i}
              value={v}
              held={held[i]}
              rolling={rolling}
              onClick={() => toggleHold(i)}
              size={48}
            />
          ))}
        </div>
        {hasRolled && (
          <div className="mt-3 text-center text-xs text-emerald-100">
            Tik op een dobbelsteen om vast te houden
          </div>
        )}
        {!hasRolled && !needsPermission && (
          <div className="mt-3 text-center text-xs text-emerald-100">
            📱 Schud of tik op werp
          </div>
        )}
      </div>

      {needsPermission && (
        <button
          onClick={requestPermission}
          className="mb-3 rounded-xl border-2 border-amber-500 bg-amber-50 p-3 text-sm font-bold text-amber-800"
        >
          📱 Tik hier om schudden te activeren
        </button>
      )}

      {/* roll button */}
      <button
        onClick={roll}
        disabled={rollsLeft === 0 || rolling || gameOver}
        className="mb-3 rounded-2xl border-2 border-stone-900 bg-amber-400 p-4 text-xl font-black uppercase tracking-wider text-stone-900 shadow-lg transition active:scale-[0.98] disabled:opacity-50"
      >
        {rolling ? "Rollen…" : rollsLeft === 3 ? "Eerste worp" : "Werp opnieuw"}
      </button>

      {/* scorecard for current player */}
      <div className="rounded-2xl border-2 border-stone-300 bg-white p-2 shadow">
        <div className="mb-1 px-2 pt-1 text-xs font-bold uppercase tracking-wider text-stone-500">
          Kies een vakje voor {players[turnIdx]}
        </div>
        <div className="divide-y divide-stone-100">
          {categories.map((c) => {
            const used = card[c.key] !== null;
            const preview = hasRolled && !used ? scorers[c.key](dice) : null;
            return (
              <button
                key={c.key}
                onClick={() => score(c.key)}
                disabled={used || !hasRolled}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition ${
                  used
                    ? "bg-stone-50 text-stone-400"
                    : hasRolled
                    ? "active:bg-amber-50"
                    : "text-stone-400"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="font-bold">{c.label}</div>
                  <div className="truncate text-[11px] text-stone-500">
                    {c.help}
                  </div>
                </div>
                <div className="ml-3 shrink-0">
                  {used ? (
                    <div className="rounded-md bg-stone-200 px-2 py-1 text-sm font-black text-stone-700">
                      {card[c.key]}
                    </div>
                  ) : preview !== null ? (
                    <div
                      className={`rounded-md px-2 py-1 text-sm font-black ${
                        preview > 0
                          ? "bg-amber-400 text-stone-900"
                          : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      +{preview}
                    </div>
                  ) : (
                    <div className="text-sm text-stone-300">—</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* totals */}
        <div className="mt-2 space-y-1 border-t-2 border-stone-200 px-3 pt-3 text-sm">
          <div className="flex justify-between text-stone-600">
            <span>Subtotaal boven</span>
            <span className="font-bold">{upperSubtotal(card)} / 63</span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Bonus</span>
            <span className="font-bold">{upperBonus(card)}</span>
          </div>
          <div className="flex justify-between text-base">
            <span className="font-bold">Totaal</span>
            <span className="font-black text-amber-700">{totalScore(card)}</span>
          </div>
        </div>
      </div>

      {showScoreSheet && (
        <ScoreSheet
          players={players}
          cards={cards}
          gameOver={gameOver}
          onClose={() => setShowScoreSheet(false)}
          onNewGame={() => {
            setShowScoreSheet(false);
            setSetupDone(false);
          }}
        />
      )}
    </div>
  );
}

function YahtzeeSetup({ players, setPlayers, onStart, onExit }) {
  const updateName = (i, v) =>
    setPlayers((p) => p.map((n, idx) => (idx === i ? v : n)));
  const addPlayer = () =>
    players.length < 4 && setPlayers([...players, `Speler ${players.length + 1}`]);
  const removePlayer = (i) =>
    players.length > 1 && setPlayers(players.filter((_, idx) => idx !== i));

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-6">
      <header className="mb-6 flex items-center justify-between">
        <button onClick={onExit} className="text-sm font-bold text-stone-600">
          ← Menu
        </button>
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-amber-700">
          Nieuw Spel
        </div>
        <div className="w-12" />
      </header>

      <h2 className="mb-1 text-3xl font-black">Wie speelt mee?</h2>
      <p className="mb-6 text-stone-600">1 tot 4 spelers</p>

      <div className="mb-4 space-y-2">
        {players.map((p, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={p}
              onChange={(e) => updateName(i, e.target.value)}
              className="flex-1 rounded-xl border-2 border-stone-300 bg-white px-4 py-3 font-bold focus:border-amber-500 focus:outline-none"
              placeholder={`Speler ${i + 1}`}
            />
            {players.length > 1 && (
              <button
                onClick={() => removePlayer(i)}
                className="rounded-xl border-2 border-stone-300 bg-white px-3 font-bold text-stone-500"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {players.length < 4 && (
        <button
          onClick={addPlayer}
          className="mb-6 rounded-xl border-2 border-dashed border-stone-400 py-3 font-bold text-stone-600"
        >
          + Speler toevoegen
        </button>
      )}

      <button
        onClick={onStart}
        className="mt-auto rounded-2xl border-2 border-stone-900 bg-stone-900 p-5 text-xl font-black uppercase tracking-wider text-white shadow-lg transition active:scale-[0.98]"
      >
        Start spel
      </button>
    </div>
  );
}

function ScoreSheet({ players, cards, gameOver, onClose, onNewGame }) {
  const totals = cards.map(totalScore);
  const max = Math.max(...totals);
  const winners = players.filter((_, i) => totals[i] === max);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/60 p-2 sm:items-center">
      <div className="animate-pop max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-2xl font-black">
            {gameOver ? "Eindstand" : "Scorekaart"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full bg-stone-100 px-3 py-1 text-sm font-bold"
          >
            Sluit
          </button>
        </div>

        {gameOver && (
          <div className="mb-4 rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 text-center">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-700">
              {winners.length > 1 ? "Gelijkspel!" : "Winnaar"}
            </div>
            <div className="text-2xl font-black">{winners.join(" & ")}</div>
            <div className="text-sm text-stone-600">{max} punten</div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-stone-200">
                <th className="py-2 text-left font-bold text-stone-500">Vak</th>
                {players.map((p, i) => (
                  <th
                    key={i}
                    className="py-2 text-right font-bold text-stone-700"
                  >
                    {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.key} className="border-b border-stone-100">
                  <td className="py-1.5 text-stone-600">{c.label}</td>
                  {cards.map((card, i) => (
                    <td key={i} className="py-1.5 text-right font-bold">
                      {card[c.key] === null ? "—" : card[c.key]}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t-2 border-stone-300">
                <td className="py-2 font-bold">Bonus</td>
                {cards.map((card, i) => (
                  <td key={i} className="py-2 text-right">
                    {upperBonus(card)}
                  </td>
                ))}
              </tr>
              <tr className="bg-amber-50">
                <td className="py-3 text-base font-black">Totaal</td>
                {cards.map((card, i) => (
                  <td
                    key={i}
                    className="py-3 text-right text-lg font-black text-amber-700"
                  >
                    {totalScore(card)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {gameOver && (
          <button
            onClick={onNewGame}
            className="mt-5 w-full rounded-2xl border-2 border-stone-900 bg-stone-900 p-4 font-black uppercase tracking-wider text-white"
          >
            Nieuw spel
          </button>
        )}
      </div>
    </div>
  );
}
