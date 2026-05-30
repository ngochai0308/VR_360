"use client";

import { useEffect, useRef, useState } from "react";
import { Viewer } from "@photo-sphere-viewer/core";
import { MarkersPlugin, type MarkersPluginConfig } from "@photo-sphere-viewer/markers-plugin";
import "@photo-sphere-viewer/core/index.css";
import "@photo-sphere-viewer/markers-plugin/index.css";
import type { SceneDto, HotspotDto } from "@/lib/api";
import { audioManager } from "@/lib/audioManager";
import HotspotPopup from "./HotspotPopup";

interface Props {
  scene: SceneDto;
  lang: string;
  onNavigate: (sceneId: string) => void;
}

export default function VrViewer({ scene, lang, onNavigate }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [activeHotspot, setActiveHotspot] = useState<HotspotDto | null>(null);

  useEffect(() => {
    if (!containerRef.current || !scene.baseUrlCDN) return;

    const panoramaUrl = `${scene.baseUrlCDN}/panorama_preview.webp`;
    const container = containerRef.current;
    let cancelled = false;

    // Wait 2 animation frames for DOM layout to settle before PSV measures container
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (cancelled || !container) return;

        const viewer = new Viewer({
          container,
          panorama: panoramaUrl,
          plugins: [[MarkersPlugin, {} as MarkersPluginConfig]],
          defaultZoomLvl: 50,
          navbar: false,
        });
        viewerRef.current = viewer;

        const markers = viewer.getPlugin<MarkersPlugin>(MarkersPlugin);

        viewer.addEventListener("ready", () => {
          for (const hs of scene.hotspots) {
            markers.addMarker({
              id: hs.hotspotId,
              position: { yaw: `${hs.yaw}deg`, pitch: `${hs.pitch}deg` },
              html: hs.type === "MoveTo"
                ? `<div class="hotspot-move">▶</div>`
                : `<div class="hotspot-info">ℹ</div>`,
              tooltip: hs.tieuDePopup ?? undefined,
            });
          }

          markers.addEventListener("select-marker", ({ marker }) => {
            const hs = scene.hotspots.find(h => h.hotspotId === marker.id);
            if (!hs) return;
            if (hs.type === "MoveTo" && hs.nextSceneId) {
              onNavigate(hs.nextSceneId);
            } else if (hs.type === "Info") {
              setActiveHotspot(hs);
              if (hs.urlAudio) audioManager.playNarration(hs.urlAudio);
            }
          });

          audioManager.setBackgroundTrack(scene.urlAudio ?? undefined);
        });
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf1);
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene.sceneId, lang]);

  return (
    <div className="fixed inset-0">
      <div ref={containerRef} className="w-full h-full" />
      {activeHotspot && (
        <HotspotPopup
          hotspot={activeHotspot}
          onClose={() => {
            setActiveHotspot(null);
            audioManager.stopNarration();
          }}
        />
      )}
    </div>
  );
}
