// Developer-only: executes exactly these repository-owned examples, never uploads.
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { getProblem, bruteAverage } from '../src/submissions/problems';
const sources=[getProblem('maximum-average').starter,bruteAverage];
const program='import json,sys\nfrom workers.python.runner import execute\nsources=json.load(sys.stdin)\nprint(json.dumps([execute(s,"findMaxAverage",[[1,12,-5,-6,50,3],4],True)["trace"] for s in sources]))';
const result=spawnSync('python',['-E','-S','-c',program],{input:JSON.stringify(sources),encoding:'utf8',timeout:10000});
if(result.status!==0)throw Error(result.stderr);
writeFileSync('src/submissions/examples.json',JSON.stringify(JSON.parse(result.stdout),null,2)+'\n');
