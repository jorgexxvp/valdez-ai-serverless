import { IRoleRepository } from '../../../domain/repositories/IRoleRepository';
import { Role } from '../../../domain/models/Role';
import { AppError } from '../../../shared/errors';

export class ListRoles {
  constructor(private repo: IRoleRepository) {}
  execute() {
    return this.repo.findAll();
  }
}

export class CreateRole {
  constructor(private repo: IRoleRepository) {}
  async execute(input: { name: string; user_id: number }) {
    if (!input.name) throw new AppError('VALIDATION', 'Nombre requerido');
    return this.repo.create({
      name: input.name,
      user_id: input.user_id,
    } as Role);
  }
}

export class UpdateRole {
  constructor(private repo: IRoleRepository) {}
  async execute(id: number, data: { name?: string }) {
    if (!(await this.repo.exists(id)))
      throw new AppError('NOT_FOUND', 'Rol no encontrado');
    return this.repo.update(id, data);
  }
}

export class DeleteRole {
  constructor(private repo: IRoleRepository) {}
  async execute(id: number) {
    if (!(await this.repo.exists(id)))
      throw new AppError('NOT_FOUND', 'Rol no encontrado');
    await this.repo.softDelete(id);
  }
}
