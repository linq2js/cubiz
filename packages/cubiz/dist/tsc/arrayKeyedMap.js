"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArrayKeyedMap = void 0;
class MapEntry {
    constructor() {
        this.children = new Map();
        this.hasValue = false;
    }
}
class ArrayKeyedMap {
    constructor() {
        this.root = new MapEntry();
    }
    find(key, createNew = false) {
        if (!Array.isArray(key))
            key = [key];
        let entry = this.root;
        let parent;
        let lastKey;
        for (const k of key) {
            let child = entry.children.get(k);
            if (!child) {
                if (!createNew)
                    return undefined;
                child = new MapEntry();
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
    get(key) {
        var _a;
        return (_a = this.find(key)) === null || _a === void 0 ? void 0 : _a.entry.value;
    }
    set(key, value) {
        const result = this.find(key, true);
        result.entry.value = value;
        result.entry.hasValue = true;
    }
    delete(key) {
        var _a;
        const result = this.find(key);
        if (result) {
            (_a = result.parent) === null || _a === void 0 ? void 0 : _a.children.delete(result.lastKey);
            return true;
        }
        return false;
    }
    each(callback) {
        function walk(entry, key) {
            entry.children.forEach((child, k) => {
                const childKey = key.concat([k]);
                if (child.hasValue) {
                    callback(child.value, childKey);
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
exports.ArrayKeyedMap = ArrayKeyedMap;
//# sourceMappingURL=arrayKeyedMap.js.map