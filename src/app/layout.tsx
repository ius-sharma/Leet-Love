import type { Metadata } from 'next';
import './academy.css';
import './product.css';
export const metadata: Metadata = { title: 'LeetLove · See the solution', description: 'Explore LeetCode problems, discover interactive visual solutions, and build algorithm intuition through hands-on practice.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {return <html lang="en"><body>{children}</body></html>;}
