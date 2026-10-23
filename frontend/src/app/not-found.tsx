import Link from 'next/link';

export default function RootNotFound() {
  return (
    <main className="container-site flex flex-1 flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow">Error 404</p>
      <h1 className="mt-3 text-3xl font-bold">Page not found</h1>
      <Link href="/" className="link mt-6">
        Go to the CARISCA homepage
      </Link>
    </main>
  );
}
