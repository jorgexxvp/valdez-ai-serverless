import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { User } from '../../../domain/models/User';
import { AppError } from '../../../shared/errors';

export class ListUsers {
  constructor(private repo: IUserRepository) {}
  execute(): Promise<User[]> {
    return this.repo.findAll();
  }
}

export class GetUserById {
  constructor(private repo: IUserRepository) {}
  async execute(id: number): Promise<User> {
    const u = await this.repo.findById(id);
    if (!u) throw new AppError('NOT_FOUND', 'User not found');
    return u;
  }
}

export class CreateUserUseCase {
  constructor(private repo: IUserRepository) {}
  async execute(data: Omit<User, 'id'> & { accountId: number }): Promise<User> {
    if (!data.name) throw new AppError('VALIDATION', 'name required');
    if (!data.email) throw new AppError('VALIDATION', 'email required');
    return this.repo.create(data);
  }
}

export class UpdateUserUseCase {
  constructor(private repo: IUserRepository) {}
  async execute(id: number, patch: Partial<Omit<User, 'id'>>): Promise<User> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new AppError('NOT_FOUND', 'User not found');
    if (!Object.keys(patch).length) {
      throw new AppError('VALIDATION', 'Nothing to update');
    }
    return this.repo.update(id, patch);
  }
}

export class DeleteUserUseCase {
  constructor(private repo: IUserRepository) {}
  async execute(id: number): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new AppError('NOT_FOUND', 'User not found');
    await this.repo.softDelete(id);
  }
}
