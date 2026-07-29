import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://verseex.com'),
  title: {
    default: "VerseEx - Explore the Cosmos | Space Learning Platform",
    template: "%s | VerseEx - Space Exploration & Cosmology"
  },
  description: "VerseEx is a comprehensive space learning platform offering 3D solar system exploration, cosmic quizzes, AI-powered space research, and real-time celestial updates. Explore the universe from your browser.",
  keywords: [
    "space exploration",
    "cosmology",
    "3D solar system",
    "space quizzes",
    "astronomy",
    "NASA",
    "space research",
    "celestial bodies",
    "planets",
    "galaxy",
    "universe",
    "space learning",
    "interactive space",
    "space education",
    "cosmic research",
    "astrophysics",
    "space technology"
  ],
  authors: [
    { name: "VerseEx Team", url: "https://verseex.com" }
  ],
  creator: "VerseEx",
  publisher: "VerseEx",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
    other: {
      rel: 'icon',
      url: '/favicon.ico',
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://verseex.com",
    siteName: "VerseEx - Space Exploration Platform",
    title: "VerseEx - Explore the Cosmos | Interactive Space Learning",
    description: "Experience the universe like never before. Explore 3D solar systems, test your knowledge with cosmic quizzes, and dive into space research with VerseEx.",
    images: [
      {
        url: '/favicon.ico',
        width: 256,
        height: 256,
        alt: 'VerseEx Space Learning Platform Logo',
        type: 'image/x-icon',
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VerseEx - Explore the Cosmos | Space Learning Platform",
    description: "Experience the universe like never before. Explore 3D solar systems, test your knowledge with cosmic quizzes, and dive into space research with VerseEx.",
    images: ['/favicon.ico'],
    creator: "@verseex",
    site: "@verseex",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
  category: "Education",
  classification: "Space Education, Astronomy, Cosmology",
  alternates: {
    canonical: 'https://verseex.com',
  },
  assets: ['/favicon.ico'],
};

// JSON-LD structured data for better SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": "VerseEx",
  "description": "Interactive space learning platform offering 3D solar system exploration, cosmic quizzes, and AI-powered space research.",
  "url": "https://verseex.com",
  "logo": "https://verseex.com/favicon.ico",
  "sameAs": [
    "https://twitter.com/verseex",
    "https://github.com/verseex",
    "https://youtube.com/verseex"
  ],
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://verseex.com/search/{search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        {/* SEO Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
        <meta name="theme-color" content="#030307" />
        <meta name="msapplication-TileColor" content="#030307" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Link Tags for SEO */}
        <link rel="canonical" href="https://verseex.com" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        
        {/* Preconnect for Performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen flex flex-col bg-[#030307]">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}