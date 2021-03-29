import * as fs from 'fs';
import {crc32} from 'crc';
import {inflateSync, deflateSync} from 'zlib';
import PngChunk from '../png-chunk';
import mergeUint8Arrays from '../helpers/merge-uint8arrays';
import {CHUNK_HEADER} from '../constants';

// WIP
export default class PngWriter {
    private static buildChunkDataLengthBytes(chunkData: Uint8Array | Buffer, deflate?: boolean) {
        const data = deflate 
            ? deflateSync(chunkData) 
            : chunkData;

        const lengthBuf = Buffer.allocUnsafe(CHUNK_HEADER.DATA_LENGTH_BYTES_NUMBER);
        lengthBuf.writeUIntBE(data.byteLength, 0, CHUNK_HEADER.DATA_LENGTH_BYTES_NUMBER);
        return lengthBuf;
    }

    private static buildChunkContentBytes(type: string, chunkData: Uint8Array | Buffer, deflate?: boolean) {
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


    private static buildChunk(chunkType, chunkData, deflate?: boolean) {
        const chunkContent = this.buildChunkContentBytes(chunkType, chunkData, deflate );
        return Buffer.concat([
            this.buildChunkDataLengthBytes(chunkData),
            chunkContent,
            this.buildCrcBytes(chunkContent)
        ]);
    }

    // FIXME do not work for multiple chunks. unable to unzip each chunk, zlib exception

    // static savePng(path: string, chunks: PngChunk[], pngHeader: Buffer) {
    //     let imageBuff = new Uint8Array(pngHeader);
    
    //     chunks.forEach(chunk => {
    //         if (chunk.type === 'IDAT') {
    //             const data = inflateSync(chunk.data);
    //             let mutatedData = new Uint8Array();
    
    //             for(let position = 0; data.byteLength > position; position += 4) {
    //                 // if (chunk.data.slice(4)[0] === 0) {
    //                 // }
                    
    //                 // const payload = Buffer.from(data.slice(position, position + 4));
    
    //                 const b = data.slice(position, position + 4);
    //                 const payload = Buffer.from(
    //                     b.map((ch: any, i) => {
    //                         // if (i === 3 || i === 1) {
    //                         //     return 255;
    //                         //     // return Math.floor(parseInt(ch) / 2)
    //                         // }
    
    //                         return ch;
    //                         // return Math.floor(parseInt(ch) / 2)
    //                     })
    //                 );
    
    //                 mutatedData = mergeUint8Arrays(imageBuff, payload);
    //             }
    
    //             return imageBuff = mergeUint8Arrays(imageBuff, this.buildChunk('IDAT', mutatedData, true));
    //         }
    
    //         imageBuff = mergeUint8Arrays(imageBuff, this.buildChunk(chunk.type, chunk.data));
    //     });
    
    //     fs.writeFileSync(path, imageBuff);
    // }
    
    static savePngWithMergedChunks(path: string, chunks: PngChunk[], pngHeader: Buffer, idatPayload: Uint8Array) {
        let imageBuff = new Uint8Array(pngHeader);
    
        chunks.forEach(chunk => {
            if (chunk.type === 'IEND') {
                const data = inflateSync(idatPayload);
                let mutatedData = new Uint8Array();
    
                for(let position = 0; data.byteLength > position; position += 4) {
                    // if (chunk.data.slice(4)[0] === 0) {
                    // }
                    
                    // const payload = Buffer.from(data.slice(position, position + 4));
    
                    const bytes = data.slice(position, position + 4);
                    const payload = Buffer.from(
                        bytes.map((ch: any, i) => {
                            // if ( i === 1) {
                            //     return 255;
                            //     // return Math.floor(parseInt(ch) / 2)
                            // }
    
                            return ch;
                            // return Math.floor(parseInt(ch) / 2);
                        })
                    );
    
                    mutatedData = mergeUint8Arrays(mutatedData, payload);
                }
                return imageBuff = mergeUint8Arrays(imageBuff, this.buildChunk('IDAT', mutatedData, true));
            }
    
            if (chunk.type !== 'IDAT') {
                imageBuff = mergeUint8Arrays(imageBuff, this.buildChunk(chunk.type, chunk.data));
            }
        });
    
        fs.writeFileSync(path, imageBuff);
    }
}
