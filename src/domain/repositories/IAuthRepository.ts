import { AuthLogin, AuthResult, AuthRegister } from '@domain/models';

export interface IAuthRepository {
  login(data: AuthLogin): Promise<AuthResult>;
  register(data: AuthRegister): Promise<AuthResult>;
  refreshToken(token: string): Promise<AuthResult>;
}
