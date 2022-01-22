export default (arr1, arr2) => {
    const concated = new Uint8Array(arr1.byteLength + arr2.byteLength);
    concated.set(arr1);
    concated.set(arr2, arr1.byteLength);

    return concated;
}