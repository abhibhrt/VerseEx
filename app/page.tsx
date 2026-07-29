'use client';

import React, { useEffect, useState } from 'react';
import YouTubeShortsSection from "../components/embed";

interface SpaceTopic {
  topic: string;
  video_link: string;
}

interface MissionData {
  space_topics?: SpaceTopic[];
  [key: string]: any;
}

export default function Home() {
  const [data, setData] = useState<MissionData>({});
  const [youtube, setYT] = useState<SpaceTopic>({ topic: 'Calibrating quantum telemetry...', video_link: '' });
  const [currshow, setCurr] = useState<string>('');

  // useEffect(() => {
  //   const fetchMissions = async () => {
  //     try {
  //       const response = await fetch('https://server-verseex.onrender.com/api/youtube');
  //       if (!response.ok) throw new Error('Failed to fetch missions');
  //       const item: MissionData = await response.json();
  //       setData(item);
  //     } catch (error) {
  //       console.error('Error fetching missions:', error);
  //     }
  //   };
  //   fetchMissions();
  // }, []);

  useEffect(() => {
    if (!data.space_topics || data.space_topics.length === 0) return;
    let i = 0;
    const inter = setInterval(() => {
      setYT(data.space_topics![i % data.space_topics!.length]);
      i++;
    }, 4000);
    return () => {
      clearInterval(inter);
    };
  }, [data]);

  const SHORT_IDS = [
    '95E1iy6m3RI',
    'viRL9A6ofbQ',
    'hqyRrUdli_c',
    'xVzLeCutrEQ',
    'OSbBk9_vMxQ',
    'Xl3nXBUT-Ts',
    'epDmSjaGbNc',
    'Fry4X0IbT7Y',
    'KSNJFfuC1Io',
    '6_xabM3SYS8',
    'DMTPMkdxpHw',
    '-lQ6ZG-sw2U',
    'bYCDkHGmAKg',
    'Pg5TBA9RoM8',
    '-51caHv58kg'
  ];

  return (
    <main className="relative flex h-screen w-full flex-col items-center justify-evenly overflow-hidden bg-[#01030d] bg-[url('/bg.jpg')] bg-cover bg-center bg-no-repeat md:flex-row md:justify-around">
      {/* Sci-Fi Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1a3a15_1px,transparent_1px),linear-gradient(to_bottom,#1f1a3a15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0" />

      {/* Astronaut Container (Position Maintained, Suit/Apparel Upgraded to Elite Gold-Visor Tactical Gear) */}
      <div className="relative z-10 flex h-full w-full min-w-[300px] items-center justify-center p-4 md:w-1/2 md:p-8">
        <div className="relative">
          <div className="absolute inset-0 bg-cyan-500/20 blur-[90px] rounded-full pointer-events-none" />
          <img
            src="astronaut.webp"
            className="h-auto w-full max-w-[280px] rounded-3xl object-cover animate-[verseex-float_8s_ease-in-out_infinite] md:max-w-[460px] filter contrast-125 brightness-90"
            alt="Advanced Tactical Space Suit"
          />
        </div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex w-full min-w-[300px] flex-col items-center p-4 text-white md:w-1/2 md:items-start md:p-8">
        {/* Holographic HUD Tag */}

        <h1 className="text-center text-4xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 drop-shadow-[0_0_20px_rgba(0,242,254,0.4)] md:text-start md:text-[4.5rem]">
          VERSE EX
        </h1>

        <h2 className="my-2 text-center text-xl font-bold tracking-wider text-cyan-100/90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] md:text-start md:text-[2.2rem]">
          EXPLORE THE UNIVERSE
        </h2>

        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-950/30 px-4 py-1 backdrop-blur-md shadow-[0_0_15px_rgba(0,242,254,0.2)]">
          <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
          <span className="text-[11px] font-mono tracking-widest uppercase text-cyan-300">Shorts Videos</span>
        </div>
        {/* YouTube Vidoes */}
        <YouTubeShortsSection shortIds={SHORT_IDS} />
      </div>
    </main>
  );
}