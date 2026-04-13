export const normalizeText = (value: string) => {
  return value.replace(/,/g, "").replace(/\s+/g, " ").trim();
};

export const splitWords = (value: string) => {
  const normalized = normalizeText(value);

  if (!normalized) {
    return [];
  }

  return normalized.split(" ");
};

export const getPivotIndex = (word: string) => {
  return Math.floor((word.length - 1) / 2);
};

export const getWordParts = (word: string) => {
  if (!word) {
    return { before: "", pivot: "", after: "" };
  }

  const pivotIndex = getPivotIndex(word);

  return {
    before: word.slice(0, pivotIndex),
    pivot: word[pivotIndex] ?? "",
    after: word.slice(pivotIndex + 1),
  };
};

export const getWordFontSize = (word: string) => {
  const length = word.length;

  if (length <= 8) return "clamp(3rem, 10vw, 5rem)";
  if (length <= 12) return "clamp(2.7rem, 8.5vw, 4.5rem)";
  if (length <= 18) return "clamp(2.2rem, 7vw, 3.8rem)";
  if (length <= 24) return "clamp(1.8rem, 5.8vw, 3rem)";

  return "clamp(1.4rem, 4.5vw, 2.4rem)";
};

export const formatProgress = (currentIndex: number, total: number) => {
  if (total === 0) {
    return 0;
  }

  return Math.min(Math.round(((currentIndex + 1) / total) * 100), 100);
};
