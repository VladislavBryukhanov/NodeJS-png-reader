import * as fs from 'fs';
import PngChunk from './src/png-chunk';
import SequentBufferReader from './src/helpers/sequent-buffer-reader';
import {FILE_HEADER_BYTES_NUMBER, IHDR_CHUNK, PNG_HEADER} from './src/constants';
import PngWriter from './src/utils/png-writer';
import mergeUint8Arrays from './src/helpers/merge-uint8arrays';
import {ImageInfo} from './src/types';

class PngReader {
    private fileBuffer: Buffer;
    private chunks: PngChunk[] = [];

    public imageInfo?: ImageInfo;

    // private imagePixels?: number[][] = [];
    private pixelsBuffer = new Uint8Array();

    constructor(path: string) {
        this.fileBuffer = fs.readFileSync(path);

        const fileHeader = this.fileBuffer.slice(0, FILE_HEADER_BYTES_NUMBER).toString('hex');

        if (fileHeader !== PNG_HEADER) {
            throw new Error('File has Unsupported format');
        }

        this.readChunks();
    }

    private readChunks() {
        let offset = FILE_HEADER_BYTES_NUMBER;

        while (this.fileBuffer.length > offset) {
            const bytes = this.fileBuffer.slice(offset);
            const chunk = new PngChunk(bytes);
    
            this.chunks.push(chunk);
            this.processChunk(chunk);

            offset += chunk.totalChunkLength;
        }
    }

    private processChunk(chunk: PngChunk) {
        switch(chunk.type) {
            case 'IHDR': {
                const bytes = SequentBufferReader.from(chunk.data);
                this.imageInfo = {
                    height: bytes.readUIntBE(IHDR_CHUNK.HEIGHT_BYTES_NUMBER),
                    width: bytes.readUIntBE(IHDR_CHUNK.WIDTH_BYTES_NUMBER),
                    bitDepth: bytes.slice(IHDR_CHUNK.BIT_DEPTH_BYTES_NUMBER),
                    colorType: bytes.slice(IHDR_CHUNK.COLOR_TYPE_BYTES_NUMBER),
                    compressionMethod: bytes.slice(IHDR_CHUNK.COMPRESSION_METHOD_BYTES_NUMBER),
                    filterMethod: bytes.slice(IHDR_CHUNK.FILTER_METHOD_BYTES_NUMBER),
                    interlaceMethod: bytes.slice(IHDR_CHUNK.INTERLACE_METHOD_BYTES_NUMBER),
                }
                break;
            }
            case 'IDAT': {
                this.pixelsBuffer = mergeUint8Arrays(this.pixelsBuffer, chunk.data);
                break;
            }
            case 'IEND': {
                // WIP
                const pngHeader = this.fileBuffer.slice(0, FILE_HEADER_BYTES_NUMBER);
                PngWriter.savePngWithMergedChunks('./assets/img__.png', pngHeader, this.imageInfo, this.chunks, this.pixelsBuffer);
                break;
            }
        }
    }
}

const image = new PngReader('./assets/img.png');
console.log(image.imageInfo);

// console.log('\x1b[36m%s\x1b[0m', String.fromCharCode(9619));