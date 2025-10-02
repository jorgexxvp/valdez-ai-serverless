import { AuthLogin, AuthResult, AuthRegister } from '@domain/models';
import { IAuthRepository } from '@domain/repositories';

export class AuthUseCases {
  constructor(private authRepository: IAuthRepository) {}

  async login(data: AuthLogin): Promise<AuthResult> {
    return this.authRepository.login(data);
  }

  async register(data: AuthRegister): Promise<AuthResult> {
    return this.authRepository.register(data);
  }

  async refreshToken(token: string): Promise<AuthResult> {
    return this.authRepository.refreshToken(token);
  }
}
