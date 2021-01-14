import {inspect} from 'util';

export function getInfoString(val: unknown) {
  const type = typeof val;
  
  const constructorName = (
    type !== 'undefined' &&
    val !== null &&
    (val as object).constructor?.name
  ) || null;
  
  const valStr = inspect(val, {getters: false});
  
  return `(type: ${type}${constructorName? `, constructor: ${constructorName}` : ''}) ${valStr}`;
}
