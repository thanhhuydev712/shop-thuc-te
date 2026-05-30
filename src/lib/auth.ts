import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

// ============================================================
// AUTH & SECURITY — Xác thực người dùng.
//
// 2 việc chính:
// 1) Băm mật khẩu bằng bcrypt (KHÔNG bao giờ lưu mật khẩu thô).
// 2) Tạo & kiểm tra JWT (JSON Web Token) — "vé" chứng minh đã đăng nhập.
//    JWT được ký bằng JWT_SECRET; ai sửa nội dung token sẽ làm chữ ký sai.
// ============================================================

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "khoa-bi-mat-mac-dinh-doi-trong-thuc-te",
);

const ALG = "HS256"; // Thuật toán ký đối xứng (dùng chung 1 khóa bí mật)

// ---- Mật khẩu ----

/** Băm mật khẩu trước khi lưu vào DB. */
export async function hashPassword(plain: string): Promise<string> {
  // "10" là số vòng băm (salt rounds) — càng cao càng an toàn nhưng càng chậm.
  return bcrypt.hash(plain, 10);
}

/** So sánh mật khẩu người dùng nhập với bản băm trong DB. */
export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ---- JWT ----

export interface JwtPayload {
  userId: string;
  email: string;
  role: "USER" | "ADMIN";
}

/** Tạo token đăng nhập, hết hạn sau 7 ngày. */
export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

/** Kiểm tra token. Hợp lệ -> trả về payload; sai/hết hạn -> trả về null. */
export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as "USER" | "ADMIN",
    };
  } catch {
    return null;
  }
}
