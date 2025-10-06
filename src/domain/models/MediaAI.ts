export interface MediaAIUpload {
  key: string;
  file: File;
}

export interface MediaAIImageGeneration {
  prompt: string;
  imageKey: string;
  model: keyof AiModels;
}

export interface MediaAIChat {
  maxsToken: number;
  message: string;
}
