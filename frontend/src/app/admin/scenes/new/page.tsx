"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function NewScenePage() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [tieuDeVi, setTieuDeVi] = useState("");
  const [tieuDeEn, setTieuDeEn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API}/api/scenes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slugDiTich: slug,
          isDefault,
          translations: [
            { languageCode: "vi", tieuDe: tieuDeVi },
            { languageCode: "en", tieuDe: tieuDeEn },
          ],
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      router.push(`/admin/scenes/${data.sceneId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-slate-800 text-white px-6 py-4 flex items-center gap-4">
        <h1 className="text-xl font-bold">VR360 Admin</h1>
        <span className="text-slate-400">/ Thêm cảnh mới</span>
      </nav>

      <main className="max-w-2xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 flex flex-col gap-5">
          <h2 className="text-xl font-semibold text-slate-800">Thông tin cảnh</h2>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-600">Slug (đường dẫn SEO)</span>
            <input
              value={slug}
              onChange={e => setSlug(e.target.value)}
              placeholder="chua-mot-cot"
              required
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-600">Tên cảnh (Tiếng Việt)</span>
            <input
              value={tieuDeVi}
              onChange={e => setTieuDeVi(e.target.value)}
              required
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-600">Scene name (English)</span>
            <input
              value={tieuDeEn}
              onChange={e => setTieuDeEn(e.target.value)}
              required
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={e => setIsDefault(e.target.checked)}
              className="w-4 h-4 accent-amber-500"
            />
            <span className="text-sm text-slate-600">Đặt làm cảnh mặc định (điểm xuất phát)</span>
          </label>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white rounded-lg font-medium transition"
          >
            {loading ? "Đang tạo..." : "Tạo cảnh"}
          </button>
        </form>
      </main>
    </div>
  );
}
