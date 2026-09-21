import { z } from 'zod';

export const problemIds = ['maximum-average', 'maximum-vowels', 'minimum-size', 'unique-substring', 'two-sum'] as const;
export const submissionSchema = z.object({
  problem: z.enum(problemIds),
  source: z.string().min(1).max(50_000),
  input: z.array(z.union([z.string().max(16), z.number().finite(), z.array(z.number().finite()).max(16)])).max(2),
  requestId: z.string().uuid(),
});
export type SubmissionInput = z.infer<typeof submissionSchema>;
export type ProblemId = typeof problemIds[number];
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type TraceEvent = { id: number; line: number; kind: 'before' | 'return'; locals: Record<string, JsonValue>; collections?: Record<string,{kind:string;ref:number}>; result?: JsonValue };
export type ExecutionTrace = { version: 1; sourceHash: string; input: JsonValue[]; events: TraceEvent[]; result: JsonValue; complete: true; runtime: string };
export const storySchema = z.object({
  title: z.string().min(1).max(100), premise: z.string().min(1).max(700),
  mappings: z.array(z.object({ variable: z.string().max(80), role: z.string().max(180) })).max(12),
  chapters: z.array(z.object({ eventId: z.number().int().nonnegative(), title: z.string().max(100), narration: z.string().max(450) })).min(2).max(8),
  limitation: z.string().max(400),
});
export type Story = z.infer<typeof storySchema>;
export type Artifact = { version: 1; sourceHash: string; trace: ExecutionTrace; story: Story; model: string; promptVersion: string; suiteVersion: string; passed: number; source: string; problem: ProblemId; createdAt: string };
export type JobStage = 'queued' | 'validating' | 'tracing' | 'generating' | 'checking' | 'ready' | 'failed' | 'cancelled';
export type Job = { id: string; owner_id: string; problem: ProblemId; source: string; source_hash: string; input: JsonValue[]; stage: JobStage; message: string; artifact: Artifact | null; created_at: string; attempts: number; publication_id?: string | null };

export function validateStory(story: unknown, trace: ExecutionTrace): Story {
  const parsed = storySchema.parse(story);
  if (parsed.chapters[0].eventId !== trace.events[0].id || parsed.chapters.at(-1)!.eventId !== trace.events.at(-1)!.id) throw Error('Story must cover the initial state and final return.');
  const names = new Set(trace.events.flatMap(event => Object.keys(event.locals)));
  if (parsed.mappings.some(m => !names.has(m.variable))) throw Error('Story references an unobserved variable.');
  let previous = -1;
  for (const chapter of parsed.chapters) {
    if (!trace.events.some(event => event.id === chapter.eventId) || chapter.eventId <= previous) throw Error('Story chapters must reference ordered trace events.');
    previous = chapter.eventId;
  }
  return parsed;
}

export function validateTrace(raw: unknown, hash: string, source: string): ExecutionTrace {
  const value: z.ZodType<JsonValue> = z.lazy(() => z.union([z.string().max(2000), z.number().finite(), z.boolean(), z.null(), z.array(value).max(100), z.record(z.string().max(100), value)]));
  const trace = z.object({ version: z.literal(1), sourceHash: z.literal(hash), input: z.array(value), events: z.array(z.object({id:z.number().int(),line:z.number().int().positive(),kind:z.enum(['before','return']),locals:z.record(z.string(),value),collections:z.record(z.string(),z.object({kind:z.enum(['list','tuple','set','dict']),ref:z.number().int().nonnegative()})).optional(),result:value.optional()})).min(1).max(500),result:value,complete:z.literal(true),runtime:z.string() }).parse(raw);
  const lines = source.split('\n').length;
  if (trace.events.some((event,i) => event.id !== i || event.line > lines)) throw Error('Invalid source mapping.');
  const last = trace.events.at(-1)!;
  if (last.kind !== 'return' || JSON.stringify(last.result) !== JSON.stringify(trace.result)) throw Error('Incomplete return trace.');
  return trace;
}
