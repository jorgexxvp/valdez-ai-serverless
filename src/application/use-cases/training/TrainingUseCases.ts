import { ITrainingRepository } from '../../../domain/repositories/ITrainingRepository';
import { Training } from '../../../domain/models/Training';
import { AppError } from '../../../shared/errors';

export class ListTrainings {
  constructor(private repo: ITrainingRepository) {}
  execute() {
    return this.repo.findAll();
  }
}

export class CreateTraining {
  constructor(private repo: ITrainingRepository) {}
  async execute(input: {
    title: string;
    description: string;
    subdescription: string;
    user_id: number;
  }) {
    if (!input.title || !input.description)
      throw new AppError('VALIDATION', 'Faltan campos');
    return this.repo.create({
      title: input.title,
      description: input.description,
      subdescription: input.subdescription,
      user_id: input.user_id,
    } as Training);
  }
}

export class UpdateTraining {
  constructor(private repo: ITrainingRepository) {}
  async execute(
    id: number,
    data: { title?: string; description?: string; subdescription?: string },
  ) {
    if (!(await this.repo.exists(id)))
      throw new AppError('NOT_FOUND', 'Formación no encontrada');
    return this.repo.update(id, data);
  }
}

export class DeleteTraining {
  constructor(private repo: ITrainingRepository) {}
  async execute(id: number) {
    if (!(await this.repo.exists(id)))
      throw new AppError('NOT_FOUND', 'Formación no encontrada');
    await this.repo.softDelete(id);
  }
}
