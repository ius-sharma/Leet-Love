import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, ArrowUpRight, Sparkles, LockKeyhole } from 'lucide-react';
import catalog from '@/data/problems.json';
import { lessons } from '@/lessons/catalog';
import { AcademyShell } from '@/components/academy-shell';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}) {
 const {slug}=await params;const problem=catalog.problems.find(p=>p.slug===slug);
 return {title:problem?`${problem.title} · LeetLove`:'Problem not found · LeetLove'};
}
export default async function ProblemPage({params}:{params:Promise<{slug:string}>}) {
 const {slug}=await params;const problem=catalog.problems.find(p=>p.slug===slug);if(!problem)notFound();
 const lesson=lessons.find(l=>l.slug===slug);
 return <AcademyShell active="problem"><main className="catalog-main problem-detail"><Link className="back-link" href="/">← Problem explorer</Link><div className="product-eyebrow">LEETCODE / {problem.number}</div><h1>{problem.title}</h1><div className="detail-meta"><span className={`level ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span><span>{problem.acceptance}% acceptance</span>{problem.premium&&<span><LockKeyhole size={14}/> LeetCode Premium</span>}</div><section className="detail-solution"><Sparkles size={28}/><h2>{lesson?'See this solution come to life.':'A good problem. A new perspective to come.'}</h2><p>{lesson?lesson.objective:'A LeetLove visual solution is not available for this problem yet. You can read the problem statement and practice on LeetCode.'}</p>{lesson&&<><div className="detail-pattern">{lesson.pattern} · {lesson.complexity}</div><Link className="button primary" href={`/learn/${lesson.slug}`}>Open visual solution <ArrowRight size={16}/></Link></>}<a className="button secondary" href={`https://leetcode.com/problems/${problem.slug}/`} target="_blank" rel="noreferrer">{problem.premium?'View on LeetCode (Premium)':'Read & solve on LeetCode'}<ArrowUpRight size={16}/></a></section><div className="catalog-section-title"><div><h2>Explore visual solutions</h2><p>Build intuition with an interactive walkthrough.</p></div></div><div className="related-visuals">{lessons.filter(l=>l.slug!==slug).slice(0,3).map(l=><Link key={l.id} href={`/learn/${l.slug}`}><Sparkles size={18}/><small>{l.pattern}</small><h3>{l.title}</h3><span>Explore solution <ArrowRight size={14}/></span></Link>)}</div></main></AcademyShell>;
}