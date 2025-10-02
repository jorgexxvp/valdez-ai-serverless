import {
  MediaAIUpload,
  MediaAIChat,
  MediaAIImageGeneration,
} from '@domain/models';
import { IMediaAIRepository } from '@domain/repositories';

export class MediaAIUseCases {
  constructor(private mediaAIRepository: IMediaAIRepository) {}

  async uploadFile(data: MediaAIUpload) {
    return this.mediaAIRepository.uploadFile(data);
  }

  async getFile(key: string) {
    return this.mediaAIRepository.getFile(key);
  }

  async chatWithAI(data: MediaAIChat) {
    return this.mediaAIRepository.chatWithAI(data);
  }

  async generateImage(data: MediaAIImageGeneration) {
    return this.mediaAIRepository.generateImage(data);
  }
}
