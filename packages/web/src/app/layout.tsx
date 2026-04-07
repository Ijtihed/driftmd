import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'driftmd',
  description: 'Your README is lying. driftmd catches it.',
  openGraph: {
    title: 'driftmd',
    description: 'Semantic drift detection. Your README says one thing, your code says another.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Manrope:wght@200..800&family=JetBrains+Mono:wght@100..700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@100..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-dvh flex flex-col">
        {children}
      </body>
    </html>
  );
}
