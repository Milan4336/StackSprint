import { UserRepository } from '../repositories/UserRepository';
import { AppError } from '../utils/errors';
import { comparePassword, hashPassword } from '../utils/password';
import { signJwt } from '../utils/jwt';
import { AuditService } from './AuditService';

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly auditService: AuditService
  ) {}

  async register(email: string, password: string, role: 'admin' | 'analyst') {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new AppError('User already exists', 409);
    }
    const user = await this.userRepository.upsert(email, hashPassword(password), role);
    await this.auditService.log({
      eventType: 'AUTH_REGISTER',
      action: 'register',
      entityType: 'user',
      entityId: String(user._id),
      actor: {
        actorId: String(user._id),
        actorEmail: user.email
      },
      metadata: {
        role: user.role
      }
    });
    return { token: signJwt({ sub: String(user._id), email: user.email, role: user.role }) };
  }

  async login(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !comparePassword(password, user.password)) {
      throw new AppError('Invalid credentials', 401);
    }
    await this.auditService.log({
      eventType: 'AUTH_LOGIN',
      action: 'login',
      entityType: 'user',
      entityId: String(user._id),
      actor: {
        actorId: String(user._id),
        actorEmail: user.email
      },
      metadata: {
        role: user.role
      }
    });
    return { token: signJwt({ sub: String(user._id), email: user.email, role: user.role }) };
  }
}
