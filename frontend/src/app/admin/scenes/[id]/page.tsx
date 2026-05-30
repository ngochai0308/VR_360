"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Viewer } from "@photo-sphere-viewer/core";
import { MarkersPlugin, type MarkersPluginConfig } from "@photo-sphere-viewer/markers-plugin";
import "@photo-sphere-viewer/core/index.css";
import "@photo-sphere-viewer/markers-plugin/index.css";
import { fetchScene, fetchAllScenes, type SceneDto, type HotspotDto } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function SceneDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [scene, setScene] = useState<SceneDto | null>(null);
  const [allScenes, setAllScenes] = useState<SceneDto[]>([]);
  const [pendingHotspot, setPendingHotspot] = useState<{ yaw: number; pitch: number } | null>(null);
  const [hsType, setHsType] = useState<"MoveTo" | "Info">("Info");
  const [nextSceneId, setNextSceneId] = useState("");
  const [tieuDeVi, setTieuDeVi] = useState("");
  const [tieuDeEn, setTieuDeEn] = useState("");
  const [contentVi, setContentVi] = useState("");
  const [contentEn, setContentEn] = useState("");
  const [panoramaFile, setPanoramaFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);

  const reload = useCallback(async () => {
    const [s, all] = await Promise.all([fetchScene(id, "vi"), fetchAllScenes("vi")]);
    setScene(s);
    setAllScenes(all.filter(a => a.sceneId !== id));
  }, [id]);

  useEffect(() => { reload(); }, [reload]);

  // Mini viewer for hotspot editor
  useEffect(() => {
    if (!scene?.baseUrlCDN || !containerRef.current) return;
    const viewer = new Viewer({
      container: containerRef.current,
      panorama: `${scene.baseUrlCDN}/panorama_preview.webp`,
      plugins: [[MarkersPlugin, {} as MarkersPluginConfig]],
      navbar: false,
    });
    viewerRef.current = viewer;
    const markers = viewer.getPlugin<MarkersPlugin>(MarkersPlugin);

    // Existing hotspots
    scene.hotspots.forEach(h => {
      markers.addMarker({
        id: h.hotspotId,
        position: { yaw: `${h.yaw}deg`, pitch: `${h.pitch}deg` },
        html: `<div class="hotspot-${h.type === "MoveTo" ? "move" : "info"}">${h.type === "MoveTo" ? "▶" : "ℹ"}</div>`,
      });
    });

    // Double-click to place new hotspot
    viewer.addEventListener("dblclick", (e) => {
      setPendingHotspot({ yaw: e.data.yaw, pitch: e.data.pitch });
    });

    return () => {
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
  }, [scene?.sceneId, scene?.baseUrlCDN]);

  const saveHotspot = async () => {
    if (!pendingHotspot) return;
    const body = {
      sceneId: id,
      type: hsType,
      yaw: pendingHotspot.yaw,
      pitch: pendingHotspot.pitch,
      nextSceneId: hsType === "MoveTo" ? nextSceneId : null,
      translations: [
        { languageCode: "vi", tieuDePopup: tieuDeVi, noiDungPopup: contentVi, urlAudio: null },
        { languageCode: "en", tieuDePopup: tieuDeEn, noiDungPopup: contentEn, urlAudio: null },
      ],
    };
    await fetch(`${API}/api/hotspots`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setPendingHotspot(null);
    setTieuDeVi(""); setTieuDeEn(""); setContentVi(""); setContentEn("");
    reload();
  };

  const deleteHotspot = async (hotspotId: string) => {
    await fetch(`${API}/api/hotspots/${hotspotId}`, { method: "DELETE" });
    reload();
  };

  const setDefault = async () => {
    await fetch(`${API}/api/scenes/${id}/set-default`, { method: "PATCH" });
    reload();
  };

  const uploadPanorama = async () => {
    if (!panoramaFile) return;
    setUploadStatus("Đang tải lên...");
    const fd = new FormData();
    fd.append("file", panoramaFile);
    const res = await fetch(`${API}/api/upload/panorama/${id}`, { method: "POST", body: fd });
    const json = await res.json();
    setUploadStatus(json.message || "Xong");
  };

  if (!scene) return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-slate-800 text-white px-6 py-4 flex items-center gap-4">
        <a href="/admin" className="text-slate-300 hover:text-white">← Danh sách</a>
        <h1 className="font-bold">{scene.tieuDe || scene.slugDiTich}</h1>
        {scene.isDefault
          ? <span className="ml-auto text-xs bg-amber-400 text-slate-900 px-3 py-1 rounded-full font-medium">Mặc định</span>
          : <button onClick={setDefault} className="ml-auto text-xs bg-slate-600 hover:bg-amber-400 hover:text-slate-900 text-white px-3 py-1 rounded-full transition">Đặt làm mặc định</button>
        }
      </nav>

      <main className="max-w-5xl mx-auto p-6 flex flex-col gap-6">
        {/* Panorama Upload */}
        <section className="bg-white rounded-xl shadow p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Upload ảnh Panorama 2:1</h2>
          <div className="flex gap-3 items-center">
            <input type="file" accept="image/*" onChange={e => setPanoramaFile(e.target.files?.[0] ?? null)} className="text-sm" />
            <button onClick={uploadPanorama} disabled={!panoramaFile} className="px-4 py-1.5 bg-amber-500 text-white rounded-lg text-sm disabled:opacity-40">
              Xử lý & Upload
            </button>
            {uploadStatus && <span className="text-sm text-slate-500">{uploadStatus}</span>}
          </div>
        </section>

        {/* Visual Hotspot Editor */}
        <section className="bg-white rounded-xl shadow p-5">
          <h2 className="font-semibold text-slate-800 mb-1">Visual Hotspot Editor</h2>
          <p className="text-xs text-slate-400 mb-3">Double-click vào cảnh để đặt hotspot mới</p>

          <div ref={containerRef} className="w-full h-64 rounded-lg overflow-hidden bg-slate-200" />

          {pendingHotspot && (
            <div className="mt-4 border rounded-lg p-4 bg-slate-50 flex flex-col gap-3">
              <p className="text-sm font-medium">Yaw: {pendingHotspot.yaw.toFixed(2)}° / Pitch: {pendingHotspot.pitch.toFixed(2)}°</p>

              <select value={hsType} onChange={e => setHsType(e.target.value as "MoveTo" | "Info")}
                className="border rounded px-2 py-1.5 text-sm">
                <option value="Info">Info (popup)</option>
                <option value="MoveTo">MoveTo (chuyển cảnh)</option>
              </select>

              {hsType === "MoveTo" ? (
                <select value={nextSceneId} onChange={e => setNextSceneId(e.target.value)} className="border rounded px-2 py-1.5 text-sm">
                  <option value="">-- Chọn cảnh đích --</option>
                  {allScenes.map(s => <option key={s.sceneId} value={s.sceneId}>{s.tieuDe || s.slugDiTich}</option>)}
                </select>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Tiêu đề (VI)" value={tieuDeVi} onChange={e => setTieuDeVi(e.target.value)} className="border rounded px-2 py-1.5 text-sm" />
                  <input placeholder="Title (EN)" value={tieuDeEn} onChange={e => setTieuDeEn(e.target.value)} className="border rounded px-2 py-1.5 text-sm" />
                  <textarea placeholder="Nội dung (VI)" value={contentVi} onChange={e => setContentVi(e.target.value)} rows={2} className="border rounded px-2 py-1.5 text-sm" />
                  <textarea placeholder="Content (EN)" value={contentEn} onChange={e => setContentEn(e.target.value)} rows={2} className="border rounded px-2 py-1.5 text-sm" />
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={saveHotspot} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm">Lưu hotspot</button>
                <button onClick={() => setPendingHotspot(null)} className="px-4 py-1.5 bg-slate-200 rounded-lg text-sm">Hủy</button>
              </div>
            </div>
          )}
        </section>

        {/* Hotspot list */}
        <section className="bg-white rounded-xl shadow p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Hotspots ({scene.hotspots.length})</h2>
          {scene.hotspots.length === 0
            ? <p className="text-sm text-slate-400">Chưa có hotspot</p>
            : (
              <div className="divide-y">
                {scene.hotspots.map((h: HotspotDto) => (
                  <div key={h.hotspotId} className="py-2 flex items-center gap-4 text-sm">
                    <span className="font-mono text-xs text-slate-400">{h.yaw.toFixed(1)}° / {h.pitch.toFixed(1)}°</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${h.type === "MoveTo" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>{h.type}</span>
                    <span className="flex-1 text-slate-600">{h.tieuDePopup ?? "—"}</span>
                    <button onClick={() => deleteHotspot(h.hotspotId)} className="text-red-500 hover:text-red-700 text-xs">Xóa</button>
                  </div>
                ))}
              </div>
            )}
        </section>
      </main>
    </div>
  );
}
