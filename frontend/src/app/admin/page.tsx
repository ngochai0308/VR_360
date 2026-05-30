import Link from "next/link";
import { fetchAllScenes, type SceneDto } from "@/lib/api";

export default async function AdminPage() {
  let scenes: SceneDto[] = [];
  try {
    scenes = await fetchAllScenes("vi");
  } catch {
    // backend may not be running during build
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-slate-800 text-white px-6 py-4 flex items-center gap-4">
        <h1 className="text-xl font-bold">VR360 Admin</h1>
        <Link href="/" className="ml-auto text-sm text-slate-300 hover:text-white">← Xem Tour</Link>
      </nav>

      <main className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-slate-800">Danh sách Cảnh</h2>
          <Link
            href="/admin/scenes/new"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-lg font-medium transition"
          >
            + Thêm cảnh
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow divide-y">
          {scenes.length === 0 && (
            <div className="p-8 text-center text-slate-400">Chưa có cảnh nào. Thêm cảnh đầu tiên!</div>
          )}
          {scenes.map((scene: { sceneId: string; slugDiTich: string; tieuDe: string; isDefault: boolean; baseUrlCDN: string }) => (
            <div key={scene.sceneId} className="flex items-center gap-4 px-6 py-4">
              <div className="flex-1">
                <p className="font-medium text-slate-800">{scene.tieuDe || scene.slugDiTich}</p>
                <p className="text-sm text-slate-400">{scene.slugDiTich}</p>
              </div>
              {scene.isDefault && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Mặc định</span>
              )}
              <Link
                href={`/admin/scenes/${scene.sceneId}`}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Chỉnh sửa →
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
