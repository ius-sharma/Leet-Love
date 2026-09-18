import type { Metadata } from 'next';
import './academy.css';
export const metadata: Metadata = { title: 'LeetLove · The learning library', description: 'Learn sliding windows through a story, an interactive visualizer, and deliberate practice.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

