export default class SequentBufferReader {
    public offset: number;
    private buffer: Buffer;

    constructor(arg) {
        this.offset = 0;
        this.buffer = Buffer.from(arg);
    }
    
    static from(arg) {
        return new SequentBufferReader(arg);
    }

    slice(end?: number) {
        const buf = this.buffer.slice(this.offset, this.offset + end);
        this.offset += end;
        return buf;
    }

    readUIntBE(byteLength: number) {
        const buf = this.buffer.readUIntBE(this.offset, byteLength);
        this.offset += byteLength;
        return buf;
    }
}
