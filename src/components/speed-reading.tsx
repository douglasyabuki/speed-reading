import { useCallback, useState } from "react";
import { SpeedReadingPlayer } from "./speed-reading-player";
import { SpeedReadingSetup } from "./speed-reading-setup";

export type Phase = "idle" | "reading" | "paused" | "finished";

const DEFAULT_WPM = 300;

export const SpeedReading = () => {
  const [wpm, setWpm] = useState(DEFAULT_WPM);
  const [words, setWords] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [restartCount, setRestartCount] = useState(0);

  const handleStart = useCallback((newWords: string[]) => {
    setWords(newWords);
    setPhase("reading");
    setRestartCount((c) => c + 1);
  }, []);

  const handleRestart = useCallback(() => {
    if (words.length > 0) {
      setPhase("reading");
      setRestartCount((c) => c + 1);
    }
  }, [words.length]);

  const handleStop = useCallback(() => {
    setPhase("idle");
  }, []);

  const handleClear = useCallback(() => {
    setWords([]);
    setPhase("idle");
  }, []);

  return (
    <section className="grid flex-1 gap-6 lg:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
      <SpeedReadingSetup
        wpm={wpm}
        onWpmChange={setWpm}
        phase={phase}
        onStart={handleStart}
        onRestart={handleRestart}
        hasWords={words.length > 0}
        onClear={handleClear}
      />

      <SpeedReadingPlayer
        words={words}
        wpm={wpm}
        phase={phase}
        onPhaseChange={setPhase}
        onStop={handleStop}
        onRestart={handleRestart}
        restartCount={restartCount}
      />
    </section>
  );
};
