"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAllScenes, deleteScene, type SceneDto } from "@/lib/api";

export default function AdminPage() {
  const [scenes, setScenes] = useState<SceneDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await fetchAllScenes("vi");
      setScenes(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (scene: SceneDto) => {
    if (!confirm(`Xóa cảnh "${scene.tieuDe || scene.slugDiTich}"?\nHành động này không thể hoàn tác.`)) return;
    setDeleting(scene.sceneId);
    try {
      await deleteScene(scene.sceneId);
      await load();
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-slate-800 text-white px-6 py-4 flex items-center gap-4">
        <h1 className="text-xl font-bold">VR360 Admin</h1>
        <Link href="/" className="ml-auto text-sm text-slate-300 hover:text-white">← Xem Tour</Link>
      </nav>

      <main className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">Danh sách Cảnh</h2>
            {!loading && <p className="text-sm text-slate-400 mt-0.5">{scenes.length} cảnh</p>}
          </div>
          <Link
            href="/admin/scenes/new"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-lg font-medium transition"
          >
            + Thêm cảnh
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow divide-y">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Đang tải...</div>
          ) : scenes.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Chưa có cảnh nào. Thêm cảnh đầu tiên!</div>
          ) : (
            scenes.map(scene => (
              <div key={scene.sceneId} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition group">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-lg shrink-0">
                  🏛
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-800">{scene.tieuDe || scene.slugDiTich}</span>
                    {scene.isDefault && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                        Mặc định
                      </span>
                    )}
                    {scene.hotspots.length > 0 && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                        {scene.hotspots.length} hotspot
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 font-mono">{scene.slugDiTich}</p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`/admin/scenes/${scene.sceneId}`}
                    className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition font-medium"
                  >
                    Chỉnh sửa →
                  </Link>
                  <button
                    onClick={() => handleDelete(scene)}
                    disabled={deleting === scene.sceneId}
                    className="px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition font-medium disabled:opacity-40"
                  >
                    {deleting === scene.sceneId ? "..." : "Xóa"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
