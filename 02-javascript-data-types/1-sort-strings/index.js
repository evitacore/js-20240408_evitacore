/**
 * sortStrings - sorts array of string by two criteria "asc" or "desc"
 * @param {string[]} arr - the array of strings
 * @param {string} [param="asc"] param - the sorting type "asc" or "desc"
 * @returns {string[]}
 */
export function sortStrings(arr, param = 'asc') {
    if(param === 'desc') {
        return arr.slice().sort((a,b) => b.localeCompare(a, 'ru-RU', { caseFirst: "upper" }));
    }
        return arr.slice().sort((a,b) => a.localeCompare(b, 'ru-RU', { caseFirst: "upper" }));
}
