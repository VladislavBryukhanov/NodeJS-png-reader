export const PNG_HEADER = '89504e470d0a1a0a';
export const FILE_HEADER_BYTES_NUMBER = 8;

export enum IHDR_CHUNK {
    WIDTH_BYTES_NUMBER = 4,
    HEIGHT_BYTES_NUMBER = 4,
    BIT_DEPTH_BYTES_NUMBER = 1,
    COLOR_TYPE_BYTES_NUMBER = 1,
    COMPRESSION_METHOD_BYTES_NUMBER = 1,
    FILTER_METHOD_BYTES_NUMBER = 1,
    INTERLACE_METHOD_BYTES_NUMBER = 1
}

export enum CHUNK_HEADER {
    TYPE_BYTES_NUMBER = 4,
    DATA_LENGTH_BYTES_NUMBER = 4,
    CRC_BYTES_NUMBER = 4,
}