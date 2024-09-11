export const getWidthUnit = (value: any) => {
    if (typeof value === "number" || !isNaN(+value)) {
        return `${value}px`
    }

    return value;
}