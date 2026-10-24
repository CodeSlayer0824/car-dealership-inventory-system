import type { TokenUser } from "../modules/auth/token.js";

declare global {
  namespace Express {
    interface Request {
      user?: TokenUser;
    }
  }
}

export {};
