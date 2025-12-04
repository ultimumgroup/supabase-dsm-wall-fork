import AuthForm from '@/components/AuthForm';
import Navigation from '@/components/Navigation';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Image 
              src="/images/supabase-dsm-logo.png" 
              alt="Supabase Des Moines" 
              width={280}
              height={80}
              priority
            />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            The Wall
          </h1>
          <p className="text-lg text-gray-600">
            A community platform for the Des Moines Supabase Meetup
          </p>
        </div>
        <AuthForm />
      </main>
    </div>
  );
}
