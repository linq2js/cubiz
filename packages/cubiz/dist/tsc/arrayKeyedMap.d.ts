declare class ArrayKeyedMap<TValue = any, TKey = any> {
    private root;
    private find;
    get(key: TKey | TKey[]): TValue | undefined;
    set(key: TKey | TKey[], value: TValue): void;
    delete(key: TKey | TKey[]): boolean;
    each(callback: (value: TValue, key: TKey[]) => void): void;
    clear(): void;
}
export { ArrayKeyedMap };
