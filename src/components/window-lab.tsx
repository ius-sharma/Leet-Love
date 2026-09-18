'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Check, Hand, MousePointer2, Trophy, ArrowRight } from 'lucide-react';
import type { Frame } from '@/lib/lesson';
import { lesson } from '@/lib/lesson';

const fmt = (value: number) => Number(value.toFixed(5)).toString();
type Props = { nums: number[]; k: number; frames: Frame[]; step: number; furthest: number; guided: boolean; advance: () => void; seek: (step: number) => void };

export function WindowLab({ nums, k, frames, step, furthest, guided, advance, seek }: Props) {
  const frame = frames[step], previous = frames[Math.max(0, step - 1)], next = frames[step + 1];
  const [message, setMessage] = useState('');
  const [inspected, setInspected] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const finished = frame.kind === 'done';
  const viewLeft = finished ? frame.bestLeft : frame.left;
  const viewRight = finished ? frame.bestLeft + k - 1 : frame.right;
  const isOperation = next?.kind === 'add' || next?.kind === 'remove';
  const count = Math.max(0, frame.right - frame.left + 1);
  const complete = count === k;
  const comparisons = frames.flatMap((item, index) => item.kind === 'compare' ? [{ ...item, step: index }] : []);
  const operation = frame.kind === 'add' || frame.kind === 'remove';
  const bestChanged = frame.best !== null && frame.best !== previous.best;

  useEffect(() => {
    setMessage(''); setInspected(null);
    const scroller = scrollRef.current;
    const focus = finished ? frame.bestLeft : guided && next?.focus !== undefined ? next.focus : frame.focus;
    if (scroller && focus !== undefined) {
      const left = focus * 76;
      const right = left + 76;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (left < scroller.scrollLeft || right > scroller.scrollLeft + scroller.clientWidth)
        scroller.scrollTo({left: Math.max(0, right - scroller.clientWidth + 12), behavior: reduced ? 'instant' : 'smooth'});
    }
  }, [step, nums, guided, finished, frame.bestLeft, frame.focus, next?.focus]);
  function chooseCell(index: number) {
    setInspected(index);
    if (!guided || !isOperation) return;
    if (index === next.focus) advance();
    else setMessage(next.kind === 'remove'
      ? `Keep index ${index} for now. The leftmost value, at index ${next.focus}, leaves the window.`
      : `We need adjacent values in order. Add the value at index ${next.focus} next.`);
  }
  function compare(save: boolean) {
    const shouldSave = frame.best === null || frame.sum > frame.best;
    if (save === shouldSave) advance();
    else setMessage(shouldSave ? `Our current sum is ${frame.sum}. ${frame.best === null ? 'This is the first full window, so it becomes our benchmark.' : `It beats ${frame.best}, so save it.`}` : `${frame.sum} does not beat ${frame.best}. Equal sums keep the earlier winner.`);
  }

  return <div className="window-lab" id="lab-focus" tabIndex={-1}>
    <div className="hands-on"><div className="hands-on-heading"><span className="hand-icon">{guided ? <Hand size={20} /> : <MousePointer2 size={20} />}</span><div><span className="eyebrow">{guided ? 'YOU DRIVE THE ALGORITHM' : 'EXPLORE THE STATE'}</span><h3>{!guided ? 'Click any value to inspect it.' : !next ? 'Every window explored. You found the best.' : isOperation ? next.kind === 'remove' ? 'Which value leaves the window?' : 'Which value enters next?' : next.kind === 'compare' ? 'Should we save this window?' : 'All windows checked. Reveal the answer.'}</h3><p>{guided && isOperation ? 'Click a number below. Your choice moves the algorithm forward.' : guided && next?.kind === 'compare' ? `Current sum: ${frame.sum} · Saved best sum: ${frame.best ?? 'none yet'}` : finished ? 'The gold frame marks the winning values. The notebook keeps every explored candidate.' : 'The green frame and gold markers show current and best separately.'}</p></div></div>
      {guided && next?.kind === 'compare' && <div className="decision-buttons"><button onClick={() => compare(true)}>Save this window <Trophy size={15} /></button><button onClick={() => compare(false)}>Keep previous best <Check size={15} /></button></div>}
      {guided && next?.kind === 'done' && <button className="primary" onClick={advance}>Reveal maximum average <ArrowRight size={16} /></button>}
      {inspected !== null && !guided && <p className="inspection">nums[{inspected}] = {nums[inspected]} · {inspected >= viewLeft && inspected <= viewRight ? `Inside the ${finished ? 'winning' : 'current'} window` : `Outside the ${finished ? 'winning' : 'current'} window`}</p>}
      {message && <p className="choice-feedback" role="status">{message}</p>}
    </div>
    <div className="lab-top"><span><Camera size={17} /> {finished ? 'THE WINNING VIEW' : 'THE VIEWFINDER'}</span><span className={complete ? 'occupancy full' : 'occupancy'}>{count} / {k} values · {finished ? 'maximum average found' : complete ? 'ready to compare' : 'building the window'}</span></div>
    <div className="lab-scroll" ref={scrollRef}><div className="lab-track" style={{ width: nums.length * 76 + 16 }}>
      {count > 0 && <div className={`camera-frame ${finished ? 'winning-frame' : ''} ${frame.kind === 'remove' ? 'partial' : ''}`} style={{ left: viewLeft * 76 + 3, width: count * 76 - 2 }} aria-hidden="true"><span className="camera-corner tl" /><span className="camera-corner tr" /><span className="camera-corner bl" /><span className="camera-corner br" /><span className="frame-caption">{finished ? '★ WINNING WINDOW' : complete ? 'CURRENT WINDOW' : `${k - count} SLOT${k - count === 1 ? '' : 'S'} TO FILL`}</span></div>}
      {nums.map((num, index) => {
        const inside = index >= viewLeft && index <= viewRight;
        const focus = frame.focus === index;
        const best = frame.best !== null && index >= frame.bestLeft && index < frame.bestLeft + k;
        return <div className="lab-column" key={index}>
          <span className="lab-pointer">{inside && index === viewLeft ? 'L' : ''}{inside && index === viewRight ? index === viewLeft ? ' · R' : 'R' : ''}</span>
          <button aria-label={`Value ${num} at index ${index}`} aria-pressed={inspected === index} className={`lab-cell ${inside ? finished ? 'winning-cell' : 'inside' : ''} ${focus && operation ? frame.kind === 'remove' ? 'leaving' : 'arriving' : ''} ${inspected === index ? 'inspected' : ''}`} onClick={() => chooseCell(index)}><span>{num}</span>{focus && operation && <small>{frame.kind === 'remove' ? 'OUT' : 'IN'}</small>}</button>
          <span className="lab-index">{index}</span><span className={`best-marker ${best ? 'visible' : ''}`} title="Best saved window">{index === frame.bestLeft ? '★ BEST' : '━'}</span>
        </div>;
      })}
    </div></div>
    <div className="lab-legend"><span><i className="mint" /> Current frame</span><span><i className="orange" /> Outgoing</span><span><i className="purple" /> Incoming</span><span>★ Saved best</span></div>
    <div className="inline-code" aria-label="Current Python operation"><span>PYTHON · LINE {frame.line}</span><code>{lesson.code[frame.line - 1].trim()}</code></div>
    <div className={`equation-dock ${bestChanged ? 'record-update' : ''}`}>
      <span className="equation-label">{operation ? 'THE SUM CHANGES' : frame.kind === 'compare' ? 'COMPARE & SAVE' : frame.kind === 'done' ? 'THE ANSWER' : 'START AT ZERO'}</span>
      <div className="live-equation" key={step}>
        {operation ? <><span>{previous.sum}</span><b className={frame.kind === 'remove' ? 'subtract' : 'plus'}>{frame.kind === 'remove' ? '−' : '+'}</b><span className={`operand ${frame.kind === 'remove' ? 'subtract' : 'plus'}`}>({nums[frame.focus!]})</span><b>=</b><strong>{frame.sum}</strong></>
          : frame.kind === 'done' ? <><span>{frame.best}</span><b>÷</b><span>{k}</span><b>=</b><strong>{fmt(frame.best! / k)}</strong></>
          : frame.kind === 'compare' ? <><span>{previous.best === null ? 'First sum' : `max(${previous.best}, ${frame.sum})`}</span><b>→</b><strong>{frame.best}</strong>{bestChanged && <Trophy size={22} />}</>
          : <><span>sum</span><b>=</b><strong>0</strong><span className="equation-hint">Let’s fill the frame.</span></>}
      </div>
      {frame.kind === 'remove' && <p>Only {count} values remain. The average is hidden until the next value enters.</p>}
      {frame.kind === 'done' && <p>Winning values: [{nums.slice(frame.bestLeft, frame.bestLeft + k).join(', ')}] · indices {frame.bestLeft}–{frame.bestLeft + k - 1}</p>}
    </div>
    <div className="window-history"><div className="history-heading"><strong>Window notebook</strong><span>Revisit any explored window</span></div><div className="history-cards">{comparisons.map((item, index) => <button key={item.step} disabled={item.step > furthest} className={`${item.step === step ? 'current' : ''} ${frame.best !== null && item.left === frame.bestLeft && item.step <= step ? 'winner' : ''}`} onClick={() => seek(item.step)} aria-label={`Revisit window ${index + 1}`}><span>#{index + 1} · indices {item.left}–{item.right}</span><strong>{item.step <= furthest ? fmt(item.sum / k) : '—'}</strong><small>{item.step <= furthest ? 'average' : 'not explored'}</small></button>)}</div></div>
  </div>;
}
