import assert from 'node:assert/strict';
import test from 'node:test';
import catalog from '../src/data/problems.json';
import { lessons } from '../src/lessons/catalog';
test('catalog metadata has unique safe routes and valid difficulty/acceptance',()=>{
 assert.ok(catalog.problems.length>0);
 assert.equal(new Set(catalog.problems.map(p=>p.slug)).size,catalog.problems.length);
 for(const p of catalog.problems){assert.match(p.slug,/^[a-z0-9-]+$/);assert.ok(p.title);assert.ok(['Easy','Medium','Hard'].includes(p.difficulty));assert.ok(p.acceptance>=0&&p.acceptance<=100);}
});
test('every authored visual lesson joins to the correct catalog problem',()=>{
 for(const lesson of lessons){const p=catalog.problems.find(p=>p.slug===lesson.slug);assert.ok(p,lesson.slug);assert.equal(p.number,lesson.number);}
});
