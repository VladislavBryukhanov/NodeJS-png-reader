export interface ImageInfo {
    height: number;
    width: number;
    bitDepth: number;
    colorType: number;
    compressionMethod: number;
    filterMethod: number;
    interlaceMethod: number;
}

export type PngChunkTypes = 'IHDR' | 'PLTE' | 'IDAT' | 'IEND';
