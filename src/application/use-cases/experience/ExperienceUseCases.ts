import { IExperienceRepository } from '../../../domain/repositories/IExperienceRepository';
import { Experience } from '../../../domain/models/Experience';
import { AppError } from '../../../shared/errors';

export class ListExperiences {
  constructor(private repo: IExperienceRepository) {}
  execute() {
    return this.repo.findAll();
  }
}

export class CreateExperience {
  constructor(private repo: IExperienceRepository) {}
  async execute(input: {
    experience: string;
    description: string;
    subdescription: string;
    period: string;
    functions: string[];
    user_id: number;
  }) {
    if (!input.description || !input.experience)
      throw new AppError('VALIDATION', 'Faltan campos');
    return this.repo.create({
      experience: input.experience,
      description: input.description,
      subdescription: input.subdescription,
      period: input.period,
      user_id: input.user_id,
      functions: input.functions,
    });
  }
}

export class UpdateExperience {
  constructor(private repo: IExperienceRepository) {}
  async execute(
    id: number,
    data: {
      experience?: string;
      description?: string;
      subdescription?: string;
      period?: string;
      functions?: string[];
    },
  ) {
    if (!(await this.repo.exists(id)))
      throw new AppError('NOT_FOUND', 'Experiencia no encontrada');
    return this.repo.update(id, data);
  }
}

export class DeleteExperience {
  constructor(private repo: IExperienceRepository) {}
  async execute(id: number) {
    if (!(await this.repo.exists(id)))
      throw new AppError('NOT_FOUND', 'Experiencia no encontrada');
    await this.repo.softDelete(id);
  }
}
