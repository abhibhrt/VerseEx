'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const dailyQuestions: Question[] = [
  {
    id: 1,
    question: "What unique phenomenon occurs on Venus regarding its day and year length?",
    options: ["Days and years are equal", "Venus rotates backwards; its day is longer than its year", "It doesn't rotate at all", "Days last only 3 hours"],
    correctAnswer: 1,
    explanation: "Venus rotates in the opposite direction to most planets (retrograde rotation) and takes longer to rotate on its axis than to complete an orbit around the Sun."
  },
  {
    id: 2,
    question: "Which celestial body holds the record for the highest mountain in the solar system, Olympus Mons?",
    options: ["Earth", "Moon", "Mars", "Io"],
    correctAnswer: 2,
    explanation: "Olympus Mons on Mars is a shield volcano nearly three times the height of Mount Everest."
  },
  {
    id: 3,
    question: "What is the primary reason Neptune appears bright vibrant blue?",
    options: ["Deep water oceans", "Methane gas absorbing red light", "Nitrogen ice reflection", "Plasma interaction"],
    correctAnswer: 1,
    explanation: "Neptune's atmosphere contains methane, which absorbs red wavelengths of light and gives it a striking blue appearance."
  },
  {
    id: 4,
    question: "At what speed does the Milky Way galaxy rotate around its supermassive black hole center?",
    options: ["About 50 km/s", "About 210-240 km/s", "About 1,000 km/s", "It is completely stationary"],
    correctAnswer: 1,
    explanation: "Our solar system moves at an average speed of about 220 kilometers per second around the galactic center."
  },
  {
    id: 5,
    question: "Which moon in our solar system features active cryovolcanism spewing nitrogen ice plumes?",
    options: ["Europa", "Titan", "Enceladus", "Ganymede"],
    correctAnswer: 2,
    explanation: "Saturn's moon Enceladus shoots plumes of water ice and gas from subsurface ocean vents."
  }
];

interface LeaderboardUser {
  rank: number;
  name: string;
  score: number;
  timeTaken: string;
  badge?: string;
}

const eliteLeaderboard: LeaderboardUser[] = [
  { rank: 1, name: "Aarav 'Cosmo' S.", score: 5, timeTaken: "18s", badge: "👑 Grandmaster" },
  { rank: 2, name: "Rohan V.", score: 5, timeTaken: "22s", badge: "⚡ Elite" },
  { rank: 3, name: "Priya M.", score: 5, timeTaken: "25s", badge: "🔥 Expert" },
  { rank: 4, name: "Vikram K.", score: 4, timeTaken: "19s", badge: "🌟 Veteran" },
  { rank: 5, name: "Neha G.", score: 4, timeTaken: "24s", badge: "🚀 Explorer" },
  { rank: 6, name: "Kabir D.", score: 3, timeTaken: "16s", badge: "✨ Scout" },
  { rank: 7, name: "Ananya R.", score: 3, timeTaken: "21s", badge: "✨ Scout" },
];

export default function ProfessionalSpaceQuiz() {
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const [isQuizStarted, setIsQuizStarted] = useState<boolean>(false);
  const [isQuizCompleted, setIsQuizCompleted] = useState<boolean>(false);
  const [totalTimeSpent, setTotalTimeSpent] = useState<number>(0);

  const currentQuestion = dailyQuestions[currentQuestionIndex];

  // Timer Trigger
  useEffect(() => {
    if (!isQuizStarted || isQuizCompleted || isAnswered) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestionIndex, isQuizStarted, isAnswered, isQuizCompleted]);

  const handleTimeOut = () => {
    setIsAnswered(true);
    setSelectedOption(-1);
  };

  const handleOptionClick = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);

    const timeSpentOnQ = 10 - timeLeft;
    setTotalTimeSpent((prev) => prev + timeSpentOnQ);

    if (index === currentQuestion.correctAnswer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    setTimeLeft(10);

    if (currentQuestionIndex + 1 < dailyQuestions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setIsQuizCompleted(true);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) return;
    setIsRegistered(true);
  };

  return (
    <div className="relative w-screen h-screen bg-[#030307] text-white font-sans flex flex-col justify-center overflow-hidden select-none p-4 md:p-6 pt-20">
      
      {/* Background Gradients & Effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Main Full-Screen Grid Layout (Zero Border Radius & Top Padding for Navbar Safety) */}
      <main className="relative z-30 w-full max-w-7xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center my-auto">
        
        {/* LEFT COLUMN: Ultra-Professional Leaderboard & Prizes */}
        <div className="lg:col-span-5 h-[80vh] bg-black/80 backdrop-blur-3xl border border-white/10 p-5 md:p-6 rounded-none shadow-2xl flex flex-col justify-between">
          <div className="flex flex-col gap-4 h-full">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-cyan-400 rounded-none animate-pulse"></span>
                <span className="text-xs font-black uppercase tracking-widest text-cyan-400">
                  Global Hall of Fame
                </span>
              </div>
              <span className="text-[10px] text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-none border border-amber-500/30 font-bold uppercase tracking-wider">
                Season 1
              </span>
            </div>

            {/* Elite Prizes Card */}
            <div className="bg-gradient-to-br from-amber-500/10 via-purple-600/10 to-cyan-500/10 border border-amber-500/25 p-3.5 rounded-none flex flex-col gap-2.5">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-black text-amber-300 uppercase tracking-wider">🏆 Top 3 Season Rewards</span>
                <span className="text-[9px] text-white/40 uppercase">Verified Payouts</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="bg-black/70 p-2.5 rounded-none border border-amber-500/40 flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-amber-500 text-black text-[8px] font-black px-1">#1</div>
                  <span className="font-black text-amber-400 text-xs">Pro Telescope</span>
                  <span className="text-white/60 text-[9px] mt-0.5">Celestron Astromaster</span>
                </div>
                <div className="bg-black/70 p-2.5 rounded-none border border-slate-400/30 flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-slate-300 text-black text-[8px] font-black px-1">#2</div>
                  <span className="font-black text-slate-200 text-xs">NASA Hoodie</span>
                  <span className="text-white/60 text-[9px] mt-0.5">Official Edition</span>
                </div>
                <div className="bg-black/70 p-2.5 rounded-none border border-orange-500/40 flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-orange-500 text-black text-[8px] font-black px-1">#3</div>
                  <span className="font-black text-orange-400 text-xs">3D Space Kit</span>
                  <span className="text-white/60 text-[9px] mt-0.5">Solar System Model</span>
                </div>
              </div>
            </div>

            {/* Advanced Leaderboard Table */}
            <div className="flex flex-col gap-2 flex-1 overflow-hidden">
              <div className="flex justify-between items-center px-1 text-[10px] text-white/40 uppercase font-mono tracking-wider">
                <span>Rank & Explorer</span>
                <span>Score / Speed</span>
              </div>
              <div className="flex flex-col gap-1.5 overflow-y-auto pr-1 flex-1 custom-scrollbar">
                {eliteLeaderboard.map((user) => (
                  <div 
                    key={user.rank}
                    className={`flex items-center justify-between p-3 rounded-none border text-xs font-semibold transition-all ${
                      user.rank === 1 ? 'bg-amber-500/15 border-amber-500/40 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.15)]' :
                      user.rank === 2 ? 'bg-slate-400/10 border-slate-400/30 text-slate-200' :
                      user.rank === 3 ? 'bg-orange-500/10 border-orange-500/35 text-orange-200' :
                      'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 text-center font-black ${user.rank <= 3 ? 'text-amber-400 text-sm' : 'text-white/40'}`}>
                        {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : user.rank === 3 ? '🥉' : `#${user.rank}`}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-bold tracking-wide">{user.name}</span>
                        {user.badge && <span className="text-[9px] text-cyan-400 font-mono">{user.badge}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-xs">
                      <span className="text-cyan-400 font-black">{user.score}/5</span>
                      <span className="text-white/40 bg-white/5 px-2 py-0.5 border border-white/10">{user.timeTaken}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-3 flex justify-between items-center text-[10px] text-white/40 font-mono">
            <span>Anti-Cheat Guard: Active</span>
            <span>Resets @ 00:00 UTC</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Quiz / Registration Workspace */}
        <div className="lg:col-span-7 h-[80vh] bg-black/80 backdrop-blur-3xl border border-white/10 p-6 md:p-8 rounded-none shadow-2xl flex flex-col justify-center relative overflow-y-auto">
          
          {/* Back Navigation Button */}
          <div className="absolute top-4 left-6 z-40">
            <Link 
              href="/space-3d" 
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/15 rounded-none text-xs font-semibold backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer shadow-lg text-white/80 hover:text-white"
            >
              ← Back to Solar System
            </Link>
          </div>

          <div className="mt-8 w-full flex flex-col justify-center flex-1">
            {!isRegistered ? (
              /* STEP 1: Professional Registration */
              <form onSubmit={handleRegister} className="max-w-xl mx-auto w-full flex flex-col gap-6">
                <div className="flex flex-col gap-2 text-center md:text-left">
                  <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Secure Protocol</span>
                  <h2 className="text-2xl md:text-3xl font-black text-white">Enter Daily Cosmic Arena</h2>
                  <p className="text-xs text-white/60">Register your credentials to lock your unique attempt on the live leaderboard.</p>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-white/70">Full Name / Alias</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Neil Armstrong"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full bg-white/5 border border-white/15 px-4 py-3.5 rounded-none text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400 transition-all font-medium"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-white/70">Email or Student ID</label>
                    <input 
                      type="email" 
                      required
                      placeholder="e.g. neil@cosmos.org"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/15 px-4 py-3.5 rounded-none text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-none flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">⚠️ Hardcore Rules:</span>
                  <p className="text-[11px] text-white/70 leading-relaxed">Each question has a strict 10-second timer. Automatic submission applies if time expires.</p>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-xs uppercase tracking-widest rounded-none shadow-lg shadow-cyan-500/30 transition-all cursor-pointer"
                >
                  Register & Initialize Quiz 🚀
                </button>
              </form>
            ) : !isQuizStarted ? (
              /* STEP 2: Ready Screen */
              <div className="max-w-xl mx-auto w-full flex flex-col items-center text-center py-8 gap-6">
                <div className="w-20 h-20 rounded-none bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-3xl text-cyan-300 shadow-[0_0_30px_#22d3ee]">
                  ⚡
                </div>

                <div className="flex flex-col gap-2">
                  <h2 className="text-3xl font-black text-white">System Ready, {userName}!</h2>
                  <p className="text-xs text-white/60 max-w-md leading-relaxed">
                    You are verified. Once you hit begin, the 10-second timer for Question 1 will start immediately.
                  </p>
                </div>

                <button
                  onClick={() => setIsQuizStarted(true)}
                  className="w-full max-w-sm py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-widest rounded-none shadow-lg shadow-cyan-500/30 transition-all cursor-pointer"
                >
                  Start Test Now 🔥
                </button>
              </div>
            ) : !isQuizCompleted ? (
              /* STEP 3: Active Quiz */
              <div className="max-w-2xl mx-auto w-full flex flex-col gap-6">
                <div className="flex flex-col gap-3 border-b border-white/10 pb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-none flex items-center gap-1.5">
                      🔥 10s Strict Timer
                    </span>
                    <span className="text-xs text-white/60 font-medium">
                      Question {currentQuestionIndex + 1} of {dailyQuestions.length}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-white/10 h-2 rounded-none overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${timeLeft <= 3 ? 'bg-red-500 shadow-[0_0_12px_#ef4444]' : 'bg-cyan-400'}`}
                      style={{ width: `${(timeLeft / 10) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-white/50 font-mono">
                    <span>Auto-Submit Countdown</span>
                    <span className={`font-bold text-sm ${timeLeft <= 3 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`}>{timeLeft}s</span>
                  </div>
                </div>

                <h2 className="text-lg md:text-xl font-bold leading-relaxed text-white/95 select-none">
                  {currentQuestion.question}
                </h2>

                <div className="grid grid-cols-1 gap-3">
                  {currentQuestion.options.map((option, index) => {
                    let buttonStyle = "bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/30";

                    if (isAnswered) {
                      if (index === currentQuestion.correctAnswer) {
                        buttonStyle = "bg-green-500/20 border-green-500 text-green-300 shadow-[0_0_15px_rgba(34,197,94,0.3)]";
                      } else if (index === selectedOption) {
                        buttonStyle = "bg-red-500/20 border-red-500 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.3)]";
                      } else {
                        buttonStyle = "bg-white/5 border-white/5 text-white/30 opacity-40";
                      }
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => handleOptionClick(index)}
                        disabled={isAnswered}
                        className={`w-full p-4 rounded-none border text-left text-xs font-semibold transition-all cursor-pointer flex justify-between items-center ${buttonStyle}`}
                      >
                        <span>{option}</span>
                        <span className="w-6 h-6 rounded-none border border-white/20 flex items-center justify-center text-[10px] text-white/40 font-mono">
                          {String.fromCharCode(65 + index)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {isAnswered && (
                  <div className="bg-white/5 border border-white/10 p-4 rounded-none flex flex-col gap-3 animate-fadeIn">
                    <p className="text-xs text-white/80 leading-relaxed">
                      <strong className="text-cyan-400">Insight: </strong> {currentQuestion.explanation}
                    </p>
                    <button
                      onClick={handleNextQuestion}
                      className="self-end px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-none shadow-lg shadow-cyan-500/30 transition-all cursor-pointer"
                    >
                      {currentQuestionIndex + 1 === dailyQuestions.length ? "View Final Score ➔" : "Next Question ➔"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* STEP 4: Completion Screen */
              <div className="max-w-xl mx-auto w-full flex flex-col items-center text-center py-6 gap-6">
                <div className="w-20 h-20 rounded-none bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-3xl text-cyan-300 shadow-[0_0_30px_#22d3ee]">
                  🏆
                </div>

                <div className="flex flex-col gap-1.5">
                  <h2 className="text-2xl md:text-3xl font-black text-white">Challenge Completed, {userName}!</h2>
                  <p className="text-xs text-white/60">Your final score and time have been securely recorded on the leaderboards.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-none flex flex-col items-center">
                    <span className="text-[10px] text-white/50 uppercase font-semibold">Final Score</span>
                    <span className="text-3xl font-black text-cyan-400 mt-1">{score} / {dailyQuestions.length}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-none flex flex-col items-center">
                    <span className="text-[10px] text-white/50 uppercase font-semibold">Total Time</span>
                    <span className="text-3xl font-black text-amber-400 mt-1">{totalTimeSpent}s</span>
                  </div>
                </div>

                <div className="flex gap-4 w-full pt-2">
                  <Link 
                    href="/space-3d" 
                    className="flex-1 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-black rounded-none text-xs font-bold text-center transition-all shadow-lg shadow-cyan-500/30 cursor-pointer flex items-center justify-center uppercase tracking-wider"
                  >
                    Return to 3D Space
                  </Link>
                </div>
              </div>
            )}
          </div>

        </div>

      </main>

    </div>
  );
}