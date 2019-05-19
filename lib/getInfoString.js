const util = require('util');


/**
 * @param {any} val
 * @returns {string}
 */
module.exports = function getInfoString(val) {
  const type = typeof val;
  
  let constructorName = (
    type !== 'undefined' &&
    val !== null &&
    val.constructor &&
    val.constructor.name
  ) || null;
  
  const valStr = util.inspect(val, {getters: false});
  
  return `(type: ${type}${constructorName? ', constructor: ' + constructorName : ''}) ${valStr}`;
};
