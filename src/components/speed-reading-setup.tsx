import { splitWords } from "@/utils/speed-reading-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Phase } from "./speed-reading";

const MIN_WPM = 60;
const MAX_WPM = 900;
const SAMPLE_TEXT =
  "Speed reading can help you move through text faster while still keeping your attention on the main ideas. Adjust the speed, pause when needed, and restart anytime.";

interface SpeedReadingSetup {
  wpm: number;
  onWpmChange: (wpm: number) => void;
  phase: Phase;
  onStart: (words: string[]) => void;
  onRestart: () => void;
  hasWords: boolean;
  onClear: () => void;
}

export const SpeedReadingSetup = ({
  wpm,
  onWpmChange,
  phase,
  onStart,
  onRestart,
  hasWords,
  onClear,
}: SpeedReadingSetup) => {
  const [draftText, setDraftText] = useState(SAMPLE_TEXT);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const canStart = useMemo(() => splitWords(draftText).length > 0, [draftText]);

  const handleStart = useCallback(() => {
    const parsedWords = splitWords(draftText);
    if (parsedWords.length > 0) {
      onStart(parsedWords);
    }
  }, [draftText, onStart]);

  const loadSample = useCallback(() => {
    setDraftText(SAMPLE_TEXT);
    window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  }, []);

  const clearAll = useCallback(() => {
    setDraftText("");
    onClear();
    window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  }, [onClear]);

  // Focus the input when entering the idle phase
  useEffect(() => {
    if (phase === "idle") {
      window.requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    }
  }, [phase]);

  // Ctrl+Enter shortcut to start
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMetaEnter =
        (event.ctrlKey || event.metaKey) && event.key === "Enter";

      if (isMetaEnter && phase === "idle") {
        event.preventDefault();
        handleStart();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleStart, phase]);

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-2xl shadow-black/20 sm:p-5">
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="reader-text"
              className="text-sm font-medium text-zinc-200"
            >
              Text
            </label>

            <span className="text-xs text-zinc-500">
              Ctrl/Cmd + Enter to start
            </span>
          </div>

          <textarea
            id="reader-text"
            ref={textareaRef}
            value={draftText}
            onChange={(event) => setDraftText(event.target.value)}
            placeholder="Paste or type your text here..."
            className="min-h-52 w-full resize-none rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="reader-wpm"
              className="text-sm font-medium text-zinc-200"
            >
              Words per minute
            </label>

            <span className="min-w-16 text-right text-sm font-semibold text-red-400">
              {wpm} WPM
            </span>
          </div>

          <input
            id="reader-wpm"
            type="range"
            min={MIN_WPM}
            max={MAX_WPM}
            step={10}
            value={wpm}
            onChange={(event) => onWpmChange(Number(event.target.value))}
            className="w-full accent-red-500"
          />

          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>{MIN_WPM}</span>
            <span>{MAX_WPM}</span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleStart}
            disabled={!canStart}
            className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
          >
            {hasWords ? "Restart reading" : "Start reading"}
          </button>

          <button
            type="button"
            onClick={loadSample}
            className="inline-flex items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900"
          >
            Load sample
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900"
          >
            Clear text
          </button>

          <button
            type="button"
            onClick={onRestart}
            disabled={!hasWords}
            className="inline-flex items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Restart
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 text-xs text-zinc-400">
          <p className="font-semibold text-zinc-300">Behavior</p>

          <p className="mt-2 leading-relaxed">
            Commas are removed before playback. The app keeps{" "}
            <span className="text-zinc-200">.</span>,{" "}
            <span className="text-zinc-200">!</span>,{" "}
            <span className="text-zinc-200">?</span>,{" "}
            <span className="text-zinc-200">:</span> and{" "}
            <span className="text-zinc-200">;</span>.
          </p>
        </div>
      </div>
    </div>
  );
};
