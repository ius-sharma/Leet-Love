export const lesson = {
  title: 'Maximum Average Subarray I',
  initial: [1, 12, -5, -6, 50, 3],
  k: 4,
  code: [
    'def findMaxAverage(nums, k):',
    '    total = 0',
    '    for i in range(k):',
    '        total += nums[i]',
    '    best = total',
    '    for right in range(k, len(nums)):',
    '        total -= nums[right - k]',
    '        total += nums[right]',
    '        best = max(best, total)',
    '    return best / k',
  ],
};

export type Frame = {
  kind: 'start' | 'add' | 'compare' | 'remove' | 'done';
  left: number; right: number; sum: number; best: number | null;
  bestLeft: number; line: number; title: string; explanation: string;
  focus?: number;
};

export function validateInput(nums: number[], k: number, limit = 100000): void {
  if (!nums.length || nums.length > limit || nums.some(n => !Number.isInteger(n) || Math.abs(n) > 10000))
    throw new Error(`Use 1–${limit} integers between -10,000 and 10,000.`);
  if (!Number.isInteger(k) || k < 1 || k > nums.length)
    throw new Error('Window size must be a whole number between 1 and the array length.');
}

export function parseInput(raw: string, size: string): { nums: number[]; k: number } {
  const parts = raw.trim().split(',');
  if (parts.some(p => !/^-?\d+$/.test(p.trim()))) throw new Error('Separate whole numbers with commas, like 1, 12, -5.');
  const nums = parts.map(Number), k = Number(size);
  validateInput(nums, k, 16);
  return { nums, k };
}

// Frames are independent snapshots: playback never executes or reverses mutations.
export function traceAverage(nums: number[], k: number): Frame[] {
  validateInput(nums, k);
  let sum = 0, best: number | null = null, bestLeft = 0;
  const frames: Frame[] = [];
  const push = (frame: Omit<Frame, 'sum' | 'best' | 'bestLeft'>) => frames.push({ ...frame, sum, best, bestLeft });
  push({ kind: 'start', left: 0, right: -1, line: 2, title: 'Start with an empty frame', explanation: `Our camera holds exactly ${k} neighboring values. First, build that window one value at a time.` });
  for (let i = 0; i < k; i++) {
    const previous = sum; sum += nums[i];
    push({ kind: 'add', left: 0, right: i, focus: i, line: 4, title: 'Build the first window', explanation: `${previous} + (${nums[i]}) = ${sum}. We have ${i + 1} of ${k} values in the frame.` });
  }
  best = sum;
  push({ kind: 'compare', left: 0, right: k - 1, line: 5, title: 'Our first benchmark', explanation: `The first complete window has average ${sum} / ${k} = ${sum / k}. Start best here, even when the sum is negative.` });
  for (let right = k; right < nums.length; right++) {
    const outgoing = right - k, previous = sum; sum -= nums[outgoing];
    push({ kind: 'remove', left: outgoing + 1, right: right - 1, focus: outgoing, line: 7, title: 'Let the left value leave', explanation: `${previous} − (${nums[outgoing]}) = ${sum}. This is a partial window; don’t compare its average yet.` });
    const partial = sum; sum += nums[right];
    push({ kind: 'add', left: outgoing + 1, right, focus: right, line: 8, title: 'Bring the next value in', explanation: `${partial} + (${nums[right]}) = ${sum}. The window is back to exactly ${k} values.` });
    const improved = sum > best;
    if (improved) { best = sum; bestLeft = outgoing + 1; }
    push({ kind: 'compare', left: outgoing + 1, right, line: 9, title: improved ? 'A new best view!' : 'Keep the best view', explanation: improved ? `This sum is larger. Save ${sum}; its average is ${sum / k}.` : `This window doesn’t beat our best sum of ${best}. Keep the earlier best window.` });
  }
  push({ kind: 'done', left: nums.length - k, right: nums.length - 1, line: 10, title: 'You found the best window', explanation: `Maximum average = ${best} / ${k} = ${best! / k}. The winning window starts at index ${bestLeft}. Every length-${k} window has been considered.` });
  return frames;
}
