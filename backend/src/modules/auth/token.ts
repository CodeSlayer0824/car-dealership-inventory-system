import jwt from "jsonwebtoken";

export interface TokenUser {
  id: number;
  role: string;
}

export function signToken(
  user: TokenUser,
  secret: string,
  expiresIn: jwt.SignOptions["expiresIn"] = "1h",
): string {
  return jwt.sign({ role: user.role }, secret, {
    subject: String(user.id),
    expiresIn,
  });
}

export function verifyToken(token: string, secret: string): TokenUser {
  const payload = jwt.verify(token, secret);
  if (typeof payload === "string" || !payload.sub || typeof payload.role !== "string") {
    throw new jwt.JsonWebTokenError("Invalid token payload");
  }
  const id = Number(payload.sub);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new jwt.JsonWebTokenError("Invalid token subject");
  }
  return { id, role: payload.role };
}
