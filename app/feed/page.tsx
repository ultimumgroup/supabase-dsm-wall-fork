'use client';

import FeedList from '@/components/FeedList';
import Navigation from '@/components/Navigation';
import { useSearchParams } from 'next/navigation';

export default function FeedPage() {
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter') as any;
  const userId = searchParams.get('userId') || undefined;

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Community Feed</h1>
        <FeedList initialFilter={filter} initialUserId={userId} />
      </main>
    </div>
  );
}
