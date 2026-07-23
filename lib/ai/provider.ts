export type GenerationStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";

export interface TextGenerationInput {
  prompt: string;
  workspaceId: string;
  brandId?: string;
  model?: string;
}

export interface TextGenerationResult {
  id: string;
  text: string;
  provider: string;
  model: string;
  estimatedCostUsd?: number;
}

export interface ImageGenerationInput extends TextGenerationInput {
  width: number;
  height: number;
  referenceAssetIds?: string[];
}

export interface ImageGenerationResult {
  id: string;
  status: GenerationStatus;
  assetUrl?: string;
  provider: string;
}

export interface ImageAnalysisInput {
  workspaceId: string;
  assetUrl: string;
  question: string;
}

export interface ImageAnalysisResult {
  summary: string;
  labels: string[];
  provider: string;
}

export interface AIProvider {
  generateText(input: TextGenerationInput): Promise<TextGenerationResult>;
  generateImage(input: ImageGenerationInput): Promise<ImageGenerationResult>;
  analyzeImage(input: ImageAnalysisInput): Promise<ImageAnalysisResult>;
}

export function getAIProvider(): AIProvider {
  // Provider SDKs must be initialized lazily here after their credentials are validated.
  throw new Error("No hay un proveedor de IA multipropósito configurado.");
}
