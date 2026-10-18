import test from 'node:test';
import assert from 'node:assert/strict';
import { missions, roadmap } from '../src/arrays/curriculum.ts';
import { buildFrames, accepts, casesFor, expected } from '../src/arrays/engine.ts';
import { decodeArrayProgress } from '../src/arrays/progress.ts';

test('all five guided missions finish with correct state and independent snapshots',()=>{
  for(const m of missions){const original=[...m.nums],frames=buildFrames(m);assert.ok(frames.length>1);assert.equal(frames.at(-1)!.choices.length,0);
    frames.slice(0,-1).forEach(f=>{assert.ok(f.correct>=0&&f.correct<f.choices.length);assert.ok(f.active.every(i=>i>=0&&i<f.values.length));});
    assert.deepEqual(m.nums,original);const first=[...frames[0].values];frames.at(-1)!.values[0]=999;assert.deepEqual(frames[0].values,first);
  }
  assert.equal(buildFrames(missions[0]).at(-1)!.variables.total,27);
  assert.equal(buildFrames(missions[1]).at(-1)!.variables.best,9);
  assert.deepEqual(buildFrames(missions[2]).at(-1)!.values,[5,7,2,9,4]);
  assert.deepEqual(buildFrames(missions[3]).at(-1)!.active,[1,2]);
  assert.deepEqual(buildFrames(missions[4]).at(-1)!.active,[2,3]);
});
test('judges handle edge cases, alternative pairs, indexing and in-place mutation',()=>{
  for(const m of missions)for(const c of casesFor(m.id)){const answer=expected(m.id,c);assert.equal(accepts(m.id,c,answer,answer),true);}
  assert.equal(accepts('maximum',{label:'negative',nums:[-4,-1,-6]},0),false);
  assert.equal(accepts('reverse',{label:'copy',nums:[1,2,3]},[3,2,1],[1,2,3]),false);
  const c={label:'pairs',nums:[1,2,3,4],target:5};
  assert.equal(accepts('pair',c,[2,1]),true);assert.equal(accepts('pair',c,[0,3]),true);
  assert.equal(accepts('pair',c,[]),false);assert.equal(accepts('pair',c,[1,1]),false);assert.equal(accepts('pair',c,[.5,2]),false);
  assert.equal(accepts('sorted-pair',c,[1,4]),true);assert.equal(accepts('sorted-pair',c,[0,3]),false);
  assert.equal(accepts('pair',{label:'one',nums:[3],target:6},[]),true);
});
test('malformed storage cannot crash restoration or supply invalid stages',()=>{
  for(const raw of ['null','[]','bad','{"maximum":null}'])assert.deepEqual(decodeArrayProgress(raw),{});
  const p=decodeArrayProgress('{"maximum":{"stage":90,"step":-1,"source":3,"completed":"true"},"unknown":{}}');
  assert.equal(p.maximum.stage,0);assert.equal(p.maximum.step,0);assert.equal(p.maximum.completed,false);assert.ok(p.maximum.source.includes('findMax'));assert.equal(Object.keys(p).length,1);
});
test('roadmap covers easy medium hard without duplicates or unsafe links',()=>{
  const problems=roadmap.flatMap(b=>b.problems);assert.equal(problems.length,31);assert.equal(new Set(problems.map(p=>p[1])).size,31);
  problems.forEach(p=>assert.match(p[1],/^[a-z0-9-]+$/));assert.deepEqual(new Set(problems.map(p=>p[2])),new Set(['Easy','Medium','Hard']));
});
