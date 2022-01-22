import * as fs from 'fs';
import {crc32} from 'crc';
import {inflateSync, deflateSync} from 'zlib';
import PngChunk from '../png-chunk';
import mergeUint8Arrays from '../helpers/merge-uint8arrays';
import {CHUNK_HEADER, MIN_IDAT_CHUNK_LENGTH} from '../constants';
import {ImageInfo, PngChunkTypes} from '../types';
import processDataBytesAsync from './process-data-bytes-async';

export default class PngWriter {
    private static buildChunkDataLengthBytes(chunkData: Uint8Array | Buffer, deflate?: boolean) {
        const data = deflate 
            ? deflateSync(chunkData) 
            : chunkData;

        const lengthBuf = Buffer.allocUnsafe(CHUNK_HEADER.DATA_LENGTH_BYTES_NUMBER);
        lengthBuf.writeUIntBE(data.byteLength, 0, CHUNK_HEADER.DATA_LENGTH_BYTES_NUMBER);
        return lengthBuf;
    }

    private static buildChunkDataBytes(type: string, chunkData: Uint8Array | Buffer, deflate?: boolean) {
        const data = deflate 
            ? deflateSync(chunkData)
            : chunkData;

        return Buffer.concat([
            Buffer.from(type, 'utf-8'),
            data
        ]);
    }

    private static buildCrcBytes(chunkContent: Buffer) {
        const crcBuf = Buffer.allocUnsafe(CHUNK_HEADER.CRC_BYTES_NUMBER);
        crcBuf.writeUIntBE(crc32(chunkContent), 0, CHUNK_HEADER.CRC_BYTES_NUMBER);
        return crcBuf;
    }

    private static buildChunk(chunkType: PngChunkTypes, chunkData: Uint8Array, deflate?: boolean) {
        const chunkContent = this.buildChunkDataBytes(chunkType, chunkData, deflate );
        return Buffer.concat([
            this.buildChunkDataLengthBytes(chunkData),
            chunkContent,
            this.buildCrcBytes(chunkContent)
        ]);
    }

    private static splitIdatToChunks(idat: Uint8Array) {
        const compressedIdat = deflateSync(idat);

        const AVG_IDAT_CHUNKS_NUMBER = 60;
        const chunkLength = compressedIdat.byteLength / AVG_IDAT_CHUNKS_NUMBER;
        const chunks = [];

        for (let position = 0; position < compressedIdat.byteLength; position += chunkLength) {
            const data = compressedIdat.slice(position, position + chunkLength);
            chunks.push(new Uint8Array(data));
        }

        return chunks;
    }

    static async savePngWithMergedChunks(
        path: string, 
        pngHeader: Buffer, 
        imageInfo: ImageInfo, 
        chunks: PngChunk[], 
        idatPayload: Uint8Array
    ) {
        let imageBuff = new Uint8Array(pngHeader);
    
        for (let chunk of chunks) {
            if (chunk.type === 'IEND') {
                const data = inflateSync(idatPayload);

                const scanLineLength = imageInfo.width * 4 + 1;
                const content = await processDataBytesAsync(data, scanLineLength);

                if (content.byteLength < MIN_IDAT_CHUNK_LENGTH) {
                    imageBuff = mergeUint8Arrays(imageBuff, this.buildChunk('IDAT', content, true));
                    continue;
                }

                const chunkedIdat = this.splitIdatToChunks(content);

                chunkedIdat.forEach((bytes: Uint8Array) => {
                    imageBuff = mergeUint8Arrays(imageBuff, this.buildChunk('IDAT', bytes)); // deflate me
                });
            }
    
            if (chunk.type !== 'IDAT') {
                imageBuff = mergeUint8Arrays(imageBuff, this.buildChunk(chunk.type, chunk.data));
            }
        };
    
        fs.writeFileSync(path, imageBuff);
    }
}
