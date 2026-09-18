import type { Lesson, Input } from '../lessons/types';
import type { PlayerState } from './player';
import { buildTrace } from '../lessons/engine';
import { initialPlayer } from './player';
export const PROGRESS_KEY='leetlove.library.v1';
export type SavedLesson={version:number;input:Input;step:number;furthest:number;mode:'guided'|'watch';practices:number[];updated:number};
export type Progress={schema:1;lessons:Record<string,SavedLesson>};
export const emptyProgress=():Progress=>({schema:1,lessons:{}});
export function decodeProgress(raw:string|null):Progress {
  if(!raw)return emptyProgress();
  try{const data=JSON.parse(raw);if(data.schema!==1||!data.lessons||typeof data.lessons!=='object'||Array.isArray(data.lessons))return emptyProgress();return {schema:1,lessons:data.lessons};}catch{return emptyProgress();}
}
export function restoreLesson(lesson:Lesson,saved:SavedLesson|undefined):{state:PlayerState;practices:number[];restored:boolean;discarded:boolean} {
  const fallback={state:initialPlayer(lesson.defaults,buildTrace(lesson,lesson.defaults)),practices:[],restored:false,discarded:!!saved};
  if(!saved||saved.version!==lesson.version)return fallback;
  try{
    if(!saved.input||typeof saved.input.raw!=='string'||typeof saved.input.parameter!=='string')return fallback;
    if(!Number.isInteger(saved.step)||!Number.isInteger(saved.furthest)||saved.step<0||saved.furthest<0)return fallback;
    const frames=buildTrace(lesson,saved.input),step=Math.min(saved.step,frames.length-1),furthest=Math.min(Math.max(step,saved.furthest),frames.length-1);
    return {state:{...initialPlayer(saved.input,frames),step,furthest,mode:saved.mode==='watch'?'watch':'guided'},practices:Array.isArray(saved.practices)?[...new Set(saved.practices.filter(n=>Number.isInteger(n)&&n>=0&&n<lesson.practices.length))]:[],restored:true,discarded:false};
  }catch{return fallback;}
}
export function saveLesson(lesson:Lesson,state:PlayerState,practices:number[]):SavedLesson{return {version:lesson.version,input:state.input,step:state.step,furthest:state.furthest,mode:state.mode,practices:[...practices],updated:Date.now()};}
