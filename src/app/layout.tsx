import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'LeetLove · Maximum Average Subarray I', description: 'Learn sliding windows through a story, an interactive visualizer, and deliberate practice.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
