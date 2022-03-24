"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Provider = exports.useResolver = exports.useCubiz = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const core_1 = require("./core");
const providerContext = React.createContext(undefined);
function useResolver() {
    return React.useContext(providerContext);
}
exports.useResolver = useResolver;
const useCubiz = (...args) => {
    const initFn = args[0];
    const selector = typeof args[1] === "function" ? args[1] : undefined;
    const options = typeof args[1] === "function" ? undefined : args[1];
    // extract main options
    const { key, track = {} } = options !== null && options !== void 0 ? options : {};
    // extract tracking options
    const { loading: trackLoading = true, change: trackChange = true } = typeof track === "boolean"
        ? { loading: false, change: false }
        : track !== null && track !== void 0 ? track : {};
    const resolver = useResolver();
    const rerender = React.useState()[1];
    const cubiz = resolver === null || resolver === void 0 ? void 0 : resolver.get(initFn, key);
    React.useEffect(() => {
        if (!cubiz)
            return;
        if (!trackChange && !trackLoading)
            return;
        function handleChange() {
            rerender({});
        }
        return cubiz.on({
            change: trackChange ? handleChange : undefined,
            loading: trackLoading ? handleChange : undefined,
        });
    }, [trackChange, trackLoading, rerender, cubiz]);
    // return a typle that contains slice of state and cubiz
    if (selector) {
        return [selector(cubiz === null || cubiz === void 0 ? void 0 : cubiz.state), cubiz];
    }
    return cubiz;
};
exports.useCubiz = useCubiz;
const Provider = (props) => {
    const initDepsRef = React.useRef(props.initDeps);
    const resolver = React.useMemo(() => {
        var _a, _b;
        const result = (_a = props.resolver) !== null && _a !== void 0 ? _a : (0, core_1.createResolver)();
        (_b = initDepsRef.current) === null || _b === void 0 ? void 0 : _b.call(null, result);
        return result;
    }, [props.resolver]);
    return React.createElement(providerContext.Provider, {
        value: resolver,
        children: props.children,
    });
};
exports.Provider = Provider;
//# sourceMappingURL=binding.js.map