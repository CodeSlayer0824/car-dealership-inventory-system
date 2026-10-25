import { AppError } from "../../errors/AppError.js";
import { AuthRepository } from "./auth.repository.js";
import { hashPassword, verifyPassword } from "./password.js";
import { signToken } from "./token.js";

export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly jwtSecret: string,
  ) {}

  profile(userId: number) {
    const user = this.repository.findById(userId);
    if (!user) throw new AppError(404, "User not found", "USER_NOT_FOUND");
    return user;
  }

  updateProfileName(userId: number, name: string) {
    if (!this.repository.updateName(userId, name)) {
      throw new AppError(404, "User not found", "USER_NOT_FOUND");
    }
    return this.profile(userId);
  }

  async register(input: { name: string; email: string; password: string }) {
    if (this.repository.findByEmail(input.email)) {
      throw new AppError(409, "An account with this email already exists", "EMAIL_EXISTS");
    }
    const passwordHash = await hashPassword(input.password);
    try {
      const id = this.repository.create(input.name, input.email, passwordHash);
      const user = this.repository.findById(id);
      if (!user) throw new Error("New user could not be loaded");
      return { user, token: signToken({ id: user.id, role: user.role }, this.jwtSecret) };
    } catch (error) {
      if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
        throw new AppError(409, "An account with this email already exists", "EMAIL_EXISTS");
      }
      throw error;
    }
  }

  async login(input: { email: string; password: string }) {
    const user = this.repository.findByEmail(input.email);
    if (!user || !(await verifyPassword(input.password, user.password_hash))) {
      throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: signToken({ id: user.id, role: user.role }, this.jwtSecret),
    };
  }
}
