import test from 'node:test';
import assert from 'node:assert/strict';
import { parseInput, traceAverage } from '../src/lib/lesson.ts';

test('example returns 12.75 with a faithful sum in every snapshot', () => {
  const nums = [1,12,-5,-6,50,3], frames = traceAverage(nums, 4);
  assert.equal(frames.at(-1)!.best! / 4, 12.75);
  for (const frame of frames) {
    assert.equal(frame.sum, nums.slice(frame.left, frame.right + 1).reduce((a,b) => a+b, 0));
  }
});
test('negative inputs, one value, whole array, and tied windows', () => {
  for (const [nums,k,expected] of [[[-5,-2,-8],2,-3.5],[[5],1,5],[[2,4,6],3,4],[[1,1,1],2,1]] as const) {
    assert.equal(traceAverage([...nums], k).at(-1)!.best! / k, expected);
  }
});
test('generated inputs agree with a brute-force oracle', () => {
  let seed = 42;
  for(let run=0;run<150;run++) {
    const nums = Array.from({length: 1+run%16}, () => { seed=(seed*1664525+1013904223)>>>0; return seed%20001-10000; });
    for(let k=1;k<=nums.length;k++) {
      const expected = Math.max(...nums.slice(k-1).map((_,i) => nums.slice(i,i+k).reduce((a,b)=>a+b,0)/k));
      assert.equal(traceAverage(nums,k).at(-1)!.best!/k, expected);
    }
  }
});
test('input validation rejects malformed, oversized and invalid windows', () => {
  for (const [raw,k] of [['','1'],['1,,2','1'],['1.5,2','1'],['1,2','0'],['1,2','3'],['10001','1'],['1,2','1.5'],[Array(17).fill('1').join(','),'1']]) assert.throws(() => parseInput(raw,k));
  assert.deepEqual(parseInput(' -5, 2, 0 ', '2'), {nums:[-5,2,0],k:2});
});

test('trace generation preserves input and supports replay without state mutation', () => {
  const nums = [1,12,-5,-6,50,3];
  const before = [...nums];
  const frames = traceAverage(nums,4);
  const saved = JSON.stringify(frames);
  const order = [0,5,8,2,frames.length-1,0];
  for (const index of order) assert.equal(frames[index].sum, nums.slice(frames[index].left,frames[index].right+1).reduce((a,b)=>a+b,0));
  assert.deepEqual(nums,before);
  assert.equal(JSON.stringify(frames),saved);
  assert.equal(new Set(frames).size,frames.length);
});

test('saved winner markers always identify a real, already compared window', () => {
  for (const [nums, k] of [[[1,12,-5,-6,50,3],4], [[-7,-2,-3,-1],2], [[4,4,4],1]] as const) {
    const frames = traceAverage([...nums],k);
    let expectedBest: number | null = null;
    let expectedLeft = 0;
    for (const frame of frames) {
      if (frame.kind === 'compare' && (expectedBest === null || frame.sum > expectedBest)) {
        expectedBest = frame.sum;
        expectedLeft = frame.left;
      }
      assert.equal(frame.best, expectedBest);
      assert.equal(frame.bestLeft, expectedLeft);
      if (frame.best !== null) assert.equal(nums.slice(frame.bestLeft,frame.bestLeft+k).reduce((a,b)=>a+b,0),frame.best);
    }
  }
});

test('removing a negative value increases the partial sum without comparing it', () => {
  const frames = traceAverage([-5,-2,-8],2);
  const index = frames.findIndex(frame => frame.kind === 'remove');
  assert.equal(frames[index].sum, -2);
  assert.equal(frames[index].best, -7);
  assert.equal(frames[index].right - frames[index].left + 1, 1);
  assert.equal(frames[index+1].sum, -10);
});

