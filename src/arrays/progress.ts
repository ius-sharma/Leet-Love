import { missions, starter } from './curriculum';
export const ARRAY_KEY = 'leetlove.arrays.v1';
export type SavedMission = { stage: number; step: number; source: string; completed: boolean; guided: boolean; updated: number };
export type ArrayProgress = Record<string, SavedMission>;
export function decodeArrayProgress(raw: string | null): ArrayProgress {
  try {
    const data=JSON.parse(raw??'{}'); if(!data||typeof data!=='object'||Array.isArray(data))return {};
    const result: ArrayProgress={};
    for(const m of missions){const d=data[m.id];if(!d||typeof d!=='object')continue;
      result[m.id]={stage:Number.isInteger(d.stage)&&d.stage>=0&&d.stage<=3?d.stage:0,step:Number.isInteger(d.step)&&d.step>=0?Math.min(d.step,100):0,source:typeof d.source==='string'&&d.source.length<=50000?d.source:starter(m),completed:d.completed===true,guided:d.guided===true,updated:typeof d.updated==='number'&&Number.isFinite(d.updated)?d.updated:0};
    }return result;
  }catch{return {};}
}
