import type { SentenceSegment } from "@oio/contracts";

function isSentenceBoundary(currentChar: string, nextNonWhitespaceChar: string | undefined) {
  if (!/[.!?。！？]/.test(currentChar)) {
    return false;
  }

  if (!nextNonWhitespaceChar) {
    return true;
  }

  return /["'“”‘’(\[]?[A-Z0-9\u4E00-\u9FFF]/.test(nextNonWhitespaceChar);
}

export function splitTextIntoSentences(text: string) {
  const normalizedText = text.replace(/\r\n/g, "\n").trim();
  if (!normalizedText) {
    return [];
  }

  const sentences: string[] = [];
  let buffer = "";

  for (let index = 0; index < normalizedText.length; index += 1) {
    const currentChar = normalizedText[index];
    buffer += currentChar;

    if (currentChar === "\n") {
      const trimmed = buffer.trim();
      if (trimmed) {
        sentences.push(trimmed);
      }
      buffer = "";
      continue;
    }

    let probeIndex = index + 1;
    while (probeIndex < normalizedText.length && /\s/.test(normalizedText[probeIndex] ?? "")) {
      probeIndex += 1;
    }

    const nextNonWhitespaceChar = normalizedText[probeIndex];
    if (isSentenceBoundary(currentChar, nextNonWhitespaceChar)) {
      const trimmed = buffer.trim();
      if (trimmed) {
        sentences.push(trimmed);
      }
      buffer = "";
      index = probeIndex - 1;
    }
  }

  const trailing = buffer.trim();
  if (trailing) {
    sentences.push(trailing);
  }

  return sentences;
}

function estimateSentenceDurationMs(sentence: string) {
  return Math.max(4200, sentence.length * 55);
}

function focusWordsFromSentence(sentence: string) {
  return sentence
    .replace(/[^a-zA-Z\s']/g, "")
    .split(/\s+/)
    .filter((word) => word.length >= 5)
    .slice(0, 3);
}

export function createSentenceSegments(sentenceTexts: string[], durationsMs?: number[]): SentenceSegment[] {
  let startMs = 0;

  return sentenceTexts.map((sentence, index) => {
    const durationMs = durationsMs?.[index] ?? estimateSentenceDurationMs(sentence);
    const segment = {
      id: `sentence-${index + 1}`,
      index,
      text: sentence,
      startMs,
      endMs: startMs + durationMs,
      focusWords: focusWordsFromSentence(sentence)
    };

    startMs += durationMs;
    return segment;
  });
}
