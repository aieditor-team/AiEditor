export const defineCustomElement = (name: string, element: CustomElementConstructor) => {
    if (!window.customElements.get(name)) {
        window.customElements.define(name, element);
    }
}