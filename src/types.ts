export interface ImageInfo {
    height: number;
    width: number;
    bitDepth: Buffer;
    colorType: Buffer;
    compressionMethod: Buffer;
    filterMethod: Buffer;
    interlaceMethod: Buffer;
}

export type PngChunkTypes = 'IHDR' | 'PLTE' | 'IDAT' | 'IEND';
