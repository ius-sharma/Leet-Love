import { notFound } from 'next/navigation';
import { getLesson, lessons } from '@/lessons/catalog';
import { LessonPlayer } from '@/components/lesson-player';
export function generateStaticParams(){return lessons.map(lesson=>({slug:lesson.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return {title:`${getLesson(slug)?.shortTitle??'Lesson not found'} · LeetLove`};}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const lesson=getLesson(slug);if(!lesson)notFound();return <LessonPlayer key={lesson.id} id={lesson.id}/>;}
