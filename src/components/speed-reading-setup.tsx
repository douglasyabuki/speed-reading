import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { splitWords } from "@/utils/speed-reading-utils";
import { ChevronDown, Settings2 } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Phase } from "./speed-reading";

const MIN_WPM = 60;
const MAX_WPM = 1200;
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
  const [isOpen, setIsOpen] = useState(true);
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

  // Automated collapsible behavior
  useEffect(() => {
    if (phase === "reading") {
      if (
        typeof window !== "undefined" &&
        window.matchMedia("(max-width: 639px)").matches
      ) {
        setIsOpen(false);
      }
    } else if (phase === "idle") {
      setIsOpen(true);
    }
  }, [phase]);

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
    <Collapsible open={isOpen} onOpenChange={setIsOpen} asChild>
      <motion.div
        className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-2xl shadow-black/20 sm:p-5"
        variants={{
          closed: {
            width: "max-content",
            height: 44,
            transition: {
              type: "inertia",
            },
          },
          open: {
            width: 360,
            height: "auto",
            transition: {
              duration: 0.15,
            },
          },
        }}
      >
        <div
          className={cn(
            "flex items-center justify-between duration-150",
            isOpen && "pb-2",
          )}
        >
          <div className="flex items-center gap-2 text-zinc-200">
            <Settings2 className="h-5 w-5 text-zinc-400" />
            <h2 className="font-medium">Setup</h2>
          </div>
          <CollapsibleTrigger asChild>
            <button className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200">
              <ChevronDown
                className={cn("h-5 w-5 transition-transform duration-200", {
                  "rotate-180": isOpen,
                })}
              />
            </button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="space-y-5 overflow-hidden transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down pt-3">
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
        </CollapsibleContent>
      </motion.div>
    </Collapsible>
  );
};
