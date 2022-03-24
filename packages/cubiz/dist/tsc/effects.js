"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequential = exports.droppable = exports.allSettled = exports.race = exports.all = exports.when = exports.throttle = exports.debounce = exports.delay = void 0;
const core_1 = require("./core");
function processAsync(promises, type, parent) {
    const result = Array.isArray(promises) ? [] : {};
    const promiseArray = [];
    const cancellable = (0, core_1.createCancellable)(() => {
        for (const promise of promiseArray) {
            if (typeof (promise === null || promise === void 0 ? void 0 : promise.cancel) === "function") {
                promise.cancel();
            }
        }
    }, parent);
    const defer = (0, core_1.createDefer)(cancellable);
    let count = 0;
    function onDone(key, value, reason, hasError) {
        count--;
        if (cancellable.cancelled())
            return;
        if (hasError) {
            if (type !== "allSettled") {
                cancellable.cancel();
                return defer.reject(reason);
            }
            result[key] = { status: "rejected", reason };
        }
        else {
            result[key] =
                type === "allSettled" ? { status: "fulfilled", value } : value;
            if (type === "race") {
                cancellable.cancel();
                return defer.resolve(result);
            }
        }
        if (!count) {
            defer.resolve(result);
        }
    }
    Object.keys(promises).forEach((key) => {
        const value = promises[key];
        // is promise like object
        if (typeof (value === null || value === void 0 ? void 0 : value.then) === "function") {
            promiseArray.push(value);
            count++;
            value.then((resolved) => onDone(key, resolved), (rejected) => onDone(key, undefined, rejected, true));
            return;
        }
        onDone(key, value);
    });
    if (!count) {
        defer.resolve(result);
    }
    return defer.promise;
}
const all = (context, awaitables) => processAsync(awaitables, "all", context);
exports.all = all;
const race = (context, awaitables) => processAsync(awaitables, "race", context);
exports.race = race;
const allSettled = (context, awaitables) => processAsync(awaitables, "allSettled", context);
exports.allSettled = allSettled;
const delay = ({ on }, ms) => {
    const onCleanup = (0, core_1.createEmitter)();
    const cancellable = (0, core_1.createCancellable)(onCleanup.emit);
    const defer = (0, core_1.createDefer)(cancellable);
    const timer = setTimeout(() => {
        cancellable.cancel();
        defer.resolve();
    }, ms);
    onCleanup.add(() => clearTimeout(timer));
    onCleanup.add(on({ dispose: cancellable.cancel }));
    return defer.promise;
};
exports.delay = delay;
const debounce = ({ effect, findContexts, call }, ms) => {
    const existing = findContexts((x) => x.effect === effect)[0];
    // cancel existing
    existing === null || existing === void 0 ? void 0 : existing.cancel();
    return call(delay, ms);
};
exports.debounce = debounce;
const throttle = ({ data, cancel }, ms) => {
    const defer = (0, core_1.createDefer)();
    const lastTime = data.throttleExecutionTime || 0;
    const now = Date.now();
    const nextTime = lastTime + ms;
    if (now >= nextTime) {
        data.throttleExecutionTime = now;
        defer.resolve();
    }
    else {
        cancel();
    }
    return defer.promise;
};
exports.throttle = throttle;
function createWhenPredicate(effects) {
    return (e) => effects.indexOf(e.type) !== -1;
}
const when = ({ on, cubiz }, input) => {
    const onCleanup = (0, core_1.createEmitter)();
    const cancellable = (0, core_1.createCancellable)(onCleanup.emit);
    const defer = (0, core_1.createDefer)(cancellable);
    const predicate = typeof input === "function" ? input : createWhenPredicate(input);
    const listener = (e) => {
        const info = { type: e.effect, payload: e.payload };
        if (!predicate(info))
            return;
        cancellable.cancel();
        defer.resolve(info);
    };
    onCleanup.add(cubiz.on({ call: listener }));
    onCleanup.add(on({ dispose: cancellable.cancel }));
    return defer.promise;
};
exports.when = when;
const droppable = ({ effect, findContexts, cancel }) => {
    const existing = findContexts((x) => x.effect === effect)[0];
    const defer = (0, core_1.createDefer)();
    if (existing) {
        cancel();
    }
    else {
        defer.resolve();
    }
    return defer.promise;
};
exports.droppable = droppable;
const sequential = ({ effect, findContexts }) => {
    const existing = findContexts((x) => x.effect === effect)[0];
    const defer = (0, core_1.createDefer)();
    if (existing) {
        existing.on({ dispose: defer.resolve });
    }
    else {
        defer.resolve();
    }
    return defer.promise;
};
exports.sequential = sequential;
//# sourceMappingURL=effects.js.map