export interface MetaData {
  format: string;
  albumPic: string;
  musicName?: string;
  artist?: string[];
  album?: string;
  [key: string]: any;
}

export interface DecryptedResult {
  audioData: Uint8Array;
  metadata: MetaData;
  coverUrl?: string;
}

const CORE_KEY_HEX = '687A4852416D736F356B496E62617857';
const META_KEY_HEX = '2331346C6A6B5F215C5D2630553C2728';

function hexToArray(hex: string): Uint8Array {
  const result = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    result[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return result;
}

function arrayToHex(arr: Uint8Array): string {
  return Array.from(arr)
    .map(x => x.toString(16).padStart(2, '0'))
    .join('');
}

function aesDecryptECB(encrypted: Uint8Array, key: Uint8Array): Uint8Array {
  try {
    const CryptoJS = require('crypto-js');

    const encryptedHex = arrayToHex(encrypted);
    const keyHex = arrayToHex(key);

    const encryptedWords = CryptoJS.enc.Hex.parse(encryptedHex);
    const keyWords = CryptoJS.enc.Hex.parse(keyHex);

    const encryptedBase64 = CryptoJS.enc.Base64.stringify(encryptedWords);

    const decrypted = CryptoJS.AES.decrypt(
      encryptedBase64,
      keyWords,
      {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.NoPadding
      }
    );

    const decryptedHex = decrypted.toString(CryptoJS.enc.Hex);
    const result = new Uint8Array(decryptedHex.length / 2);
    for (let i = 0; i < decryptedHex.length; i += 2) {
      result[i / 2] = parseInt(decryptedHex.substr(i, 2), 16);
    }

    return result;
  } catch (error) {
    console.error('AES decryption error:', error);
    throw error;
  }
}

function unpad(data: Uint8Array): Uint8Array {
  const paddingLength = data[data.length - 1];
  if (paddingLength > 0 && paddingLength <= 16) {
    return data.slice(0, data.length - paddingLength);
  }
  return data;
}

function rc4Init(keyData: Uint8Array): Uint8Array {
  const keyBox = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    keyBox[i] = i;
  }

  let c = 0;
  let lastByte = 0;
  let keyOffset = 0;
  const keyLength = keyData.length;

  for (let i = 0; i < 256; i++) {
    const swap = keyBox[i];
    c = (swap + lastByte + keyData[keyOffset]) & 0xff;
    keyOffset += 1;

    if (keyOffset >= keyLength) {
      keyOffset = 0;
    }

    keyBox[i] = keyBox[c];
    keyBox[c] = swap;
    lastByte = c;
  }

  return keyBox;
}

function ncmDecryptAudio(data: Uint8Array, keyBox: Uint8Array): Uint8Array {
  const result = new Uint8Array(data.length);

  const mask = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    const j = (i + 1) & 0xff;
    const val1 = keyBox[j];
    const val2 = keyBox[(val1 + j) & 0xff];
    const val3 = keyBox[(val1 + val2) & 0xff];
    mask[i] = val3;
  }

  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ mask[i & 0xff];
  }

  return result;
}

function removePadding(data: Uint8Array): Uint8Array {
  if (data.length === 0) return data;
  const lastByte = data[data.length - 1];
  const paddingLength = Math.min(lastByte, data.length);

  let isPadding = true;
  for (let i = 0; i < paddingLength; i++) {
    if (data[data.length - 1 - i] !== paddingLength) {
      isPadding = false;
      break;
    }
  }

  if (isPadding && paddingLength > 0) {
    return data.slice(0, data.length - paddingLength);
  }
  return data;
}

function base64Decode(str: string): Uint8Array {
  const binaryString = atob(str);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decryptNCM(arrayBuffer: ArrayBuffer): Promise<DecryptedResult> {
  const view = new Uint8Array(arrayBuffer);
  let offset = 0;

  try {
    const header = view.slice(0, 8);
    const headerHex = arrayToHex(header);
    if (headerHex !== '4354454e4644414d') {
      throw new Error('Invalid NCM file: incorrect header');
    }

    offset = 10;

    const keyLength = new DataView(arrayBuffer, offset, 4).getUint32(0, true);
    offset += 4;

    let keyData = new Uint8Array(view.slice(offset, offset + keyLength));
    offset += keyLength;

    for (let i = 0; i < keyData.length; i++) {
      keyData[i] ^= 0x64;
    }

    const coreKey = hexToArray(CORE_KEY_HEX);
    let decryptedKeyData = aesDecryptECB(keyData, coreKey);

    decryptedKeyData = unpad(decryptedKeyData);

    const actualKey = decryptedKeyData.slice(17);

    const keyBox = rc4Init(actualKey);

    const metaLength = new DataView(arrayBuffer, offset, 4).getUint32(0, true);
    offset += 4;

    let metaData = new Uint8Array(view.slice(offset, offset + metaLength));
    offset += metaLength;

    for (let i = 0; i < metaData.length; i++) {
      metaData[i] ^= 0x63;
    }

    let metadata: MetaData = { format: 'mp3', albumPic: '' };

    try {
      const metaBase64Str = new TextDecoder().decode(metaData.slice(22));
      const metaDecoded = base64Decode(metaBase64Str);
      const metaKey = hexToArray(META_KEY_HEX);
      let metaDecryptedData = aesDecryptECB(metaDecoded, metaKey);

      metaDecryptedData = unpad(metaDecryptedData);

      const metaStr = new TextDecoder().decode(metaDecryptedData.slice(6));
      metadata = JSON.parse(metaStr);
    } catch (error) {
      console.warn('Failed to parse metadata, using defaults:', error);
    }

    offset += 4;
    offset += 5;

    const imageSize = new DataView(arrayBuffer, offset, 4).getUint32(0, true);
    offset += 4;

    offset += imageSize;

    const audioData = view.slice(offset);

    const decryptedAudio = ncmDecryptAudio(audioData, keyBox);

    return {
      audioData: decryptedAudio,
      metadata,
      coverUrl: metadata.albumPic
    };
  } catch (error) {
    throw new Error(`Failed to decrypt NCM: ${error}`);
  }
}

export async function downloadImage(url: string): Promise<Uint8Array> {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  };

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    return new Uint8Array(await response.arrayBuffer());
  } catch (error) {
    throw new Error(`Failed to download cover image: ${error}`);
  }
}

export function getMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    'mp3': 'audio/mpeg',
    'flac': 'audio/flac',
    'ogg': 'audio/ogg',
    'm4a': 'audio/mp4',
    'wav': 'audio/wav'
  };
  return mimeTypes[format.toLowerCase()] || 'application/octet-stream';
}

export function getOutputFileName(inputPath: string, format: string): string {
  const baseName = inputPath.split(/[\\/]/).pop()?.split('.')[0] || 'output';
  return `${baseName}.${format}`;
}

export async function convertNCMFile(
  ncmFile: File,
  outputFormat: string
): Promise<{ blob: Blob; filename: string; metadata: MetaData }> {
  const arrayBuffer = await ncmFile.arrayBuffer();

  try {
    const { audioData, metadata } = await decryptNCM(arrayBuffer);

    const mimeType = getMimeType(outputFormat);
    const filename = getOutputFileName(ncmFile.name, outputFormat);

    const blob = new Blob([new Uint8Array(audioData) as any], { type: mimeType });

    return {
      blob,
      filename,
      metadata
    };
  } catch (error) {
    throw new Error(`Failed to convert NCM file: ${error}`);
  }
}
