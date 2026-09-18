export type LessonId = 'maximum-average' | 'maximum-vowels' | 'minimum-size' | 'unique-substring' | 'two-sum';
export type Input = { raw: string; parameter: string };
export type Challenge = { kind: 'cell' | 'choice'; prompt: string; hint: string; accepted: string[]; options?: { key: string; label: string }[] };
export type Snapshot = {
  id: string; op: string; title: string; explanation: string; equation: string;
  selected: number[]; best: number[]; pointers: { index: number; label: string }[];
  range: boolean; metrics: { label: string; value: string }[];
  conflicts?: number[]; status?: { label: string; invalid: boolean };
  motion?: { label: string; from: number; to: number };
  memory?: { label: string; value: number; invalid?: boolean }[];
  tone: 'neutral' | 'add' | 'remove' | 'save' | 'done'; focus?: number;
  challenge?: Challenge; checkpoint?: { label: string; value: string };
  result?: number | number[];
};
export type CodeLine = { id: string; text: string };
export type Practice = { prompt: string; answer: number | number[]; question: string; options: string[]; correct: number; hint: string; explanation: string };
export type Lesson = {
  id: LessonId; version: number; title: string; shortTitle: string; number: number; slug: string;
  pattern: string; objective: string; difficulty: string; inputKind: 'numbers' | 'text'; parameter?: string;
  defaults: Input; presets: { label: string; input: Input }[]; inputHint: string; prerequisites: string;
  story: { title: string; paragraphs: string[]; mapping: string; invariant: string; baseline: string };
  complexity: string; code: CodeLine[]; practices: Practice[];
};
