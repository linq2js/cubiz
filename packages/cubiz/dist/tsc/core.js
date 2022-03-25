"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addHandlers = exports.createEmitterGroup = exports.createEmitter = exports.createRepository = exports.createDisposable = exports.createCancellable = exports.createDefer = exports.createContext = exports.createCubiz = void 0;
const arrayKeyedMap_1 = require("./arrayKeyedMap");
function noop() { }
function createEmitter() {
    const handlers = [];
    return {
        each(callback) {
            handlers.forEach(callback);
        },
        add(handler) {
            handlers.push(handler);
            let active = true;
            return () => {
                if (!active)
                    return;
                const index = handlers.indexOf(handler);
                if (index !== -1)
                    handlers.splice(index, 1);
            };
        },
        emit(payload) {
            for (const handler of handlers.slice(0)) {
                handler(payload);
            }
        },
        clear() {
            handlers.length = 0;
        },
    };
}
exports.createEmitter = createEmitter;
function createEmitterGroup(names) {
    const result = {};
    const emitters = [];
    names.forEach((name) => {
        const emitter = createEmitter();
        emitters.push(emitter);
        result[name] = emitter;
    });
    return Object.assign(result, {
        clear() {
            emitters.forEach((e) => e.clear());
        },
    });
}
exports.createEmitterGroup = createEmitterGroup;
function addHandlers(emitters, events) {
    const unsubscribeEmitter = createEmitter();
    let hasEvent = false;
    Object.keys(events).forEach((key) => {
        if (events[key] && emitters[key]) {
            emitters[key].add(events[key]);
            hasEvent = true;
        }
    });
    return hasEvent ? unsubscribeEmitter.emit : noop;
}
exports.addHandlers = addHandlers;
function createDisposable(callback) {
    let disposed = false;
    return {
        disposed() {
            return disposed;
        },
        dispose() {
            if (disposed)
                return;
            disposed = true;
            callback.call(this);
        },
    };
}
exports.createDisposable = createDisposable;
function createCancellable(callback, parent) {
    let cancelled = false;
    return {
        cancelled() {
            return cancelled || !!(parent === null || parent === void 0 ? void 0 : parent.cancelled());
        },
        cancel() {
            if (cancelled)
                return;
            cancelled = true;
            callback === null || callback === void 0 ? void 0 : callback.call(null, this);
        },
    };
}
exports.createCancellable = createCancellable;
function createRepository() {
    const dependencies = new Map();
    const emitters = createEmitterGroup(["change", "dispose", "loading", "call"]);
    const repo = {
        emit(event, payload) {
            emitters[event].emit(payload);
            return this;
        },
        on(events) {
            return addHandlers(emitters, events);
        },
        add(dependency, resolved, key) {
            let group = dependencies.get(dependency);
            if (!group) {
                group = new arrayKeyedMap_1.ArrayKeyedMap();
                dependencies.set(dependency, group);
            }
            group.set(key, resolved);
            return this;
        },
        remove(dependency, key) {
            var _a;
            const group = dependencies.get(dependency);
            return (_a = group === null || group === void 0 ? void 0 : group.delete(key)) !== null && _a !== void 0 ? _a : false;
        },
        get(dependency, key) {
            const group = dependencies.get(dependency);
            let resolved = group === null || group === void 0 ? void 0 : group.get(key);
            if (typeof resolved !== "undefined") {
                return resolved;
            }
            // is cubiz initFn
            if (typeof dependency === "function") {
                /* eslint-disable @typescript-eslint/no-use-before-define */
                resolved = createCubiz(dependency, { repository: this, key });
                repo.add(dependency, resolved, key);
            }
            else {
                // is factory
                resolved = dependency.create(this, key);
                repo.add(dependency, resolved, key);
            }
            return resolved;
        },
        each(callback, filter) {
            dependencies.forEach((group, key) => (!filter || filter(key)) && group.each(callback));
            return this;
        },
        call(effects) {
            const e = Array.isArray(effects) ? effects : [effects];
            repo.each((value) => {
                e.forEach((action) => {
                    value.call(action);
                });
            }, (x) => typeof x === "function");
            return this;
        },
    };
    return repo;
}
exports.createRepository = createRepository;
function createDefer(props) {
    let resolve, reject;
    const promise = Object.assign(new Promise((...args) => ([resolve, reject] = args)), props);
    promise.catch(noop);
    return {
        promise,
        resolve(value) {
            resolve === null || resolve === void 0 ? void 0 : resolve.call(null, value);
        },
        reject(reason) {
            reject === null || reject === void 0 ? void 0 : reject.call(null, reason);
        },
    };
}
exports.createDefer = createDefer;
function createContext(cubiz, effect, allContexts, setState, getData) {
    const emitters = createEmitterGroup(["dispose", "cancel"]);
    let data;
    const context = Object.assign(Object.assign(Object.assign({ get effect() {
            return effect;
        },
        get cubiz() {
            return cubiz;
        },
        get data() {
            return data !== null && data !== void 0 ? data : (data = getData());
        },
        findContexts(predicate) {
            return allContexts.filter((x) => x !== context && (!predicate || predicate(x)));
        },
        state(arg) {
            // getter
            if (!arguments.length) {
                return cubiz.state;
            }
            // do nothing if context is cancelled
            if (context.cancelled())
                return;
            // reducer
            if (typeof arg === "function") {
                setState(arg(cubiz.state));
                return;
            }
            // setter
            setState(arg);
        },
        on(events) {
            return addHandlers(emitters, events);
        },
        call(effect, ...payload) {
            return callEffect(context, effect, payload);
        },
        spawn(effect, ...payload) {
            return cubiz.call(effect, ...payload);
        } }, createCancellable(() => {
        emitters.cancel.emit();
    })), createDisposable(() => {
        emitters.dispose.emit();
    })), { use: cubiz.repository.get });
    return context;
}
exports.createContext = createContext;
function callEffect(context, effect, payload, onDone = noop, onCancel = noop) {
    try {
        const result = effect(context, ...payload);
        // async result
        if (typeof (result === null || result === void 0 ? void 0 : result.then) === "function") {
            const defer = createDefer();
            result.then((value) => {
                if (context.cancelled())
                    return;
                onDone();
                defer.resolve(value);
            }, (reason) => {
                if (context.cancelled())
                    return;
                onDone(reason);
                defer.reject(reason);
            });
            return Object.assign(defer.promise, {
                cancelled: context.cancelled,
                cancel() {
                    var _a;
                    (_a = result.cancel) === null || _a === void 0 ? void 0 : _a.call();
                    onCancel();
                },
            });
        }
        onDone();
        // sync result
        return result;
    }
    catch (e) {
        onDone(e);
        throw e;
    }
}
function createCubiz(type, { key, repository: repository = createRepository() } = {}) {
    const emitters = createEmitterGroup(["change", "dispose", "loading", "call"]);
    const allContexts = [];
    const effectData = new Map();
    const data = {};
    let state;
    let error;
    let loading = false;
    function emitChange() {
        const e = { cubiz };
        emitters.change.emit(e);
        repository.emit("change", e);
    }
    function emitDispose() {
        emitters.dispose.emit();
    }
    function emitLoading() {
        const e = { cubiz };
        emitters.loading.emit(e);
        repository.emit("loading", e);
    }
    function emitCall(effect, payload) {
        // skip no name function
        if (!effect.name)
            return;
        const e = { cubiz, effect, payload };
        emitters.call.emit(e);
        repository.emit("call", e);
    }
    function setState(next) {
        if (next === state)
            return;
        state = next;
        emitChange();
    }
    function uploadLoadingStatus() {
        const next = !!allContexts.length;
        if (next === loading)
            return;
        loading = next;
        emitLoading();
    }
    function getData(key) {
        let result = effectData.get(key);
        if (!result) {
            result = {};
            effectData.set(key, result);
        }
        return result;
    }
    const cubiz = Object.assign({ get data() {
            return data;
        },
        get type() {
            return type;
        },
        get key() {
            return key;
        },
        get repository() {
            return repository;
        },
        get error() {
            return error;
        },
        get loading() {
            return loading;
        },
        get state() {
            return state;
        },
        on(events) {
            return addHandlers(emitters, events);
        },
        call(effect, ...payload) {
            const context = createContext(cubiz, effect, allContexts, setState, () => getData(effect));
            emitCall(effect, payload);
            // the top is the latest
            allContexts.unshift(context);
            uploadLoadingStatus();
            function onDone(e) {
                if (e)
                    error = e;
                // remove the context
                const index = allContexts.indexOf(context);
                if (index !== -1)
                    allContexts.splice(index, 1);
                context.dispose();
                uploadLoadingStatus();
            }
            context.on({ cancel: onDone });
            return callEffect(context, effect, payload, onDone, context.cancel);
        } }, createDisposable(emitDispose));
    // repository events
    cubiz.call(type);
    return cubiz;
}
exports.createCubiz = createCubiz;
//# sourceMappingURL=core.js.map