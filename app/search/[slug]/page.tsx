'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Loading from '@/app/loading';

interface WikipediaFullResult {
  title: string;
  extract: string;
  description?: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  originalimage?: {
    source: string;
  };
  content_urls: {
    desktop: {
      page: string;
    };
  };
  coordinates?: {
    lat: number;
    lon: number;
  };
  timestamp?: string;
  lang?: string;
  dir?: string;
  ns?: number;
}

export default function SearchPage() {
  const params = useParams();
  const str = typeof params?.slug === 'string' ? params.slug : '';
  const searchQuery = str.replace(/%20/g, "_");

  const [result, setResult] = useState<WikipediaFullResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!searchQuery) {
      setLoading(false);
      setError("No search query provided.");
      return;
    }
    const str = searchQuery.replaceAll("%", "_");

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(str)}`);
        if (res.ok) {
          const data: WikipediaFullResult = await res.json();
          setResult(data);
          setError(null);
        } else {
          setError("Couldn't get the Data");
          setResult(null);
        }
      } catch (err) {
        setError("An error occurred while fetching data.");
        setResult(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchQuery]);

  return (
    <div className="min-h-screen w-full bg-[#030712] text-zinc-100 flex flex-col selection:bg-cyan-500 selection:text-black font-sans">
      {/* Main Full-Screen Layout */}
      <main className="flex-1 w-full flex flex-col">
        {loading ? (
          <Loading/>
        ) : error || !result ? (
          /* Error State */
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-lg w-full bg-zinc-950 border border-zinc-900 p-10 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent"></div>
              <div className="w-14 h-14 bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto mb-6 font-mono text-lg font-bold rounded-none">
                404
              </div>
              <h1 className="text-xl font-bold text-zinc-100 mb-2 uppercase tracking-wide">Data Matrix Void</h1>
              <p className="text-zinc-500 text-sm mb-8 font-light">
                No indexed parameters found matching <span className="text-zinc-300 font-mono">"{searchQuery}"</span>.
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 font-mono text-xs uppercase tracking-widest transition-all rounded-none"
              >
                Return to Matrix
              </Link>
            </div>
          </div>
        ) : (
          /* Full Screen Immersive Wiki Layout */
          <div className="flex-1 flex flex-col">
            {/* Hero Banner Section */}
            <div className="relative w-full bg-[#050b14] border-b border-zinc-900 py-20 px-8 lg:px-28">
              <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-12">
                <div className="space-y-6 max-w-4xl">
                  {result.description && (
                    <div className="inline-flex items-center space-x-2 px-3 py-1 bg-cyan-950/30 border border-cyan-800/40 text-cyan-400 text-xs font-mono uppercase tracking-widest rounded-none">
                      <span>{result.description}</span>
                    </div>
                  )}
                  <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight uppercase leading-none">
                    {result.title}
                  </h1>
                  {result.timestamp && (
                    <p className="text-xs font-mono text-zinc-500">
                      TIMESTAMP: {new Date(result.timestamp).toUTCString()}
                    </p>
                  )}
                </div>

                {result.originalimage && (
                  <div className="relative group shrink-0">
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 opacity-20 blur-sm"></div>
                    <img
                      src={result.originalimage.source}
                      alt={result.title}
                      className="relative w-64 h-64 sm:w-72 sm:h-72 object-cover border border-zinc-800 shadow-2xl rounded-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Information Grid Container */}
            <div className="max-w-7xl w-full mx-auto px-8 lg:px-28 py-16 grid grid-cols-1 lg:grid-cols-3 gap-16">
              {/* Main Summary Panel */}
              <div className="lg:col-span-2 space-y-10">
                <div className="space-y-4">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-cyan-400 flex items-center space-x-2">
                    <span>01</span>
                    <span className="w-8 h-[1px] bg-cyan-400/40"></span>
                    <span>Executive Abstract</span>
                  </h3>
                  <p className="text-lg sm:text-xl text-zinc-300 leading-relaxed font-light">
                    {result.extract}
                  </p>
                </div>

                <div className="pt-4">
                  <a
                    href={result.content_urls.desktop.page}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-4 px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-800 hover:border-cyan-500/50 font-mono text-xs uppercase tracking-widest transition-all group rounded-none"
                  >
                    <span>Access Primary Source Entry</span>
                    <span className="text-cyan-400 transform group-hover:translate-x-1 transition-transform">→</span>
                  </a>
                </div>
              </div>

              {/* Sidebar Metadata Cards */}
              <div className="space-y-8">
                <div className="bg-zinc-950 border border-zinc-900 p-8 shadow-xl space-y-6 rounded-none">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400 border-b border-zinc-900 pb-4 flex items-center justify-between">
                    <span>Metadata Matrix</span>
                    <span className="w-2 h-2 bg-cyan-400"></span>
                  </h4>

                  <div className="space-y-5 text-xs font-mono">
                    <div>
                      <span className="block text-zinc-600 uppercase mb-1">Target ID / Title</span>
                      <span className="text-zinc-200 font-semibold">{result.title}</span>
                    </div>

                    {result.lang && (
                      <div>
                        <span className="block text-zinc-600 uppercase mb-1">Language Protocol</span>
                        <span className="text-zinc-200 font-semibold uppercase">{result.lang}</span>
                      </div>
                    )}

                    {result.dir && (
                      <div>
                        <span className="block text-zinc-600 uppercase mb-1">Syntax Direction</span>
                        <span className="text-zinc-200 font-semibold uppercase">{result.dir}</span>
                      </div>
                    )}

                    {result.ns !== undefined && (
                      <div>
                        <span className="block text-zinc-600 uppercase mb-1">Namespace Index</span>
                        <span className="text-zinc-200 font-semibold">{result.ns}</span>
                      </div>
                    )}

                    {result.coordinates && (
                      <div>
                        <span className="block text-zinc-600 uppercase mb-1">Geospatial Coordinates</span>
                        <span className="text-zinc-200 font-semibold">
                          {result.coordinates.lat.toFixed(4)}, {result.coordinates.lon.toFixed(4)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {result.thumbnail && !result.originalimage && (
                  <div className="bg-zinc-950 border border-zinc-900 p-8 shadow-xl space-y-4 rounded-none">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400 border-b border-zinc-900 pb-4">
                      Visual Fragment
                    </h4>
                    <img
                      src={result.thumbnail.source}
                      alt={result.title}
                      className="w-full h-52 object-cover border border-zinc-900 rounded-none"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}