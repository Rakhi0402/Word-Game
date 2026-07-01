import { useEffect } from "react";

interface UsePuzzleKeyboardProps {
  enabled: boolean;
  validLetters: string[];
  onLetterSelect: (letter: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onSubmit: () => void;
  onShuffle: () => void;
  onHint: () => void;
}

export const usePuzzleKeyboard = ({
  enabled,
  validLetters,
  onLetterSelect,
  onBackspace,
  onClear,
  onSubmit,
  onShuffle,
  onHint,
}: UsePuzzleKeyboardProps) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable
      ) {
        return;
      }

      const key = event.key.toUpperCase();

      switch (key) {
        case "ENTER":
          event.preventDefault();
          onSubmit();
          return;

        case "BACKSPACE":
          event.preventDefault();
          onBackspace();
          return;

        case "ESCAPE":
          event.preventDefault();
          onClear();
          return;

        case "R":
          if (!validLetters.includes("R")) {
            event.preventDefault();
            onShuffle();
            return;
          }
          break;

        case "H":
          if (!validLetters.includes("H")) {
            event.preventDefault();
            onHint();
            return;
          }
          break;

        default:
          break;
      }

      if (key.length !== 1) return;

      if (!validLetters.includes(key)) return;

      event.preventDefault();
      onLetterSelect(key);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    enabled,
    validLetters,
    onLetterSelect,
    onBackspace,
    onClear,
    onSubmit,
    onShuffle,
    onHint,
  ]);
};

export default usePuzzleKeyboard;