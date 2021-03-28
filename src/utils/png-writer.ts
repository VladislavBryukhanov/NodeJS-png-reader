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

    // FIXME do not work for multiple chunks. unable to unzip each chunk, zlib exception

    // static savePng(path: string, chunks: PngChunk[], pngHeader: Buffer) {
    //     let imageBuff = new Uint8Array(pngHeader.byteLength);
    //     imageBuff.set(pngHeader, 0);
    
    //     chunks.forEach(chunk => {
    //         if (chunk.type === 'IDAT') {
    //             let position = 0;
    //             const data = inflateSync(chunk.data);
    //             let mutatedData = new Uint8Array();
    
    //             while(data.byteLength > position) {
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
    
    //                 position += 4;
    //             }
    
    //             const chunkContent = this.buildChunkContentBytes(chunk.type, mutatedData)

    //             const source = Buffer.concat([
    //                 this.buildChunkDataLengthBytes(mutatedData),
    //                 chunkContent,
    //                 this.buildCrcBytes(chunkContent)
    //             ]);
    //             imageBuff = mergeUint8Arrays(imageBuff, source);
                
    //             return;
    //         }
    
    //         const source = Buffer.concat([
    //             this.buildChunkDataLengthBytes(chunk.data),
    //             this.buildChunkContentBytes(chunk.type, chunk.data),
    //             chunk.crc
    //         ]);
    
    //         imageBuff = mergeUint8Arrays(imageBuff, source);
    //     });
    
    //     fs.writeFileSync(path, imageBuff);
    // }
    
    static savePngWithMergedChunks(path: string, chunks: PngChunk[], pngHeader: Buffer, idatPayload) {
        let imageBuff = new Uint8Array(pngHeader.byteLength);
        imageBuff.set(pngHeader, 0);
    
        chunks.forEach(chunk => {
            if (chunk.type === 'IEND') {
                let position = 0;
                let mutatedData = new Uint8Array();
                const data = inflateSync(idatPayload);
    
                while(data.byteLength > position) {
                    // if (chunk.data.slice(4)[0] === 0) {
                    // }
                    
                    // const payload = Buffer.from(data.slice(position, position + 4));
    
                    const b = data.slice(position, position + 4);
                    const payload = Buffer.from(
                        b.map((ch: any, i) => {
                            // if (i === 3 || i === 1) {
                            //     return 255;
                            //     // return Math.floor(parseInt(ch) / 2)
                            // }
    
                            return ch;
                            // return Math.floor(parseInt(ch) / 2)
                        })
                    );
    
                    mutatedData = mergeUint8Arrays(imageBuff, payload);
                    position += 4;
                }
    
                const chunkContent = this.buildChunkContentBytes(chunk.type, mutatedData, true);

                const source = Buffer.concat([
                    this.buildChunkDataLengthBytes(mutatedData, true),
                    chunkContent,
                    this.buildCrcBytes(chunkContent)
                ]);
                imageBuff = mergeUint8Arrays(imageBuff, source);
            }
    


            const source = Buffer.concat([
                this.buildChunkDataLengthBytes(chunk.data),
                this.buildChunkContentBytes(chunk.type, chunk.data),
                chunk.crc
            ]);
    
            imageBuff = mergeUint8Arrays(imageBuff, source);
        });
    
        fs.writeFileSync(path, imageBuff);
    }
}
