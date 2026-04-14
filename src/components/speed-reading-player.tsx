import {
  formatProgress,
  getResponsiveBaseFontSize,
  getWordParts,
} from "@/utils/speed-reading-utils";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Phase } from "./speed-reading";

interface SpeedReadingPlayer {
  words: string[];
  wpm: number;
  phase: Phase;
  onPhaseChange: (phase: Phase) => void;
  onStop: () => void;
  onRestart: () => void;
  restartCount: number;
}

const PIVOT_OFFSET_RATIO = 0.47;
const READER_MIN_SCALE = 0.22;

export const SpeedReadingPlayer = ({
  words,
  wpm,
  phase,
  onPhaseChange,
  onStop,
  onRestart,
  restartCount,
}: SpeedReadingPlayer) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [baseFontSizePx, setBaseFontSizePx] = useState(
    getResponsiveBaseFontSize(),
  );
  const [wordScale, setWordScale] = useState(1);
  const [wordLeftPx, setWordLeftPx] = useState(0);

  const timeoutRef = useRef<number | null>(null);

  const laneRef = useRef<HTMLDivElement | null>(null);
  const fullWordRef = useRef<HTMLDivElement | null>(null);
  const beforeRef = useRef<HTMLSpanElement | null>(null);
  const pivotRef = useRef<HTMLSpanElement | null>(null);

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

  const pauseReading = useCallback(() => {
    clearPlaybackTimeout();
    onPhaseChange("paused");
  }, [clearPlaybackTimeout, onPhaseChange]);

  const resumeReading = useCallback(() => {
    if (hasWords) {
      onPhaseChange("reading");
    }
  }, [hasWords, onPhaseChange]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [restartCount]);

  useEffect(() => {
    const updateFontSize = () => {
      setBaseFontSizePx(getResponsiveBaseFontSize());
    };

    updateFontSize();
    window.addEventListener("resize", updateFontSize);

    return () => {
      window.removeEventListener("resize", updateFontSize);
    };
  }, []);

  useLayoutEffect(() => {
    const laneElement = laneRef.current;
    const fullWordElement = fullWordRef.current;
    const beforeElement = beforeRef.current;
    const pivotElement = pivotRef.current;

    if (
      !laneElement ||
      !fullWordElement ||
      !beforeElement ||
      !pivotElement ||
      !currentWord
    ) {
      setWordScale(1);
      setWordLeftPx(0);
      return;
    }

    const measure = () => {
      const laneWidth = laneElement.clientWidth;
      const fullWordWidth = fullWordElement.scrollWidth;
      const beforeWidth = beforeElement.getBoundingClientRect().width;
      const pivotWidth = pivotElement.getBoundingClientRect().width;

      const anchorPx = laneWidth * PIVOT_OFFSET_RATIO;
      const pivotCenterPx = beforeWidth + pivotWidth / 2;

      setWordLeftPx(anchorPx - pivotCenterPx);

      if (laneWidth <= 0 || fullWordWidth <= 0) {
        setWordScale(1);
        return;
      }

      const nextScale = Math.min(1, laneWidth / fullWordWidth);
      setWordScale(Math.max(READER_MIN_SCALE, nextScale));
    };

    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(laneElement);
    resizeObserver.observe(fullWordElement);
    resizeObserver.observe(beforeElement);
    resizeObserver.observe(pivotElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [baseFontSizePx, currentWord, wordParts]);

  useEffect(() => {
    if (phase !== "reading" || words.length === 0) {
      clearPlaybackTimeout();
      return;
    }

    if (currentIndex >= words.length - 1) {
      onPhaseChange("finished");
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
    onPhaseChange,
    phase,
    words.length,
  ]);

  useEffect(() => {
    return clearPlaybackTimeout;
  }, [clearPlaybackTimeout]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
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
        onRestart();
        return;
      }

      if (event.key === "Escape" && phase !== "idle") {
        event.preventDefault();
        onStop();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [hasWords, onRestart, onStop, pauseReading, phase, resumeReading]);

  return (
    <div className="flex min-h-[420px] min-w-0 flex-col rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-2xl shadow-black/20 sm:p-6">
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
            onClick={onRestart}
            disabled={!hasWords}
            className="inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Restart
          </button>

          <button
            type="button"
            onClick={onStop}
            disabled={phase === "idle"}
            className="inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Edit text
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-6 py-6">
        <div className="flex min-w-0 flex-1 items-center justify-center">
          <div className="w-full max-w-4xl min-w-0">
            <div className="flex min-h-[220px] min-w-0 items-center justify-center overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 px-4 py-8 sm:min-h-[280px] sm:px-8">
              {!hasWords && (
                <p className="text-center text-base text-zinc-500 sm:text-lg">
                  Add some text and start reading.
                </p>
              )}

              {hasWords && (
                <div className="flex w-full min-w-0 items-center justify-center overflow-hidden">
                  <div
                    ref={laneRef}
                    className="relative min-h-[96px] w-full min-w-0 overflow-hidden sm:min-h-[120px]"
                  >
                    <div
                      aria-hidden="true"
                      className="absolute top-1/2 z-10 w-px -translate-x-1/2 -translate-y-1/2 bg-zinc-600/80"
                      style={{
                        left: `${PIVOT_OFFSET_RATIO * 100}%`,
                        height: "72%",
                      }}
                    />

                    <div className="absolute inset-0 flex items-center overflow-hidden">
                      <div
                        className="absolute top-1/2 z-20"
                        style={{
                          left: 0,
                          transform: `translateY(-50%) translateX(${wordLeftPx}px)`,
                        }}
                      >
                        <div
                          style={{
                            transform: `scale(${wordScale})`,
                            transformOrigin: "left center",
                            willChange: "transform",
                          }}
                        >
                          <div
                            ref={fullWordRef}
                            className="whitespace-nowrap font-mono font-bold leading-[1.1]"
                            style={{
                              fontSize: `${baseFontSizePx}px`,
                              letterSpacing: "-0.02em",
                            }}
                          >
                            <span ref={beforeRef} className="text-white">
                              {wordParts.before}
                            </span>
                            <span ref={pivotRef} className="text-red-500">
                              {wordParts.pivot}
                            </span>
                            <span className="text-white">
                              {wordParts.after}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
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
              <span className="font-semibold text-white">{words.length}</span>
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
              <span className="text-zinc-100">Ctrl/Cmd + Enter</span> to start,{" "}
              <span className="text-zinc-100">Space</span> to pause/resume,{" "}
              <span className="text-zinc-100">R</span> to restart, and{" "}
              <span className="text-zinc-100">Esc</span> to go back to editing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
