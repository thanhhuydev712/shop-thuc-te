// ============================================================
// Embedding — chuyển văn bản thành vector số để tìm kiếm ngữ nghĩa.
// Giải thích đầy đủ: docs/04-BACKEND-HONO-TRPC.md · docs/03-DATABASE-PRISMA.md
//
// - Có OPENAI_API_KEY: dùng OpenAI text-embedding-3-small (384 dims).
// - Không có: dùng embedding cục bộ (đủ cho demo/học, không cần API).
// ============================================================

export const EMBEDDING_DIM = 384;

/** Chuẩn hóa vector về độ dài 1 (cosine similarity). */
function normalize(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

/**
 * Embedding cục bộ — hash từ khóa vào không gian 384 chiều.
 * Không mạnh bằng model thật nhưng chạy offline, phù hợp tutorial.
 */
export function localEmbedding(text: string): number[] {
  const vec = new Array<number>(EMBEDDING_DIM).fill(0);
  const tokens = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/\W+/)
    .filter((t) => t.length > 1);

  for (const token of tokens) {
    let h = 0;
    for (let i = 0; i < token.length; i++) {
      h = (h * 31 + token.charCodeAt(i)) >>> 0;
    }
    const idx = h % EMBEDDING_DIM;
    vec[idx] += 1;
    vec[(idx + 17) % EMBEDDING_DIM] += 0.5;
  }

  return normalize(vec);
}

/** Gọi OpenAI Embeddings API (cần OPENAI_API_KEY trong .env). */
async function openaiEmbedding(text: string): Promise<number[]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Thiếu OPENAI_API_KEY");

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text.slice(0, 8000),
      dimensions: EMBEDDING_DIM,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI embedding lỗi: ${res.status} ${err}`);
  }

  const json = (await res.json()) as { data: { embedding: number[] }[] };
  return normalize(json.data[0].embedding);
}

/** Tạo embedding cho 1 đoạn văn bản (ưu tiên OpenAI nếu có key). */
export async function createEmbedding(text: string): Promise<number[]> {
  if (process.env.OPENAI_API_KEY) {
    try {
      return await openaiEmbedding(text);
    } catch {
      // Fallback nếu API lỗi — app vẫn chạy được.
    }
  }
  return localEmbedding(text);
}

/** Chuyển mảng số thành literal pgvector: '[0.1,0.2,...]' */
export function toVectorLiteral(vec: number[]): string {
  return `[${vec.join(",")}]`;
}
