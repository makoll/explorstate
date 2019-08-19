export const encode = (str: string) => btoa(unescape(encodeURIComponent(str)));
export const decode = (str: string) => decodeURIComponent(escape(atob(str)));
