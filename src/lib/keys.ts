/** `key` é uma chave própria de `obj`? (o operador `in` também aceita herdadas, como "toString" e "constructor") */
export const isKeyOf = <T extends object>(obj: T, key: string): key is Extract<keyof T, string> =>
  Object.prototype.hasOwnProperty.call(obj, key);
