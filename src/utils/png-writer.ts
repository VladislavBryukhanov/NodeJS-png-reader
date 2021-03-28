import * as fs from 'fs';
import {crc32} from 'crc';
import {inflateSync, deflateSync} from 'zlib';
import PngChunk from '../png-chunk';
import mergeUint8Arrays from '../helpers/merge-uint8arrays';

// WIP
export default (path: string, chunks: PngChunk[], pngHeader: Buffer) => {
    let imageBuff = new Uint8Array(pngHeader.byteLength);
    imageBuff.set(pngHeader, 0);

    chunks.forEach(chunk => {
        if (chunk.type === 'IDAT') {
            let position = 0;
            const data = inflateSync(chunk.data);
            let mutatedData = new Uint8Array();

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

                const tmp = mutatedData;
                mutatedData = new Uint8Array(tmp.byteLength + payload.byteLength);
                mutatedData.set(tmp);
                mutatedData.set(payload, tmp.byteLength);

                position += 4;
            }

            const chunkContent = Buffer.concat([
                Buffer.from(chunk.type, 'utf-8'),
                deflateSync(mutatedData)
            ]);

            const lengthBuf = Buffer.allocUnsafe(4);
            lengthBuf.writeUIntBE(deflateSync(mutatedData).byteLength, 0, 4);

            const crcBuf = Buffer.allocUnsafe(4);
            crcBuf.writeUIntBE(crc32(chunkContent), 0, 4);

            const source = Buffer.concat([
                lengthBuf,
                chunkContent,
                crcBuf
            ]);
            imageBuff = mergeUint8Arrays(imageBuff, source);
            
            return;
        }



        const buf = Buffer.allocUnsafe(4);
        buf.writeUIntBE(chunk.dataLength, 0, 4);

        const source = Buffer.concat([
            buf,
            Buffer.from(chunk.type, 'utf-8'),
            chunk.data,
            chunk.crc
        ]);

        imageBuff = mergeUint8Arrays(imageBuff, source);
    });

    fs.writeFileSync(path, imageBuff);
}
