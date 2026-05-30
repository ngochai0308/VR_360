"use client";

import type { HotspotDto } from "@/lib/api";

interface Props {
  hotspot: HotspotDto;
  onClose: () => void;
}

export default function HotspotPopup({ hotspot, onClose }: Props) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none"
          aria-label="Đóng"
        >
          ×
        </button>

        {hotspot.tieuDePopup && (
          <h2 className="text-xl font-bold text-slate-800 mb-3">{hotspot.tieuDePopup}</h2>
        )}

        {hotspot.noiDungPopup && (
          <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{hotspot.noiDungPopup}</p>
        )}
      </div>
    </div>
  );
}
