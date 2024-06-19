export const removeIf = (array: any[], predicate: (value: any, index: number, array: any[]) => boolean) => {
    if (!array || array.length === 0) {
        return array;
    }
    let i = 0;
    while (i < array.length) {
        if (predicate(array[i], i, array)) {
            array.splice(i, 1);
        } else {
            ++i;
        }
    }
    return array;
}