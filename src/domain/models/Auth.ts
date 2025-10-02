export interface AuthLogin {
  name: string;
  password: string;
}

export interface AuthRegister {
  name: string;
  password: string;
  rolId?: number;
}

export interface AuthResult {
  success: boolean;
  token?: string;
  user?: {
    id: number;
    name: string;
    role?: string;
  };
  expiresIn?: number;
  message?: string;
}
