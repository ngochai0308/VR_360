"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Viewer } from "@photo-sphere-viewer/core";
import { MarkersPlugin, type MarkersPluginConfig } from "@photo-sphere-viewer/markers-plugin";
import "@photo-sphere-viewer/core/index.css";
import "@photo-sphere-viewer/markers-plugin/index.css";
import { fetchScene, fetchAllScenes, updateScene, type SceneDto, type HotspotDto } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL;
const toDeg = (r: number) => (r * 180) / Math.PI;

export default function SceneDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [scene, setScene] = useState<SceneDto | null>(null);
  const [sceneEn, setSceneEn] = useState<SceneDto | null>(null);
  const [allScenes, setAllScenes] = useState<SceneDto[]>([]);

  // Edit info
  const [editNameVi, setEditNameVi] = useState("");
  const [editNameEn, setEditNameEn] = useState("");
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoMsg, setInfoMsg] = useState("");

  // Panorama upload
  const [panoramaFile, setPanoramaFile] = useState<File | null>(null);
  const [panoramaStatus, setPanoramaStatus] = useState("");

  // Audio upload
  const [audioViFile, setAudioViFile] = useState<File | null>(null);
  const [audioEnFile, setAudioEnFile] = useState<File | null>(null);
  const [audioViStatus, setAudioViStatus] = useState("");
  const [audioEnStatus, setAudioEnStatus] = useState("");

  // Hotspot editor
  const [pendingHotspot, setPendingHotspot] = useState<{ yaw: number; pitch: number } | null>(null);
  const [hsType, setHsType] = useState<"MoveTo" | "Info">("Info");
  const [nextSceneId, setNextSceneId] = useState("");
  const [tieuDeVi, setTieuDeVi] = useState("");
  const [tieuDeEn, setTieuDeEn] = useState("");
  const [contentVi, setContentVi] = useState("");
  const [contentEn, setContentEn] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);

  const reload = useCallback(async () => {
    const [vi, en, all] = await Promise.all([
      fetchScene(id, "vi"),
      fetchScene(id, "en"),
      fetchAllScenes("vi"),
    ]);
    setScene(vi);
    setSceneEn(en);
    setAllScenes(all.filter(a => a.sceneId !== id));
    setEditNameVi(vi.tieuDe);
    setEditNameEn(en.tieuDe);
  }, [id]);

  useEffect(() => { reload(); }, [reload]);

  // PSV viewer
  useEffect(() => {
    if (!scene?.baseUrlCDN || !containerRef.current) return;
    const container = containerRef.current;

    const viewer = new Viewer({
      container,
      panorama: `${scene.baseUrlCDN}/panorama_preview.webp`,
      plugins: [[MarkersPlugin, {} as MarkersPluginConfig]],
      navbar: false,
      defaultZoomLvl: 50,
    });
    viewerRef.current = viewer;
    const markers = viewer.getPlugin<MarkersPlugin>(MarkersPlugin);

    viewer.addEventListener("ready", () => {
      scene.hotspots.forEach(h => {
        markers.addMarker({
          id: h.hotspotId,
          position: { yaw: `${h.yaw}deg`, pitch: `${h.pitch}deg` },
          html: `<div class="hotspot-${h.type === "MoveTo" ? "move" : "info"}">${h.type === "MoveTo" ? "▶" : "ℹ"}</div>`,
          tooltip: h.tieuDePopup ?? undefined,
        });
      });
    });

    // Fix: PSV returns radians, convert to degrees before storing
    viewer.addEventListener("dblclick", (e) => {
      setPendingHotspot({ yaw: toDeg(e.data.yaw), pitch: toDeg(e.data.pitch) });
    });

    return () => {
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
  }, [scene?.sceneId, scene?.baseUrlCDN, scene?.hotspots.length]);

  const saveInfo = async () => {
    setSavingInfo(true);
    setInfoMsg("");
    try {
      await updateScene(id, {
        translations: [
          { languageCode: "vi", tieuDe: editNameVi },
          { languageCode: "en", tieuDe: editNameEn },
        ],
      });
      setInfoMsg("Đã lưu!");
      await reload();
    } catch {
      setInfoMsg("Lỗi khi lưu.");
    } finally {
      setSavingInfo(false);
      setTimeout(() => setInfoMsg(""), 2000);
    }
  };

  const setDefault = async () => {
    await fetch(`${API}/api/scenes/${id}/set-default`, { method: "PATCH" });
    reload();
  };

  const uploadPanorama = async () => {
    if (!panoramaFile) return;
    setPanoramaStatus("Đang xử lý...");
    const fd = new FormData();
    fd.append("file", panoramaFile);
    const res = await fetch(`${API}/api/upload/panorama/${id}`, { method: "POST", body: fd });
    const json = await res.json();
    setPanoramaStatus(json.message || "Xong");
    setPanoramaFile(null);
  };

  const uploadAudio = async (lang: "vi" | "en") => {
    const file = lang === "vi" ? audioViFile : audioEnFile;
    const setStatus = lang === "vi" ? setAudioViStatus : setAudioEnStatus;
    if (!file) return;
    setStatus("Đang tải lên...");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API}/api/upload/audio/${id}?lang=${lang}`, { method: "POST", body: fd });
    if (res.ok) {
      setStatus("Tải lên thành công!");
      if (lang === "vi") setAudioViFile(null);
      else setAudioEnFile(null);
      reload();
    } else {
      setStatus("Lỗi tải lên.");
    }
    setTimeout(() => setStatus(""), 3000);
  };

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
    await fetch(`${API}/api/hotspots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setPendingHotspot(null);
    setTieuDeVi(""); setTieuDeEn(""); setContentVi(""); setContentEn(""); setNextSceneId("");
    reload();
  };

  const deleteHotspot = async (hotspotId: string) => {
    if (!confirm("Xóa hotspot này?")) return;
    await fetch(`${API}/api/hotspots/${hotspotId}`, { method: "DELETE" });
    reload();
  };

  if (!scene) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Đang tải...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-slate-800 text-white px-6 py-4 flex items-center gap-3">
        <a href="/admin" className="text-slate-300 hover:text-white text-sm">← Danh sách</a>
        <span className="text-slate-600">/</span>
        <span className="font-semibold">{scene.tieuDe || scene.slugDiTich}</span>
        <div className="ml-auto flex items-center gap-2">
          {scene.isDefault ? (
            <span className="text-xs bg-amber-400 text-slate-900 px-3 py-1 rounded-full font-medium">Mặc định</span>
          ) : (
            <button
              onClick={setDefault}
              className="text-xs bg-slate-600 hover:bg-amber-400 hover:text-slate-900 text-white px-3 py-1 rounded-full transition"
            >
              Đặt làm mặc định
            </button>
          )}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6 flex flex-col gap-5">

        {/* Thông tin cảnh */}
        <section className="bg-white rounded-xl shadow p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Thông tin cảnh</h2>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Tên (Tiếng Việt)</span>
              <input
                value={editNameVi}
                onChange={e => setEditNameVi(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Name (English)</span>
              <input
                value={editNameEn}
                onChange={e => setEditNameEn(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </label>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-xs text-slate-400 font-mono">slug: {scene.slugDiTich}</span>
            <div className="ml-auto flex items-center gap-3">
              {infoMsg && <span className="text-sm text-green-600">{infoMsg}</span>}
              <button
                onClick={saveInfo}
                disabled={savingInfo}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition"
              >
                {savingInfo ? "Đang lưu..." : "Lưu tên"}
              </button>
            </div>
          </div>
        </section>

        {/* Panorama & Audio */}
        <section className="bg-white rounded-xl shadow p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Ảnh & Âm thanh</h2>

          {/* Panorama */}
          <div className="mb-5">
            <p className="text-sm font-medium text-slate-600 mb-2">Ảnh Panorama 360° (tỉ lệ 2:1)</p>
            <div className="flex gap-3 items-center">
              <input
                type="file"
                accept="image/*"
                onChange={e => setPanoramaFile(e.target.files?.[0] ?? null)}
                className="text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
              />
              <button
                onClick={uploadPanorama}
                disabled={!panoramaFile}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition shrink-0"
              >
                Upload & Xử lý
              </button>
              {panoramaStatus && <span className="text-sm text-slate-500">{panoramaStatus}</span>}
            </div>
            {scene.baseUrlCDN && (
              <p className="mt-1.5 text-xs text-slate-400">
                Hiện tại: <span className="font-mono">{scene.baseUrlCDN}/panorama_preview.webp</span>
              </p>
            )}
          </div>

          <div className="border-t pt-4 grid grid-cols-2 gap-6">
            {/* Audio VI */}
            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">Âm thanh nền (Tiếng Việt)</p>
              {scene.urlAudio && (
                <audio controls src={scene.urlAudio} className="w-full mb-2 h-8" />
              )}
              <div className="flex gap-2 items-center">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={e => setAudioViFile(e.target.files?.[0] ?? null)}
                  className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 min-w-0"
                />
                <button
                  onClick={() => uploadAudio("vi")}
                  disabled={!audioViFile}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white rounded text-xs shrink-0"
                >
                  Upload
                </button>
              </div>
              {audioViStatus && <p className="text-xs text-slate-500 mt-1">{audioViStatus}</p>}
            </div>

            {/* Audio EN */}
            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">Background audio (English)</p>
              {sceneEn?.urlAudio && (
                <audio controls src={sceneEn.urlAudio} className="w-full mb-2 h-8" />
              )}
              <div className="flex gap-2 items-center">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={e => setAudioEnFile(e.target.files?.[0] ?? null)}
                  className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 min-w-0"
                />
                <button
                  onClick={() => uploadAudio("en")}
                  disabled={!audioEnFile}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white rounded text-xs shrink-0"
                >
                  Upload
                </button>
              </div>
              {audioEnStatus && <p className="text-xs text-slate-500 mt-1">{audioEnStatus}</p>}
            </div>
          </div>
        </section>

        {/* Visual Hotspot Editor */}
        <section className="bg-white rounded-xl shadow p-5">
          <h2 className="font-semibold text-slate-800 mb-1">Visual Hotspot Editor</h2>
          <p className="text-xs text-slate-400 mb-3">
            Double-click vào ảnh 360° để đặt hotspot mới
          </p>

          <div ref={containerRef} className="w-full h-72 rounded-lg overflow-hidden bg-slate-200" />

          {pendingHotspot && (
            <div className="mt-4 border rounded-lg p-4 bg-slate-50 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
                  Yaw: {pendingHotspot.yaw.toFixed(1)}° / Pitch: {pendingHotspot.pitch.toFixed(1)}°
                </span>
                <select
                  value={hsType}
                  onChange={e => setHsType(e.target.value as "MoveTo" | "Info")}
                  className="border rounded px-2 py-1.5 text-sm"
                >
                  <option value="Info">Info (popup thông tin)</option>
                  <option value="MoveTo">MoveTo (chuyển cảnh)</option>
                </select>
              </div>

              {hsType === "MoveTo" ? (
                <select
                  value={nextSceneId}
                  onChange={e => setNextSceneId(e.target.value)}
                  className="border rounded px-2 py-1.5 text-sm"
                >
                  <option value="">-- Chọn cảnh đích --</option>
                  {allScenes.map(s => (
                    <option key={s.sceneId} value={s.sceneId}>{s.tieuDe || s.slugDiTich}</option>
                  ))}
                </select>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder="Tiêu đề (VI)"
                    value={tieuDeVi}
                    onChange={e => setTieuDeVi(e.target.value)}
                    className="border rounded px-2 py-1.5 text-sm"
                  />
                  <input
                    placeholder="Title (EN)"
                    value={tieuDeEn}
                    onChange={e => setTieuDeEn(e.target.value)}
                    className="border rounded px-2 py-1.5 text-sm"
                  />
                  <textarea
                    placeholder="Nội dung (VI)"
                    value={contentVi}
                    onChange={e => setContentVi(e.target.value)}
                    rows={2}
                    className="border rounded px-2 py-1.5 text-sm"
                  />
                  <textarea
                    placeholder="Content (EN)"
                    value={contentEn}
                    onChange={e => setContentEn(e.target.value)}
                    rows={2}
                    className="border rounded px-2 py-1.5 text-sm"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={saveHotspot}
                  disabled={hsType === "MoveTo" && !nextSceneId}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium"
                >
                  Lưu hotspot
                </button>
                <button
                  onClick={() => setPendingHotspot(null)}
                  className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-sm"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Hotspot list */}
        <section className="bg-white rounded-xl shadow p-5">
          <h2 className="font-semibold text-slate-800 mb-3">
            Hotspots
            <span className="ml-2 text-sm font-normal text-slate-400">({scene.hotspots.length})</span>
          </h2>

          {scene.hotspots.length === 0 ? (
            <p className="text-sm text-slate-400 py-2">Chưa có hotspot nào. Double-click vào ảnh để thêm.</p>
          ) : (
            <div className="divide-y">
              {scene.hotspots.map((h: HotspotDto) => (
                <div key={h.hotspotId} className="py-3 flex items-center gap-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                    h.type === "MoveTo" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {h.type}
                  </span>
                  <span className="font-mono text-xs text-slate-400 shrink-0">
                    {h.yaw.toFixed(1)}° / {h.pitch.toFixed(1)}°
                  </span>
                  <span className="flex-1 text-sm text-slate-600 truncate">
                    {h.type === "MoveTo"
                      ? `→ ${allScenes.find(s => s.sceneId === h.nextSceneId?.toString())?.tieuDe ?? h.nextSceneId ?? "—"}`
                      : (h.tieuDePopup || "—")}
                  </span>
                  <button
                    onClick={() => deleteHotspot(h.hotspotId)}
                    className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition shrink-0"
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
