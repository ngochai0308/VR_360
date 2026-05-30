"use client";

interface Props {
  lang: string;
  onChange: (lang: string) => void;
}

export default function LanguageSwitcher({ lang, onChange }: Props) {
  return (
    <div className="fixed top-4 right-4 z-30 flex gap-1 bg-black/50 rounded-full p-1">
      {["vi", "en"].map(l => (
        <button
          key={l}
          onClick={() => onChange(l)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition ${
            lang === l ? "bg-white text-slate-800" : "text-white hover:bg-white/20"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
