const util                  = require('util');
const ExtendableError       = require('@yo1dog/extendable-error');
const getInfoString         = require('./getInfoString');
const getPropertyDescriptor = require('./getPropertyDescriptor');


class CError extends ExtendableError {
  /**
   * Chains together errors such that the first error is the root cause
   * and the last error is the result.
   * 
   * Returns the last error.
   * 
   * @param {...Error} errs 
   * @returns {Error}
   */
  static chain(...errs) {
    for (let i = 1; i < errs.length; ++i) {
      const cause  = errs[i-1];
      const result = errs[i];
      
      if (util.isPrimitive(result)) {
        throw new Error(`Primitive given in middle of chain at index ${i}: ${util.inspect(result)}`);
      }
      
      linkErrors(cause, result);
    }
    
    return errs[errs.length - 1];
  }
  
  /**
   * Creates an error with a cause.
   * 
   * Equivalent to `CError.chain(cause, new Error(message))`
   * 
   * @param {Error} cause The error that caused this error.
   * @param {string} [message]
   */
  constructor(cause, message) {
    super(message);
    CError.chain(cause, this);
  }
  
  /**
   * Returns the cause of the given error (the next error in the chain).
   * 
   * Equivalent to `err[CError.causeSymbol]` or `CError.getChain(err)[1]`
   * 
   * @param {Error} err 
   * @returns {Error}
   */
  static getCause(err) {
    return CError.getChainIterator(err).next().next().value;
  }
  
  /**
   * Returns the given error's chain of errors.
   * 
   * *Note:* the chain contains the given error at index 0.
   * 
   * @param {Error} err 
   * @returns {Error[]}
   */
  static getChain(err) {
    return Array.from(CError.getChainIterator(err, true));
  }
  
  /**
   * Returns the root error of the given error's chain.
   * 
   * *Note:* If the given error does not have a cause, the given
   * error is the root and is returned.
   * 
   * Equivalent to `CError.getChain(err).pop()`
   * 
   * @param {Error} err 
   * @returns {Error}
   */
  static getRootError(err) {
    let rootErr;
    for (const curErr of CError.getChainIterator(err, true)) {
      rootErr = curErr;
    }
    return rootErr;
  }
  
  /**
   * Returns the first error in the given error's chain that satisfies the
   * given testing function.
   * 
   * Similar to `CError.getChain(err).find(callback)` except the arguments
   * passed to `callback` differ slighty.
   * 
   * @param {Error} err 
   * @param {(err:Error, depth:number) => boolean} callback 
   * @returns {Error}
   */
  static findInChain(err, callback) {
    let depth = 0;
    for (const curErr of CError.getChainIterator(err, true)) {
      if (callback(curErr, depth)) { // eslint-disable-line callback-return
        return curErr;
      }
      ++depth;
    }
  }
  
  /**
   * Returns the first error in the given error's chain that is an instance
   * of the given constructor.
   * 
   * Equivalent to `CError.findInChain(err, err => err instanceof constructor)`
   * 
   * @param {Error} err 
   * @param {Function} constructor 
   * @returns {Error}
   */
  static getFirstInstanceOf(err, constructor) {
    for (const curErr of CError.getChainIterator(err, true)) {
      if (curErr instanceof constructor) {
        return curErr;
      }
    }
  }
  
  /**
   * Returns the error in the given depth in the given error's chain.
   * 
   * A depth of 0 will return the given error. 1 will return
   * the given error's cause. etc.
   * 
   * Similar to `CError.getChain(err)[depth]` except this function
   * will traverse circular references (won't throw an error).
   * 
   * @param {Error} err 
   * @param {number} depth 
   * @returns {Error}
   */
  static getErrorAt(err, depth) {
    if (!util.isNumber(depth)) {
      throw new Error(`depth must be a number`);
    }
    if (depth < 0) {
      throw new Error(`depth must be >= 0`);
    }
    
    let i = 0;
    for (const curErr of CError.getChainIterator(err)) {
      if (i === depth) {
        return curErr;
      }
      ++i;
    }
  }
  
  /**
   * Returns an interator that traverses the given error's chain.
   * 
   * @param {Error} err 
   * @param {boolean} [checkCircular] If an error should be thrown on circular references (true) or not (false).
   */
  static *getChainIterator(err, checkCircular = false) {
    const seen = [];
    
    let curErr = err;
    while(true) {
      if (checkCircular && seen.includes(curErr)) {
        throw new Error('Circular reference in error chain.');
      }
      
      yield curErr;
      
      if (!curErr || !(CError.causeSymbol in curErr)) {
        break;
      }
      
      if (checkCircular) {
        seen.push(curErr);
      }
      
      curErr = curErr[CError.causeSymbol];
    }
  }
}

CError.causeSymbol = Symbol('cause');
CError.origStackSymbol = Symbol('origStack');

// depricated
CError.link = CError.chain;

module.exports = CError;


function linkErrors(cause, result) {
  if (util.isPrimitive(result)) {
    throw new Error(`result can not be a primitive: ${util.inspect(result)}`);
  }
  
  // set the cause
  ExtendableError.setUnenumerable(result, CError.causeSymbol, cause);
  
  // check if the error has already been modified
  if (CError.origStackSymbol in result) {
    return;
  }
  
  // copy the stack
  // the stack may be a getter so we shouldn't simply copy the value
  // instead lets copy the property description
  const stackPropDesc = getPropertyDescriptor(result, 'stack');
  if (stackPropDesc) {
    stackPropDesc.enumerable = false; // ensure unenumerable
    Object.defineProperty(result, CError.origStackSymbol, stackPropDesc);
  }
  else {
    ExtendableError.setUnenumerable(result, CError.origStackSymbol, undefined); // eslint-disable-line 
  }
  
  // create a getter for the stack
  result.stack = null;
  Object.defineProperty(result, 'stack', {
    get: function get() {
      const cause = this[CError.causeSymbol];
      let stack = '';
      
      // start with the result
      if (this instanceof Error) {
        stack += this[CError.origStackSymbol];
      }
      else {
        stack += getInfoString(this);
      }
      
      // add the cause
      stack += '\n\n----- Caused By -----\n\n';
      
      // the cause should be an error
      if (cause instanceof Error) {
        stack += cause.stack;
      }
      else {
        // if not then create an informative string about the cause
        stack += getInfoString(cause);
      }
      
      return stack;
    }
  });
}
