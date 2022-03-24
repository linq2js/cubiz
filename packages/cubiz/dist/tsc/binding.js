"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Provider = exports.useRepository = exports.useCubiz = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const core_1 = require("./core");
const respositoryContext = React.createContext(null);
/**
 * get current respository that provided by Provider component
 * @returns
 */
function useRepository() {
    return React.useContext(respositoryContext);
}
exports.useRepository = useRepository;
/**
 * a React hook to bind cubiz to current component.
 * when cubiz state is changed, the component will be rerendered
 * @param args
 * @returns
 */
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
    const repository = useRepository();
    const rerender = React.useState()[1];
    const cubiz = repository === null || repository === void 0 ? void 0 : repository.get(initFn, key);
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
    const initRef = React.useRef(props.init);
    const repository = React.useMemo(() => {
        var _a, _b;
        const result = (_a = props.repository) !== null && _a !== void 0 ? _a : (0, core_1.createRepository)();
        (_b = initRef.current) === null || _b === void 0 ? void 0 : _b.call(null, result);
        return result;
    }, [props.repository]);
    return React.createElement(respositoryContext.Provider, {
        value: repository,
        children: props.children,
    });
};
exports.Provider = Provider;
//# sourceMappingURL=binding.js.map