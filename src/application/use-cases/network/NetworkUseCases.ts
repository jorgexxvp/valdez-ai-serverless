import { INetworkRepository } from '../../../domain/repositories/INetworkRepository';
import { Network } from '../../../domain/models/Network';
import { AppError } from '../../../shared/errors';

export class ListNetworks {
  constructor(private repo: INetworkRepository) {}
  execute() {
    return this.repo.findAll();
  }
}

export class CreateNetwork {
  constructor(private repo: INetworkRepository) {}
  async execute(input: { name: string; url: string; user_id: number }) {
    if (!input.name || !input.url)
      throw new AppError('VALIDATION', 'Faltan campos');
    return this.repo.create({
      name: input.name,
      url: input.url,
      user_id: input.user_id,
    } as Network);
  }
}

export class UpdateNetwork {
  constructor(private repo: INetworkRepository) {}
  async execute(id: number, data: { name?: string; url?: string }) {
    if (!(await this.repo.exists(id)))
      throw new AppError('NOT_FOUND', 'Red no encontrada');
    return this.repo.update(id, data);
  }
}

export class DeleteNetwork {
  constructor(private repo: INetworkRepository) {}
  async execute(id: number) {
    if (!(await this.repo.exists(id)))
      throw new AppError('NOT_FOUND', 'Red no encontrada');
    await this.repo.softDelete(id);
  }
}
