import { spawnSync } from 'node:child_process';
import { lessons } from '../src/lessons/catalog';
import { buildTrace, parseLessonInput } from '../src/lessons/engine';
const cases=lessons.flatMap(lesson=>[lesson.defaults,...lesson.presets.map(p=>p.input)].map(input=>{
  const {values,parameter}=parseLessonInput(lesson,input);
  const args=lesson.id==='minimum-size'?[parameter,values]:lesson.parameter?[lesson.inputKind==='text'?input.raw:values,parameter]:[input.raw];
  return {lesson:lesson.id,code:lesson.code.map(line=>line.text).join('\n'),args,expected:buildTrace(lesson,input).at(-1)!.result};
}));
const program = `import sys,json\ncases=json.load(sys.stdin)\nfor case in cases:\n scope={}\n exec(case['code'],scope)\n function=next(value for key,value in scope.items() if key!='__builtins__' and callable(value))\n actual=function(*case['args'])\n assert actual==case['expected'], (case['lesson'],actual,case['expected'])\nprint(str(len(cases))+' displayed Python examples match the TypeScript traces')`;
const result=spawnSync('python',['-c',program],{input:JSON.stringify(cases),encoding:'utf8'});
if(result.error)throw result.error;
process.stdout.write(result.stdout);process.stderr.write(result.stderr);process.exitCode=result.status??1;
