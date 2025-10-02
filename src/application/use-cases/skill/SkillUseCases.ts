import { ISkillRepository } from '../../../domain/repositories/ISkillRepository';
import { Skill } from '../../../domain/models/Skill';
import { AppError } from '../../../shared/errors';

export class ListSkills {
  constructor(private repo: ISkillRepository) {}
  execute(): Promise<Skill[]> {
    return this.repo.findAll();
  }
}

export class CreateSkill {
  constructor(private repo: ISkillRepository) {}
  async execute(input: { description: string; user_id: number }) {
    if (!input.description) {
      throw new AppError('VALIDATION', 'Description requerida');
    }
    return this.repo.create({
      description: input.description,
      user_id: input.user_id,
    } as Skill);
  }
}

export class UpdateSkill {
  constructor(private repo: ISkillRepository) {}
  async execute(id: number, data: { description?: string }) {
    if (!(await this.repo.exists(id))) {
      throw new AppError('NOT_FOUND', 'Skill no encontrado');
    }
    return this.repo.update(id, { description: data.description });
  }
}

export class DeleteSkill {
  constructor(private repo: ISkillRepository) {}
  async execute(id: number) {
    if (!(await this.repo.exists(id))) {
      throw new AppError('NOT_FOUND', 'Skill no encontrado');
    }
    await this.repo.softDelete(id);
  }
}
