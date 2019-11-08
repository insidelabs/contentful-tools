export type Nullable<T> = T | null | undefined;

export function isNonNullable<T>(value: Nullable<T>): value is T {
    return value != null;
}
