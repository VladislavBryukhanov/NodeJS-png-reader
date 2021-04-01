import mergeUint8Arrays from '../helpers/merge-uint8arrays';

export default async (data: Buffer, scanLineLength: number) => {
    const asyncBytesChunks = [];
    for(let offset = 0; data.byteLength > offset; offset += scanLineLength) {
        asyncBytesChunks.push(processBytes(data,offset, scanLineLength));
    }
    const bytesChunks = await Promise.all(asyncBytesChunks);
    return bytesChunks.reduce(mergeUint8Arrays, new Uint8Array());
}

const processBytes = async (data, offset, scanLineLength) => new Promise((res, rej) => {
    const scanLine = data.slice(offset, scanLineLength + offset);
    const filter = scanLine[0];

    let mutatedData = new Uint8Array([filter]);
    
    for(let i = 1; scanLine.byteLength > i; i += 4) {
        // if (filter === 4) {
        //     mutatedData = mergeUint8Arrays(mutatedData, new Uint8Array([0, 0, 0, 1]));
        //     continue;
        // }
            
        const payload = Buffer.from(scanLine.slice(i, i + 4));

        // const bytes = data.slice(i, i + 4);
        // const payload = Buffer.from(
        //     bytes.map((ch: any, i) => {
        //         if (i === 4) {
        //             // return 255;
        //             return Math.floor(parseInt(ch) / 2)
        //         }

        //         return ch;
        //         // return Math.floor(parseInt(ch) / 2);
        //     })
        // );

        mutatedData = mergeUint8Arrays(mutatedData, payload);
    }

    return res(mutatedData);
})