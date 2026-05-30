"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchDefaultScene, fetchScene, type SceneDto } from "@/lib/api";
import VrViewer from "./VrViewer";
import LanguageSwitcher from "./LanguageSwitcher";
import AudioToggle from "./AudioToggle";

interface Props {
  lang: string;
  onLangChange: (lang: string) => void;
}

export default function TourApp({ lang, onLangChange }: Props) {
  const [scene, setScene] = useState<SceneDto | null>(null);
  const [error, setError] = useState(false);

  const loadScene = useCallback(async (id?: string) => {
    try {
      const data = id ? await fetchScene(id, lang) : await fetchDefaultScene(lang);
      setScene(data);
    } catch {
      setError(true);
    }
  }, [lang]);

  useEffect(() => {
    // When language changes, reload current scene in new lang
    if (scene) {
      loadScene(scene.sceneId);
    } else {
      loadScene();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    if (!scene) loadScene();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <p>Không thể tải dữ liệu. Vui lòng thử lại.</p>
      </div>
    );
  }

  if (!scene) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden relative">
      <VrViewer
        scene={scene}
        lang={lang}
        onNavigate={(id) => loadScene(id)}
      />
      <LanguageSwitcher lang={lang} onChange={onLangChange} />
      <AudioToggle />
    </div>
  );
}
