"use client";
import React, { useState, useEffect, useRef } from "react";

const CATEGORIES = [
  { key: "hoogte", label: "Hoogte", emoji: "🚀", help: "Hoe hoog kwam die sprong?" },
  { key: "plons", label: "Plons", emoji: "💦", help: "Hoe groot was de plons?" },
  { key: "stijl", label: "Stijl", emoji: "🎨", help: "Hoe gaaf was het truukje?" },
];

const jumpTotal = (jump) => jump.hoogte + jump.plons + jump.stijl;
const defaultScores = () => ({ hoogte: 5, plons: 5, stijl: 5 });

export default function Bommetjes({ onExit }) {
  const [setupDone, setSetupDone] = useState(false);
  const [players, setPlayers] = useState(["Speler 1", "Speler 2"]);
  const [jumps, setJumps] = useState(null); // jumps[playerIdx] = [{hoogte,plons,stijl,round}]
  const [turnIdx, setTurnIdx] = useState(0);
  const [round, setRound] = useState(1);
  const [scores, setScores] = useState(defaultScores());
  const [showBoard, setShowBoard] = useState(false);
  const [showCameraMeter, setShowCameraMeter] = useState(false);

  const startGame = () => {
    setJumps(players.map(() => []));
    setTurnIdx(0);
    setRound(1);
    setScores(defaultScores());
    setSetupDone(true);
  };

  const saveJump = () => {
    const jump = { ...scores, round };
    setJumps((prev) =>
      prev.map((arr, i) => (i === turnIdx ? [...arr, jump] : arr))
    );
    const nextIdx = (turnIdx + 1) % players.length;
    if (nextIdx === 0) setRound((r) => r + 1);
    setTurnIdx(nextIdx);
    setScores(defaultScores());
    if (navigator.vibrate) navigator.vibrate(30);
  };

  const hasJumps = jumps && jumps.some((arr) => arr.length > 0);

  const undoLast = () => {
    if (!hasJumps) return;
    const prevIdx = (turnIdx - 1 + players.length) % players.length;
    if (jumps[prevIdx].length === 0) return;
    if (turnIdx === 0) setRound((r) => Math.max(1, r - 1));
    setJumps((prev) =>
      prev.map((arr, i) => (i === prevIdx ? arr.slice(0, -1) : arr))
    );
    setTurnIdx(prevIdx);
  };

  if (!setupDone) {
    return (
      <BommetjesSetup
        players={players}
        setPlayers={setPlayers}
        onStart={startGame}
        onExit={onExit}
      />
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-5">
      <header className="mb-3 flex items-center justify-between">
        <button onClick={onExit} className="text-sm font-bold text-stone-600">
          ← Menu
        </button>
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-sky-700">
          Bommetjes
        </div>
        <button
          onClick={() => setShowBoard(true)}
          className="rounded-full border border-stone-400 px-3 py-1 text-xs font-bold text-stone-700"
        >
          Klassement
        </button>
      </header>

      <div className="mb-3 rounded-2xl border-2 border-sky-700 bg-gradient-to-br from-sky-500 to-blue-800 p-4 text-center text-white shadow-inner">
        <div className="text-xs font-bold uppercase tracking-wider text-sky-100">
          Ronde {round}
        </div>
        <div className="text-2xl font-black">{players[turnIdx]} springt!</div>
        <div className="text-sm text-sky-100">
          Beoordeel de sprong hieronder 👇
        </div>
      </div>

      <div className="mb-4 space-y-4 rounded-2xl border-2 border-stone-300 bg-white p-4 shadow">
        {CATEGORIES.map((c) => (
          <div key={c.key}>
            <div className="mb-1 flex items-center justify-between">
              <div className="font-bold text-stone-700">
                {c.emoji} {c.label}
              </div>
              <div className="rounded-md bg-sky-100 px-2 py-0.5 text-lg font-black text-sky-800">
                {scores[c.key]}
              </div>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={scores[c.key]}
              onChange={(e) =>
                setScores((s) => ({ ...s, [c.key]: Number(e.target.value) }))
              }
              className="w-full accent-sky-600"
            />
            <div className="text-[11px] text-stone-500">{c.help}</div>
            {c.key === "plons" && cameraSupported() && (
              <button
                onClick={() => setShowCameraMeter(true)}
                className="mt-2 w-full rounded-xl border-2 border-sky-300 bg-sky-50 py-2 text-xs font-bold text-sky-800"
              >
                📸 Of meet de plons met de camera
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={saveJump}
        className="mb-3 rounded-2xl border-2 border-stone-900 bg-sky-500 p-5 text-xl font-black uppercase tracking-wider text-white shadow-lg transition active:scale-[0.98]"
      >
        Bommetje opslaan ({jumpTotal(scores)} pt)
      </button>

      <button
        onClick={undoLast}
        disabled={!hasJumps}
        className="rounded-xl border-2 border-stone-300 bg-white p-2 text-sm font-bold text-stone-600 transition active:scale-[0.98] disabled:opacity-40"
      >
        ↩ Vorige sprong ongedaan maken
      </button>

      {showBoard && (
        <Klassement
          players={players}
          jumps={jumps}
          onClose={() => setShowBoard(false)}
          onNewGame={() => {
            setShowBoard(false);
            setSetupDone(false);
          }}
        />
      )}

      {showCameraMeter && (
        <CameraSplashMeter
          onResult={(value) => {
            setScores((s) => ({ ...s, plons: value }));
            setShowCameraMeter(false);
          }}
          onClose={() => setShowCameraMeter(false)}
        />
      )}
    </div>
  );
}

function cameraSupported() {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function"
  );
}

const MEASURE_MS = 3000;
const MEASURE_W = 64;
const MEASURE_H = 48;

function CameraSplashMeter({ onResult, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState("starting"); // starting | ready | measuring | error

  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startMeasuring = () => {
    if (status !== "ready") return;
    setStatus("measuring");
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width = MEASURE_W;
    canvas.height = MEASURE_H;
    let prev = null;
    let peak = 0;
    const started = Date.now();

    const tick = () => {
      if (Date.now() - started > MEASURE_MS) {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        const score = Math.max(1, Math.min(10, Math.round(1 + (peak / 40) * 9)));
        onResult(score);
        return;
      }
      ctx.drawImage(video, 0, 0, MEASURE_W, MEASURE_H);
      const frame = ctx.getImageData(0, 0, MEASURE_W, MEASURE_H).data;
      if (prev) {
        let diff = 0;
        for (let i = 0; i < frame.length; i += 4) {
          diff += Math.abs(frame[i] - prev[i]);
        }
        const avgDiff = diff / (MEASURE_W * MEASURE_H);
        if (avgDiff > peak) peak = avgDiff;
      }
      prev = frame;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-black">📸 Plons meten</h3>
          <button
            onClick={onClose}
            className="rounded-full bg-stone-100 px-3 py-1 text-sm font-bold"
          >
            Sluit
          </button>
        </div>

        {status === "error" ? (
          <div className="rounded-xl border-2 border-red-300 bg-red-50 p-3 text-sm text-red-700">
            Geen toegang tot de camera. Scoor de plons handmatig met de schuifbalk.
          </div>
        ) : (
          <>
            <div className="mb-3 overflow-hidden rounded-2xl border-2 border-stone-300 bg-black">
              <video ref={videoRef} playsInline muted className="w-full" />
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <p className="mb-3 text-xs text-stone-500">
              Richt de camera op het water en druk op start vlak vóór de
              sprong. Er wordt 3 seconden gemeten — hoe meer beweging in het
              water, hoe hoger de score.
            </p>
            <button
              onClick={startMeasuring}
              disabled={status !== "ready"}
              className="w-full rounded-2xl border-2 border-stone-900 bg-sky-500 p-4 text-lg font-black uppercase tracking-wider text-white transition active:scale-[0.98] disabled:opacity-50"
            >
              {status === "measuring"
                ? "Meten…"
                : status === "starting"
                ? "Camera starten…"
                : "Start meting"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function BommetjesSetup({ players, setPlayers, onStart, onExit }) {
  const updateName = (i, v) =>
    setPlayers((p) => p.map((n, idx) => (idx === i ? v : n)));
  const addPlayer = () => {
    if (players.length >= 8) return;
    setPlayers([...players, `Speler ${players.length + 1}`]);
  };
  const removePlayer = (i) => {
    if (players.length <= 1) return;
    setPlayers(players.filter((_, idx) => idx !== i));
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-6">
      <header className="mb-6 flex items-center justify-between">
        <button onClick={onExit} className="text-sm font-bold text-stone-600">
          ← Menu
        </button>
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-sky-700">
          Bommetjes
        </div>
        <div className="w-12" />
      </header>

      <h2 className="mb-1 text-3xl font-black">Wie doet er mee?</h2>
      <p className="mb-6 text-stone-600">
        1 iemand houdt de telefoon vast en beoordeelt elke sprong.
      </p>

      <div className="mb-4 space-y-2">
        {players.map((p, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={p}
              onChange={(e) => updateName(i, e.target.value)}
              className="flex-1 rounded-xl border-2 border-stone-300 bg-white px-4 py-3 font-bold focus:border-sky-500 focus:outline-none"
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

      {players.length < 8 && (
        <button
          onClick={addPlayer}
          className="mb-6 rounded-xl border-2 border-dashed border-stone-400 py-3 font-bold text-stone-600"
        >
          + Speler toevoegen
        </button>
      )}

      <button
        onClick={onStart}
        className="mt-auto rounded-2xl border-2 border-stone-900 bg-sky-600 p-5 text-xl font-black uppercase tracking-wider text-white shadow-lg transition active:scale-[0.98]"
      >
        Start bommetjeswedstrijd
      </button>
    </div>
  );
}

function Klassement({ players, jumps, onClose, onNewGame }) {
  const totals = jumps.map((arr) => arr.reduce((s, j) => s + jumpTotal(j), 0));
  const ranked = players
    .map((p, i) => ({ name: p, total: totals[i], count: jumps[i].length }))
    .sort((a, b) => b.total - a.total);

  const medals = ["🥇", "🥈", "🥉"];

  const bestInCategory = (key) => {
    let best = -1;
    let owners = [];
    players.forEach((p, i) => {
      jumps[i].forEach((j) => {
        if (j[key] > best) {
          best = j[key];
          owners = [p];
        } else if (j[key] === best) {
          owners.push(p);
        }
      });
    });
    return { best, owners: [...new Set(owners)] };
  };

  const records = CATEGORIES.map((c) => ({ ...c, ...bestInCategory(c.key) }));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/60 p-2 sm:items-center">
      <div className="animate-pop max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-2xl font-black">Klassement</h3>
          <button
            onClick={onClose}
            className="rounded-full bg-stone-100 px-3 py-1 text-sm font-bold"
          >
            Sluit
          </button>
        </div>

        {ranked[0]?.count > 0 && (
          <div className="mb-4 rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 text-center">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Aanvoerder
            </div>
            <div className="text-2xl font-black">{ranked[0].name}</div>
            <div className="text-sm text-stone-600">{ranked[0].total} punten</div>
          </div>
        )}

        <div className="mb-4 divide-y divide-stone-100 rounded-2xl border-2 border-stone-200">
          {ranked.map((r, i) => (
            <div key={r.name} className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="w-6 text-center">{medals[i] || i + 1}</span>
                <span className="font-bold">{r.name}</span>
                <span className="text-xs text-stone-500">
                  ({r.count} {r.count === 1 ? "sprong" : "sprongen"})
                </span>
              </div>
              <span className="font-black text-sky-700">{r.total}</span>
            </div>
          ))}
        </div>

        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">
          Records
        </div>
        <div className="space-y-2">
          {records.map((r) => (
            <div
              key={r.key}
              className="flex items-center justify-between rounded-xl border-2 border-stone-200 bg-stone-50 px-3 py-2"
            >
              <div className="font-bold text-stone-700">
                {r.emoji} {r.label}
              </div>
              <div className="text-right text-sm">
                {r.best === -1 ? (
                  <span className="text-stone-400">Nog geen sprongen</span>
                ) : (
                  <>
                    <span className="font-black text-sky-700">{r.best}/10</span>{" "}
                    <span className="text-stone-600">{r.owners.join(" & ")}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onNewGame}
          className="mt-5 w-full rounded-2xl border-2 border-stone-900 bg-stone-900 p-4 font-black uppercase tracking-wider text-white"
        >
          Nieuwe wedstrijd
        </button>
      </div>
    </div>
  );
}
