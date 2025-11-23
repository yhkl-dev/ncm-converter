import { decryptNCM, downloadImage } from "~src/utils/ncmConverter"

export interface ConvertRequest {
  fileData: number[]; // Store as array of numbers instead of ArrayBuffer
  fileName: string;
}

export interface ConvertResponse {
  success: boolean;
  audioData?: number[];
  metadata?: any;
  error?: string;
}

// Message handler for Plasmo
const handler = async (req: any, res: any) => {
  try {
    const { fileData, fileName } = req.body as ConvertRequest;

    // Convert array back to ArrayBuffer
    const arrayBuffer = new Uint8Array(fileData).buffer;

    // Decrypt NCM file
    const { audioData, metadata } = await decryptNCM(arrayBuffer);

    res.send({
      success: true,
      audioData: Array.from(new Uint8Array(audioData)),
      metadata
    } as ConvertResponse);
  } catch (error) {
    res.send({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    } as ConvertResponse);
  }
};

export default handler;
