import {
  formatProgress,
  getWordFontSize,
  getWordParts,
  splitWords,
} from "@/utils/speed-reading-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Phase = "idle" | "reading" | "paused" | "finished";

const MIN_WPM = 60;
const MAX_WPM = 900;
const DEFAULT_WPM = 300;
const SAMPLE_TEXT =
  "Speed reading can help you move through text faster while still keeping your attention on the main ideas. Adjust the speed, pause when needed, and restart anytime.";

export const SpeedReading = () => {
  const [draftText, setDraftText] = useState(SAMPLE_TEXT);
  const [wpm, setWpm] = useState(DEFAULT_WPM);
  const [words, setWords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const isPlaying = phase === "reading";
  const isFinished = phase === "finished";
  const hasWords = words.length > 0;

  const currentWord = words[currentIndex] ?? "";
  const progress = formatProgress(currentIndex, words.length);
  const currentInterval = 60000 / wpm;

  const wordParts = useMemo(() => getWordParts(currentWord), [currentWord]);

  const clearPlaybackTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const focusTextarea = useCallback(() => {
    window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  }, []);

  const startReading = useCallback(() => {
    const parsedWords = splitWords(draftText);

    if (parsedWords.length === 0) {
      setWords([]);
      setCurrentIndex(0);
      setPhase("idle");
      focusTextarea();
      return;
    }

    setWords(parsedWords);
    setCurrentIndex(0);
    setPhase("reading");
  }, [draftText, focusTextarea]);

  const pauseReading = useCallback(() => {
    clearPlaybackTimeout();
    setPhase((currentPhase) =>
      currentPhase === "reading" ? "paused" : currentPhase,
    );
  }, [clearPlaybackTimeout]);

  const resumeReading = useCallback(() => {
    if (!hasWords) {
      return;
    }

    setPhase("reading");
  }, [hasWords]);

  const restartReading = useCallback(() => {
    if (!hasWords) {
      const parsedWords = splitWords(draftText);

      if (parsedWords.length === 0) {
        return;
      }

      setWords(parsedWords);
      setCurrentIndex(0);
      setPhase("reading");
      return;
    }

    setCurrentIndex(0);
    setPhase("reading");
  }, [draftText, hasWords]);

  const stopAndEdit = useCallback(() => {
    clearPlaybackTimeout();
    setPhase("idle");
    focusTextarea();
  }, [clearPlaybackTimeout, focusTextarea]);

  const clearAll = useCallback(() => {
    clearPlaybackTimeout();
    setDraftText("");
    setWords([]);
    setCurrentIndex(0);
    setPhase("idle");
    focusTextarea();
  }, [clearPlaybackTimeout, focusTextarea]);

  const loadSample = useCallback(() => {
    setDraftText(SAMPLE_TEXT);
    focusTextarea();
  }, [focusTextarea]);

  useEffect(() => {
    if (phase !== "reading" || words.length === 0) {
      clearPlaybackTimeout();
      return;
    }

    if (currentIndex >= words.length - 1) {
      setPhase("finished");
      clearPlaybackTimeout();
      return;
    }

    timeoutRef.current = window.setTimeout(() => {
      setCurrentIndex((previousIndex) => previousIndex + 1);
    }, currentInterval);

    return clearPlaybackTimeout;
  }, [
    clearPlaybackTimeout,
    currentIndex,
    currentInterval,
    phase,
    words.length,
  ]);

  useEffect(() => {
    return clearPlaybackTimeout;
  }, [clearPlaybackTimeout]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMetaEnter =
        (event.ctrlKey || event.metaKey) && event.key === "Enter";

      if (isMetaEnter && phase === "idle") {
        event.preventDefault();
        startReading();
        return;
      }

      if (
        event.code === "Space" &&
        (phase === "reading" || phase === "paused")
      ) {
        event.preventDefault();

        if (phase === "reading") {
          pauseReading();
          return;
        }

        resumeReading();
        return;
      }

      if (event.key.toLowerCase() === "r" && hasWords) {
        event.preventDefault();
        restartReading();
        return;
      }

      if (event.key === "Escape" && phase !== "idle") {
        event.preventDefault();
        stopAndEdit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    hasWords,
    pauseReading,
    phase,
    restartReading,
    resumeReading,
    startReading,
    stopAndEdit,
  ]);

  const canStart = splitWords(draftText).length > 0;

  return (
    <>
      <section className="grid flex-1 gap-6 lg:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
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
                onChange={(event) => setWpm(Number(event.target.value))}
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
                onClick={startReading}
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
                onClick={restartReading}
                disabled={!canStart}
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

        <div className="flex min-h-[420px] flex-col rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-2xl shadow-black/20 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Reader
              </p>

              <p className="mt-1 text-sm text-zinc-300">
                {phase === "idle" && "Ready to begin"}
                {phase === "reading" && "Reading in progress"}
                {phase === "paused" && "Paused"}
                {phase === "finished" && "Finished"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={isPlaying ? pauseReading : resumeReading}
                disabled={!hasWords || isFinished}
                className="inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPlaying ? "Pause" : "Resume"}
              </button>

              <button
                type="button"
                onClick={restartReading}
                disabled={!hasWords}
                className="inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Restart
              </button>

              <button
                type="button"
                onClick={stopAndEdit}
                disabled={phase === "idle"}
                className="inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Edit text
              </button>
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-between gap-6 py-6">
            <div className="flex flex-1 items-center justify-center">
              <div className="w-full max-w-4xl">
                <div className="flex min-h-[220px] items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-950 px-4 py-8 sm:min-h-[280px] sm:px-8">
                  {!hasWords && (
                    <p className="text-center text-base text-zinc-500 sm:text-lg">
                      Add some text and start reading.
                    </p>
                  )}

                  {hasWords && (
                    <div
                      className="max-w-full overflow-hidden text-center font-semibold tracking-tightest leading-none whitespace-nowrap"
                      style={{ fontSize: getWordFontSize(currentWord) }}
                    >
                      <span className="text-white">{wordParts.before}</span>
                      <span className="text-red-500">{wordParts.pivot}</span>
                      <span className="text-white">{wordParts.after}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-300">
                <span>
                  Word{" "}
                  <span className="font-semibold text-white">
                    {hasWords ? currentIndex + 1 : 0}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-white">
                    {words.length}
                  </span>
                </span>

                <span>
                  Progress{" "}
                  <span className="font-semibold text-white">{progress}%</span>
                </span>

                <span>
                  Interval{" "}
                  <span className="font-semibold text-white">
                    {Math.round(currentInterval)} ms
                  </span>
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-red-500 transition-[width] duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-xs leading-relaxed text-zinc-400 sm:text-sm">
                <p className="font-medium text-zinc-200">Shortcuts</p>
                <p className="mt-2">
                  <span className="text-zinc-100">Ctrl/Cmd + Enter</span> to
                  start, <span className="text-zinc-100">Space</span> to
                  pause/resume, <span className="text-zinc-100">R</span> to
                  restart, and <span className="text-zinc-100">Esc</span> to go
                  back to editing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
