'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Camera, Check, ChevronRight, Code2, ExternalLink, Heart, Lightbulb, Pause, Play, RotateCcw, Sparkles, Target } from 'lucide-react';
import { lesson, parseInput, traceAverage } from '@/lib/lesson';
import { WindowLab } from '@/components/window-lab';

const format = (n: number) => Number(n.toFixed(5)).toString();

export default function Home() {
  const [tab, setTab] = useState<'story' | 'visualize' | 'practice'>('visualize');
  const [nums, setNums] = useState(lesson.initial);
  const [k, setK] = useState(lesson.k);
  const [raw, setRaw] = useState(lesson.initial.join(', '));
  const [size, setSize] = useState(String(lesson.k));
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [guided, setGuided] = useState(true);
  const [speed, setSpeed] = useState(1200);
  const [prediction, setPrediction] = useState('');
  const [feedback, setFeedback] = useState('');
  const [answer, setAnswer] = useState('');
  const [reason, setReason] = useState('');
  const [practiceFeedback, setPracticeFeedback] = useState('');
  const frames = useMemo(() => traceAverage(nums, k), [nums, k]);
  const frame = frames[step];
  const completeWindow = frame.right - frame.left + 1 === k;
  const next = frames[step + 1];
  const canPredict = next && (next.kind === 'add' || next.kind === 'remove');
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setStep(s => {
      if (s >= frames.length - 2) setPlaying(false);
      return Math.min(s + 1, frames.length - 1);
    }), speed);
    return () => clearInterval(timer);
  }, [playing, frames.length, speed]);
  useEffect(() => { setPrediction(''); setFeedback(''); setFurthest(value => Math.max(value, step)); }, [step]);
  function go(value: number) { setPlaying(false); setStep(value); }
  function apply() {
    try { const parsed = parseInput(raw, size); setNums(parsed.nums); setK(parsed.k); setFurthest(0); go(0); setError(''); setPrediction(''); setFeedback(''); }
    catch (e) { setError((e as Error).message); }
  }
  function changeTab(value: typeof tab) { setPlaying(false); setTab(value); }

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="/" aria-label="LeetLove home"><span className="brand-icon"><Heart size={21} fill="currentColor" /></span>Leet<span>Love</span><span className="brand-dot">.</span></a>
      <div className="workspace-label">YOUR LEARNING SPACE</div>
      <a className="side-link active" href="#lesson"><BookOpen size={18} /> Algorithm studio <ChevronRight size={15} /></a>
      <div className="sidebar-divider" />
      <div className="workspace-label">LEARNING PATH</div>
      <div className="path-heading">The sliding window <span>01</span></div>
      <div className="path-item selected"><span className="path-dot" /><div>Maximum average<small>Fixed-size window</small></div></div>
      <div className="sidebar-note"><div className="note-icon"><Sparkles size={18} /></div><strong>Small steps. Big aha’s.</strong><p>You don’t have to memorize it.<br />You get to understand it.</p></div>
      <div className="sidebar-footer"><span className="avatar">Y</span><div>Your learning journey<small>One concept at a time</small></div></div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div>Algorithm studio <ChevronRight size={14} /><span>Sliding window</span></div><span className="stage-badge"><span /> Stage 01 · The foundations</span></header>
      <main id="lesson">
        <div className="eyebrow">LESSON 001 <span /> ARRAYS & STRINGS</div>
        <div className="title-row"><h1>{lesson.title}</h1><a className="problem-link" href="https://leetcode.com/problems/maximum-average-subarray-i/" target="_blank" rel="noreferrer">LeetCode 643 <ExternalLink size={14} /></a></div>
        <p className="subtitle">Find the best view. Move one step. Keep what matters.</p>
        <div className="tags"><span className="easy">Easy</span><span>Sliding window</span><span>O(n) time</span><span>O(1) extra space</span></div>
        <nav className="tabs" aria-label="Lesson sections">{([{ id: 'story', label: 'The story', Icon: BookOpen }, { id: 'visualize', label: 'Visualize', Icon: Play }, { id: 'practice', label: 'Try it yourself', Icon: Code2 }] as const).map(({ id, label, Icon }, i) => <button key={id} className={tab === id ? 'selected' : ''} aria-current={tab === id ? 'page' : undefined} onClick={() => changeTab(id)}><span className="tab-number">0{i + 1}</span><Icon size={16} />{label}</button>)}</nav>

        {tab === 'story' && <section className="story-panel panel"><div className="story-icon"><Camera size={32} /></div><div className="eyebrow">A MENTAL MODEL THAT STICKS</div><h2>A camera with a fixed frame.</h2><p>Imagine a row of scenes, each with a score. Your camera captures exactly <strong>k neighboring scenes</strong>. You want the frame with the highest average score.</p><p>When you move one scene to the right, most of the picture stays the same. Only one scene leaves on the left, and one arrives on the right.</p><div className="formula">new sum = old sum − outgoing + incoming</div><p>That’s a sliding window. Because every frame has the same size, the greatest sum also gives the greatest average. We divide the best sum by <strong>k</strong> at the end.</p><div className="story-caveat"><Lightbulb size={20} /><span>Negative scores still count. Start the best sum with the first actual window—not zero—or an all-negative input will give the wrong answer.</span></div><button className="primary" onClick={() => changeTab('visualize')}>Bring the story to life <ArrowRight size={16} /></button></section>}

        {tab === 'visualize' && <>
          <div className="story-strip"><span className="story-strip-icon"><Camera size={22} /></span><div><strong>Think of a camera sliding across a landscape.</strong><p>Keep a frame of {k} values. Let one leave, welcome one in, and look for the highest average.</p></div><button className="focus-lesson" onClick={() => { const lab = document.getElementById('lab-focus'); lab?.scrollIntoView({block: 'start', behavior: 'instant'}); lab?.focus({preventScroll:true}); }}>Start hands-on lesson <ArrowRight size={15} /></button></div>
          <div className="studio-grid">
            <section className="panel visualization"><div className="panel-heading"><div><span className="live-dot" /><h2>The sliding window</h2></div><span className="muted">INTERACTIVE CANVAS</span></div>
              <form className="input-row" onSubmit={e => { e.preventDefault(); apply(); }}><label>Array <input aria-label="Array" value={raw} onChange={e => setRaw(e.target.value)} /></label><label className="k-input">Window k <input aria-label="Window size" type="number" min="1" max="16" value={size} onChange={e => setSize(e.target.value)} /></label><button className="secondary" type="submit">Apply <ArrowRight size={14} /></button></form>
              {error && <p className="error" role="alert">{error}</p>}
              <div className="lab-mode"><div role="group" aria-label="Learning mode"><button aria-pressed={guided} className={guided ? 'selected' : ''} onClick={() => { setGuided(true); setPlaying(false); }}>Hands-on</button><button aria-pressed={!guided} className={!guided ? 'selected' : ''} onClick={() => { setGuided(false); setPlaying(false); }}>Watch & explore</button></div><span>{guided ? 'Choose the next action on the canvas' : 'Use playback or inspect individual values'}</span></div>
              <WindowLab nums={nums} k={k} frames={frames} step={step} furthest={furthest} guided={guided} advance={() => go(Math.min(step + 1, frames.length - 1))} seek={go} />
              <div className="metrics"><div><span>{frame.kind === 'done' ? 'LAST WINDOW SUM' : 'WINDOW SUM'}</span><strong data-testid="sum">{frame.sum}</strong></div><div><span>{frame.kind === 'done' ? 'LAST WINDOW AVG' : 'CURRENT AVERAGE'}</span><strong>{completeWindow ? format(frame.sum / k) : '—'}</strong></div><div className="best"><span><Target size={13} /> BEST AVERAGE</span><strong data-testid="best">{frame.best === null ? '—' : format(frame.best / k)}</strong></div></div>
              <div className="step-note" aria-live="polite"><span className="step-icon">{frame.kind === 'done' ? <Check size={18} /> : <Lightbulb size={18} />}</span><div><strong>{frame.title}</strong><p>{frame.explanation}</p></div></div>
              <div className="playback"><div className="timeline-row"><span>Step {step + 1} <span className="muted">of {frames.length}</span></span><input aria-label="Execution timeline" type="range" min="0" max={frames.length - 1} value={step} onChange={e => go(Number(e.target.value))} /></div><div className="controls"><button className="icon-button" aria-label="Reset" title="Reset" onClick={() => { setFurthest(0); go(0); }}><RotateCcw size={17} /></button><button className="secondary" disabled={step === 0} onClick={() => go(step - 1)}><ArrowLeft size={15} /> Back</button><button className="primary" disabled={guided || step === frames.length - 1} title={guided ? "Switch to Watch & explore for autoplay" : "Play animation"} onClick={() => setPlaying(!playing)}>{playing ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}{playing ? 'Pause' : 'Play'}</button><button className="secondary" disabled={guided || step === frames.length - 1} title={guided ? "Choose the next action in the canvas" : "Next step"} onClick={() => go(step + 1)}>Next <ArrowRight size={15} /></button><label className="speed"><select aria-label="Playback speed" value={speed} onChange={e => setSpeed(Number(e.target.value))}><option value={2400}>0.5× speed</option><option value={1200}>1× speed</option><option value={600}>2× speed</option></select></label></div></div>
            </section>
            <section className="panel code-panel"><div className="panel-heading"><div><Code2 size={18} /><h2>Behind the scenes</h2></div><span className="language">Python</span></div><div className="code-intro"><span className="live-dot" /> Code follows your every step</div><div className="code-scroll"><pre aria-label="Python solution">{lesson.code.map((line, i) => <div key={i} className={`code-line ${frame.line === i + 1 ? 'highlighted' : ''}`} aria-current={frame.line === i + 1 ? 'step' : undefined}><span className="line-number">{i + 1}</span><code>{line}</code></div>)}</pre></div><div className="code-insight"><span className="eyebrow">THE KEY INSIGHT</span><h3>Reuse the work you’ve done.</h3><p>Each slide needs just a subtraction and an addition. No need to sum the whole window again.</p><div className="complexity"><span><strong>O(n)</strong> time</span><span><strong>O(1)</strong> extra space</span></div><small>For the algorithm; the player stores snapshots for replay.</small></div></section>
          </div>
          <section className="prediction panel"><div className="prediction-title"><span className="prediction-icon"><Sparkles size={22} /></span><div><span className="eyebrow">PAUSE & PREDICT</span><h3>{canPredict ? `What will the sum be after ${next.kind === 'remove' ? 'removing' : 'adding'} ${nums[next.focus!]}?` : frame.kind === 'done' ? 'Ready to find a window on your own?' : 'Take the next step, then make a prediction.'}</h3><p>{canPredict ? 'Work it out before advancing. A little thinking makes it stick.' : 'Use what you learned to solve a fresh example.'}</p></div></div>{canPredict ? <form onSubmit={e => { e.preventDefault(); setPlaying(false); setFeedback(prediction.trim() !== '' && Number(prediction) === next.sum ? 'Correct! Advance to see it happen.' : `Not quite. Start with ${frame.sum}, then ${next.kind === 'remove' ? 'subtract' : 'add'} (${nums[next.focus!]}). Try again.`); }}><input aria-label="Predicted sum" placeholder="Your answer" type="number" required value={prediction} onFocus={() => setPlaying(false)} onChange={e => setPrediction(e.target.value)} /><button className="secondary">Check answer <ArrowRight size={15} /></button></form> : <button className="secondary" onClick={() => changeTab('practice')}>Try the challenge <ArrowRight size={15} /></button>}{feedback && <p className="feedback" role="status">{feedback}</p>}</section>
          <p className="canvas-footnote">Made for exploration · Try up to 16 values in the canvas, including negative numbers.</p>
        </>}

        {tab === 'practice' && <section className="panel practice-panel"><span className="eyebrow">YOUR TURN TO FIND THE VIEW</span><h2>A fresh frame. Same idea.</h2><p>For <code>nums = [4, -2, 6, 1, -3]</code> and <code>k = 2</code>, find the maximum average of two adjacent values.</p><form onSubmit={e => { e.preventDefault(); setPracticeFeedback(Number(answer) === 3.5 && answer.trim() !== '' && reason === 'reuse' ? 'You’ve got it! [6, 1] gives 7 / 2 = 3.5. Each slide reuses the previous sum by removing the outgoing value and adding the incoming one.' : 'Keep going. List the four adjacent pairs and average each one. For the explanation, think about which two values change when the window moves.'); }}><label>Maximum average<input type="number" step="any" required value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Enter your answer" /></label><fieldset><legend>Why can each slide take constant time?</legend>{[{ value: 'sort', text: 'We sort the array first.' }, { value: 'reuse', text: 'We subtract the outgoing value and add the incoming value.' }, { value: 'skip', text: 'We skip any window containing negative values.' }].map(option => <label className="radio-option" key={option.value}><input required type="radio" name="reason" value={option.value} checked={reason === option.value} onChange={e => setReason(e.target.value)} />{option.text}</label>)}</fieldset><button className="primary">Check my understanding <Check size={17} /></button></form>{practiceFeedback && <p className="practice-feedback" role="status">{practiceFeedback}</p>}<details><summary>Need a small hint?</summary><p>The pairs are [4, -2], [-2, 6], [6, 1], and [1, -3]. Keep the values adjacent; don’t sort them.</p></details></section>}
        <footer className="page-footer"><span>Learn the why. Love the how.</span><span>Built one aha at a time <Heart size={12} /></span></footer>
      </main>
    </div>
  </div>;
}
