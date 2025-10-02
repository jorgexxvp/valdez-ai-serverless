export interface MediaAIUpload {
  key: string;
  file: File;
}

export interface MediaAIImageGeneration {
  prompt: string;
  imageKey: string;
}

export interface MediaAIChat {
  message: string;
  response: any;
}
