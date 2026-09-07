'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Loading from '@/app/loading';

interface WikipediaFullResult {
  title: string;
  extract: string;
  description?: string;
  thumbnail?: { source: string; width: number; height: number; };
  originalimage?: { source: string; };
  content_urls: { desktop: { page: string; }; };
  coordinates?: { lat: number; lon: number; };
  timestamp?: string;
  lang?: string; dir?: string; ns?: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s?/g, '')
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
    .trim();
}

export default function SearchPage() {
  const params = useParams();
  const rawSlug = typeof params?.slug === 'string' ? params.slug : '';
  const searchQuery = rawSlug.replace(/%20/g, "_");

  const [result, setResult] = useState<WikipediaFullResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Q&A States
  const [question, setQuestion] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [askingAi, setAskingAi] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!searchQuery) {
      setLoading(false);
      setError("Please provide a search term.");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data: WikipediaFullResult = await res.json();
          setResult(data);
          setError(null);
          setChatMessages([]);
        } else {
          setError("No results found.");
          setResult(null);
        }
      } catch {
        setError("Failed to fetch data from Wikipedia.");
        setResult(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchQuery]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    };
  }, []);

  // StrictMode-proof typewriter function using string slicing
  const typeOutResponse = (fullText: string) => {
    setIsTyping(true);

    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
    }

    // Assistant message placeholder
    setChatMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    let currentIndex = 0;

    typingTimerRef.current = setInterval(() => {
      currentIndex++;

      if (currentIndex <= fullText.length) {
        const textSlice = fullText.slice(0, currentIndex);
        setChatMessages((prev) => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
            lastMsg.content = textSlice;
          }
          return updated;
        });
      } else {
        if (typingTimerRef.current) clearInterval(typingTimerRef.current);
        setIsTyping(false);
      }
    }, 15);
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !result || askingAi || isTyping) return;

    const userQuery = question.trim();
    setQuestion('');
    setChatMessages((prev) => [...prev, { role: 'user', content: userQuery }]);
    setAskingAi(true);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userQuery,
          context: result.extract,
          title: result.title,
        }),
      });

      const data = await res.json();

      if (res.ok && data.answer) {
        const cleanedAnswer = cleanMarkdown(data.answer);
        typeOutResponse(cleanedAnswer);
      } else {
        typeOutResponse(data.error || 'Failed to get an answer. Please retry.');
      }
    } catch {
      typeOutResponse('Connection error: Unable to reach the AI service.');
    } finally {
      setAskingAi(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#030712] text-zinc-100 flex flex-col font-sans">
      <main className="flex-1 w-full flex flex-col">
        {loading ? (
          <Loading />
        ) : error || !result ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center shadow-xl">
              <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-base">
                404
              </div>
              <h1 className="text-lg font-semibold text-zinc-100 mb-2">No Article Found</h1>
              <p className="text-zinc-400 text-sm mb-6">
                Couldn't find anything matching "{searchQuery.replace(/_/g, " ")}".
              </p>
              <Link href="/" className="inline-flex items-center justify-center w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-xl transition cursor-pointer">
                Back to Search
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Header Banner */}
            <div className="w-full bg-[#050b14] border-b border-zinc-900 py-16 px-8 lg:px-24">
              <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
                <div className="space-y-4 max-w-3xl">
                  {result.description && (
                    <span className="inline-block px-3 py-1 mt-2 bg-cyan-950/40 border border-cyan-800/40 text-cyan-300 text-xs rounded-full font-medium">
                      {result.description}
                    </span>
                  )}
                  <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">
                    {result.title}
                  </h1>
                  {result.timestamp && (
                    <p className="text-xs text-zinc-500">
                      Last updated: {new Date(result.timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>

                {result.originalimage && (
                  <div className="shrink-0">
                    <img 
                      src={result.originalimage.source} 
                      alt={result.title} 
                      className="w-56 h-56 sm:w-64 sm:h-64 object-cover border border-zinc-800 rounded-2xl shadow-xl"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Content & Q&A Grid */}
            <div className="max-w-6xl w-full mx-auto px-8 lg:px-24 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-8">
                
                <div className="border-b border-zinc-900 pb-4">
                  <h3 className="text-sm font-semibold text-zinc-300 flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    <span>Overview</span>
                  </h3>
                </div>

                <p className="text-base sm:text-lg text-zinc-300 leading-relaxed font-normal">
                  {result.extract}
                </p>

                <div>
                  <a
                    href={result.content_urls.desktop.page}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-medium rounded-xl transition cursor-pointer"
                  >
                    <span>Read Full Wikipedia Article</span>
                    <span>→</span>
                  </a>
                </div>

                {/* Interactive Q&A Area */}
                <div className="pt-8 border-t border-zinc-900 space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-cyan-400 fill-current" viewBox="0 0 24 24">
                        <path d="M12 0C12 6.627 6.627 12 0 12c6.627 0 12 5.373 12 12 0-6.627 5.373-12 12-12-6.627 0-12-5.373-12-12z" />
                      </svg>
                      <h4 className="text-sm font-semibold text-zinc-200">
                        Ask questions about {result.title}
                      </h4>
                    </div>
                    <span className="text-[11px] text-zinc-500 font-medium">Powered by Gemini</span>
                  </div>

                  {/* Messages */}
                  {chatMessages.length > 0 && (
                    <div className="space-y-3 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4">
                      {chatMessages.map((msg, index) => {
                        const isLastAssistantMessage = index === chatMessages.length - 1 && msg.role === 'assistant';
                        
                        return (
                          <div
                            key={index}
                            className={`flex flex-col text-sm ${
                              msg.role === 'user' ? 'items-end' : 'items-start'
                            }`}
                          >
                            <div
                              className={`max-w-[85%] rounded-2xl px-4 py-2.5 leading-relaxed ${
                                msg.role === 'user'
                                  ? 'bg-cyan-950/60 border border-cyan-800/50 text-cyan-100'
                                  : 'bg-zinc-800/70 border border-zinc-700/60 text-zinc-200'
                              }`}
                            >
                              <span className="block text-[10px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider">
                                {msg.role === 'user' ? 'You' : 'Gemini'}
                              </span>
                              <span>{msg.content}</span>
                              {isLastAssistantMessage && isTyping && (
                                <span className="inline-block w-1.5 h-3.5 ml-1 bg-cyan-400 rounded-sm animate-pulse align-middle" />
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {askingAi && (
                        <div className="flex items-center gap-2 text-xs text-zinc-400 py-2">
                          <svg className="animate-spin w-3.5 h-3.5 text-cyan-400 fill-current shrink-0" viewBox="0 0 24 24">
                            <path d="M12 0C12 6.627 6.627 12 0 12c6.627 0 12 5.373 12 12 0-6.627 5.373-12 12-12-6.627 0-12-5.373-12-12z" />
                          </svg>
                          <span>Thinking...</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Input Form */}
                  <form onSubmit={handleAskQuestion} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder={`Ask anything about ${result.title}...`}
                      disabled={askingAi || isTyping}
                      className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-cyan-500/60 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={askingAi || isTyping || !question.trim()}
                      className="px-5 py-2.5 bg-cyan-950/70 border border-cyan-800/70 hover:bg-cyan-900/60 text-cyan-200 text-xs font-medium rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {askingAi ? 'Thinking...' : isTyping ? 'Typing...' : 'Ask'}
                    </button>
                  </form>
                </div>

              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 shadow-sm">
                  <h4 className="text-xs font-semibold text-zinc-300 border-b border-zinc-800 pb-3 mb-4">
                    Quick Details
                  </h4>
                  <div className="space-y-4 text-xs">
                    <div>
                      <span className="block text-zinc-500 mb-0.5">Topic</span>
                      <span className="text-zinc-200 font-medium text-sm">{result.title}</span>
                    </div>
                    {result.lang && (
                      <div>
                        <span className="block text-zinc-500 mb-0.5">Language</span>
                        <span className="text-zinc-200 font-medium uppercase">{result.lang}</span>
                      </div>
                    )}
                    {result.coordinates && (
                      <div>
                        <span className="block text-zinc-500 mb-0.5">Coordinates</span>
                        <span className="text-zinc-200 font-medium">
                          {result.coordinates.lat.toFixed(4)}, {result.coordinates.lon.toFixed(4)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {result.thumbnail && !result.originalimage && (
                  <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 shadow-sm">
                    <img 
                      src={result.thumbnail.source} 
                      alt={result.title} 
                      className="w-full h-48 object-cover rounded-xl"
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