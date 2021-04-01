import {CHUNK_HEADER} from './constants';
import SequentBufferReader from './helpers/sequent-buffer-reader';
import {PngChunkTypes} from './types';

export default class PngChunk {
    totalChunkLength: number;

    type: PngChunkTypes;
    dataLength: number;
    data: Buffer;
    crc: Buffer;

    constructor(bytes: Buffer) {
        const seqBytes = SequentBufferReader.from(bytes);

        this.dataLength = seqBytes.readUIntBE(CHUNK_HEADER.DATA_LENGTH_BYTES_NUMBER);
        this.type = seqBytes.slice(CHUNK_HEADER.TYPE_BYTES_NUMBER).toString('utf-8') as PngChunkTypes;
        this.data = seqBytes.slice(this.dataLength);
        this.crc = seqBytes.slice(CHUNK_HEADER.CRC_BYTES_NUMBER);

        this.totalChunkLength = seqBytes.offset;
    }
}