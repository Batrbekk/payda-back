import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "avtovin-super-secret-key-change-in-prod"
);

export async function signToken(payload: { userId: string; role: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .setIssuedAt()
    .sign(secret);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as { userId: string; role: string };
  } catch {
    return null;
  }
}

export function generateOtp(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
