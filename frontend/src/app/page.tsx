"use client";

import { useState } from "react";
import { audioManager } from "@/lib/audioManager";
import TourApp from "@/components/TourApp";

export default function Home() {
  const [started, setStarted] = useState(false);
  const [lang, setLang] = useState("vi");

  const handleStart = () => {
    audioManager.unlock();
    setStarted(true);
  };

  if (started) {
    return <TourApp lang={lang} onLangChange={setLang} />;
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-linear-to-b from-slate-900 via-slate-800 to-slate-900" />

      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
          VR360 <span className="text-amber-400">Di Tích</span>
        </h1>
        <p className="text-slate-300 text-lg max-w-md">
          {lang === "vi"
            ? "Khám phá di sản văn hóa Việt Nam qua trải nghiệm thực tế ảo toàn cảnh 360°"
            : "Explore Vietnamese cultural heritage through immersive 360° virtual reality"}
        </p>

        <button
          onClick={handleStart}
          className="mt-4 px-10 py-4 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-lg rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg"
        >
          {lang === "vi" ? "Khám phá ngay" : "Explore Now"}
        </button>

        {/* Language switcher on splash */}
        <div className="flex gap-2 bg-white/10 rounded-full p-1">
          {["vi", "en"].map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                lang === l ? "bg-white text-slate-800" : "text-white hover:bg-white/20"
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
