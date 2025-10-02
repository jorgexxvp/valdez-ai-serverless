import { IBlogRepository } from '../../../domain/repositories/IBlogRepository';
import { Blog } from '../../../domain/models/Blog';
import { AppError } from '../../../shared/errors';

export class ListBlogs {
  constructor(private repo: IBlogRepository) {}
  execute(): Promise<Blog[]> {
    return this.repo.findAll();
  }
}

export class CreateBlog {
  constructor(private repo: IBlogRepository) {}
  async execute(input: {
    title: string;
    url: string;
    description: string;
    user_id: number;
  }) {
    if (!input.title || !input.description || !input.url) {
      throw new AppError('VALIDATION', 'Faltan campos requeridos');
    }
    return this.repo.create({
      title: input.title,
      url: input.url,
      description: input.description,
      user_id: input.user_id,
    } as Blog);
  }
}

export class UpdateBlog {
  constructor(private repo: IBlogRepository) {}
  async execute(
    id: number,
    data: { title?: string; url?: string; description?: string },
  ) {
    if (!(await this.repo.exists(id)))
      throw new AppError('NOT_FOUND', 'Blog no encontrado');
    return this.repo.update(id, data);
  }
}

export class DeleteBlog {
  constructor(private repo: IBlogRepository) {}
  async execute(id: number) {
    if (!(await this.repo.exists(id)))
      throw new AppError('NOT_FOUND', 'Blog no encontrado');
    await this.repo.softDelete(id);
  }
}
