export default domSelector;
declare function domSelector(): {
    define: (selection: {
        /**
         * - Name of the selection
         */
        name: string;
        /**
         * - Function that returns DOM element as the starting point of the selection or list of DOM elements
         */
        selector: Function;
        /**
         * - Function that returns DOM element or null if the element should be filtered out. Returns END symbol if the selection should be stopped
         */
        where?: Function;
        /**
         * - Direction of DOM scan if selector returns a single DOM element
         */
        direction?: "up" | "down";
        /**
         * - Function that can reshape or refine the result of selection
         */
        final?: Function;
    }) => boolean;
    remember: (name: string, domElement: HTMLElement | HTMLCollection | NodeList | Array<HTMLElement>) => void;
    run: (name: string | {
        /**
         * - Name of the selection
         */
        name: string;
        /**
         * - Function that returns DOM element as the starting point of the selection or list of DOM elements
         */
        selector: Function;
        /**
         * - Function that returns DOM element or null if the element should be filtered out. Returns END symbol if the selection should be stopped
         */
        where?: Function;
        /**
         * - Direction of DOM scan if selector returns a single DOM element
         */
        direction?: "up" | "down";
        /**
         * - Function that can reshape or refine the result of selection
         */
        final?: Function;
    }, ...args?: any[]) => any[];
    use: (name: string) => any[];
};
//# sourceMappingURL=main.d.ts.map