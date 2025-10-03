import {
  MediaAIUpload,
  MediaAIChat,
  MediaAIImageGeneration,
} from '@domain/models';

export interface IMediaAIRepository {
  uploadFile(data: MediaAIUpload): Promise<{ success: boolean; key: string }>;
  getFile(key: string): Promise<Blob | null>;
  chatWithAI(data: MediaAIChat): Promise<any>;
  generateImage(data: MediaAIImageGeneration): Promise<R2ObjectBody | null>;
}
