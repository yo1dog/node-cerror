/**
 * @param {object} target
 * @param {PropertyKey} propertyKey
 * @returns {PropertyDescriptor}
 */
module.exports = function getPropertyDescriptor(target, propertyKey) {
  let curTarget = target;
  do {
    const desc = Reflect.getOwnPropertyDescriptor(curTarget, propertyKey);
    if (desc) {
      return desc;
    }
    
    curTarget = Reflect.getPrototypeOf(curTarget);
  }
  while (curTarget);
};