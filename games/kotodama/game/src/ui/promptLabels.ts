import type { PromptKind } from '@kotodama/core';

/** Short tag on move buttons. Record<PromptKind,…> so a new kind fails to compile until labelled. */
export const PROMPT_TAG: Record<PromptKind, string> = {
  recognize: 'READ', recall: 'RECALL', listen: 'LISTEN', type: 'TYPE',
  mirror: 'MIRROR', meaning: 'MEANING', spell: 'SPELL', reading: 'READING', context: 'SENTENCE',
};

/** Heading on the prompt card. */
export const PROMPT_HEADING: Record<PromptKind, string> = {
  recognize: 'READ IT', recall: 'FIND THE KANA', listen: 'LISTEN', type: 'TYPE THE READING',
  mirror: 'FIND ITS MIRROR', meaning: 'WHAT DOES IT MEAN?', spell: 'PICK THE SPELLING', reading: 'HOW IS IT READ?', context: 'FILL THE BLANK',
};
