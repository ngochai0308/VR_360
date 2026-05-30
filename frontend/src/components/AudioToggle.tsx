"use client";

import { useState } from "react";
import { audioManager } from "@/lib/audioManager";

export default function AudioToggle() {
  const [muted, setMuted] = useState(false);

  const toggle = () => setMuted(audioManager.toggleMute());

  return (
    <button
      onClick={toggle}
      className="fixed bottom-6 right-6 z-30 bg-black/60 hover:bg-black/80 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl transition"
      aria-label={muted ? "Bật âm thanh" : "Tắt âm thanh"}
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}
