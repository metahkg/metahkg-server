export function objectFilter(
    obj: { [key: string | number | symbol]: any },
    filter: (key: any) => boolean
) {
    return Object.keys(obj).reduce((acc, key) => {
        if (filter(key)) {
            acc[key] = obj[key];
        }
        return acc;
    }, {} as { [key: string | number | symbol]: any });
}
