class MapEntry<TKey, TValue> {
  public readonly children = new Map<TKey, MapEntry<TKey, TValue>>();
  public value: TValue | undefined;
  public hasValue = false;
}

class ArrayKeyedMap<TValue = any, TKey = any> {
  private root = new MapEntry<TKey, TValue>();

  private find(
    key: TKey | TKey[],
    createNew = false
  ):
    | {
        entry: MapEntry<TKey, TValue>;
        parent: MapEntry<TKey, TValue> | undefined;
        key: TKey[];
        lastKey: TKey | undefined;
      }
    | undefined {
    if (!Array.isArray(key)) key = [key];
    let entry = this.root;
    let parent: MapEntry<TKey, TValue> | undefined;
    let lastKey: TKey | undefined;
    for (const k of key) {
      let child = entry.children.get(k);
      if (!child) {
        if (!createNew) return undefined;
        child = new MapEntry<TKey, TValue>();
        entry.children.set(k, child);
      }
      parent = entry;
      lastKey = k;
      entry = child;
    }
    return {
      entry,
      parent,
      key,
      lastKey,
    };
  }

  get(key: TKey | TKey[]): TValue | undefined {
    return this.find(key)?.entry.value;
  }

  set(key: TKey | TKey[], value: TValue) {
    const result = this.find(key, true)!;
    result.entry.value = value;
    result.entry.hasValue = true;
  }

  delete(key: TKey | TKey[]) {
    const result = this.find(key);
    if (result) {
      result.parent?.children.delete(result.lastKey!);
      return true;
    }
    return false;
  }

  each(callback: (value: TValue, key: TKey[]) => void) {
    function walk(entry: MapEntry<TKey, TValue>, key: TKey[]) {
      entry.children.forEach((child, k) => {
        const childKey = key.concat([k]);
        if (child.hasValue) {
          callback(child.value as TValue, childKey);
        }
        walk(child, childKey);
      });
    }

    walk(this.root, []);
  }

  clear() {
    this.root.children.clear();
  }
}

export { ArrayKeyedMap };
