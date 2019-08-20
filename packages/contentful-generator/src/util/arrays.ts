export function sortedArray<T>(set: Set<T>): Array<T> {
    return Array.from(set).sort();
}
