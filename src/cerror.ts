import {inspect}               from 'util';
import {getInfoString}         from './getInfoString';
import {getPropertyDescriptor} from './getPropertyDescriptor';

export const causeSymbol = Symbol('cause');
export const origStackSymbol = Symbol('origStack');

export class CError<T = unknown> extends Error implements IChained {
  readonly [causeSymbol]: T;
  
  /**
   * Creates an error with a cause.
   * 
   * Equivalent to `CError.chain(cause, new Error(message))`
   */
  public constructor(cause: T, message: string) {
    super(message);
    Object.defineProperty(this, 'name', {enumerable: false, value: this.constructor.name});
    
    CError.chain(cause, this);
  }
  
  /**
   * Returns the cause of the given error (the next error in the chain).
   * 
   * Equivalent to `this[CError.causeSymbol]` or `CError.getCause(this)`
   */
  public getCause() {
    return this[causeSymbol];
  }
  
  /**
   * Chains together errors such that the first error is the root cause and the last error is the
   * result.
   * 
   * Returns the last error.
   */
  public static chain<C, R extends object>(cause: C, result: R): TChain<C, R>;
  public static chain<C,R1 extends object,R2 extends object>(c:C,r1:R1,r2:R2):TChain<TChain<C,R1>,R2>;
  public static chain<C,R1 extends object,R2 extends object,R3 extends object>(c:C,r1:R1,r2:R2,r3:R3):TChain<TChain<TChain<C,R1>,R2>,R3>;
  public static chain<C,R1 extends object,R2 extends object,R3 extends object,R4 extends object>(c:C,r1:R1,r2:R2,r3:R3,r4:R4):TChain<TChain<TChain<TChain<C,R1>,R2>,R3>,R4>;
  public static chain<C,R1 extends object,R2 extends object,R3 extends object,R4 extends object,R5 extends object>(c:C,r1:R1,r2:R2,r3:R3,r4:R4,r5:R5):TChain<TChain<TChain<TChain<TChain<C,R1>,R2>,R3>,R4>,R5>;
  public static chain<C,R1 extends object,R2 extends object,R3 extends object,R4 extends object,R5 extends object,R6 extends object>(c:C,r1:R1,r2:R2,r3:R3,r4:R4,r5:R5,r6:R6):TChain<TChain<TChain<TChain<TChain<TChain<C,R1>,R2>,R3>,R4>,R5>,R6>;
  public static chain<C,R1 extends object,R2 extends object,R3 extends object,R4 extends object,R5 extends object,R6 extends object,R7 extends object>(c:C,r1:R1,r2:R2,r3:R3,r4:R4,r5:R5,r6:R6,r7:R7):TChain<TChain<TChain<TChain<TChain<TChain<TChain<C,R1>,R2>,R3>,R4>,R5>,R6>,R7>;
  public static chain<C,R1 extends object,R2 extends object,R3 extends object,R4 extends object,R5 extends object,R6 extends object,R7 extends object,R8 extends object>(c:C,r1:R1,r2:R2,r3:R3,r4:R4,r5:R5,r6:R6,r7:R7,r8:R8):TChain<TChain<TChain<TChain<TChain<TChain<TChain<TChain<C,R1>,R2>,R3>,R4>,R5>,R6>,R7>,R8>;
  public static chain<C,R1 extends object,R2 extends object,R3 extends object,R4 extends object,R5 extends object,R6 extends object,R7 extends object,R8 extends object,R9 extends object>(c:C,r1:R1,r2:R2,r3:R3,r4:R4,r5:R5,r6:R6,r7:R7,r8:R8,r9:R9):TChain<TChain<TChain<TChain<TChain<TChain<TChain<TChain<TChain<C,R1>,R2>,R3>,R4>,R5>,R6>,R7>,R8>,R9>;
  public static chain<C>(cause: C, ...results: object[]): TChain<C, object>;
  public static chain(...errs: [unknown, ...object[]]) {
    for (let i = 1; i < errs.length; ++i) {
      const cause  = errs[i-1];
      const result = errs[i];
      
      if (!CError.isChainable(result)) {
        throw new Error(`Primitive given in middle of chain at index ${i}: ${inspect(result)}`);
      }
      
      linkErrors(cause, result);
    }
    
    return errs[errs.length - 1];
  }
  
  /**
   * @deprecated Use `CError.chain()`
   */
  public static link = CError.chain; // eslint-disable-line @typescript-eslint/unbound-method
  
  /**
   * Returns if the given value can store a cause and be at the end or middle of a chain. 
   */
  public static isChainable(val: unknown): val is object {
    return val !== null && (typeof val === 'object' || typeof val === 'function');
  }
  
  /**
   * Returns the cause of the given error (the next error in the chain).
   * 
   * Equivalent to `err[causeSymbol]` or `CError.getChain(err)[1]`
   */
  static getCause<C>(err: IChained<C>): C;
  static getCause(err: unknown): unknown | undefined;
  static getCause(err: unknown): unknown | undefined {
    if (!canHoldCause(err)) {
      return;
    }
    
    return err[causeSymbol];
  }
  
  /**
   * Returns the given error's chain of errors.
   * 
   * *Note:* the chain contains the given error at index 0.
   */
  static getChain(err: unknown) {
    return Array.from(CError.getChainIterator(err, true));
  }
  
  /**
   * Returns the root error of the given error's chain.
   * 
   * *Note:* If the given error does not have a cause, the given
   * error is the root and is returned.
   * 
   * Equivalent to `CError.getChain(err).pop()`
   */
  static getRootError(err: unknown) {
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
   */
  static findInChain(err: unknown, callback: (err:unknown, depth:number) => boolean) {
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
   */
  static getFirstInstanceOf<T>(err: unknown, constructor: new (...args: any[]) => T) {
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
   */
  static getErrorAt(err: unknown, depth: number) {
    if (typeof depth !== 'number') {
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
   * @param checkCircular If an error should be thrown on circular references (true) or not (false).
   */
  static *getChainIterator(err: unknown, checkCircular = false) {
    const seen: unknown[] = [];
    
    let curErr = err;
    while(true) {
      if (checkCircular && seen.includes(curErr)) {
        throw new Error('Circular reference in error chain.');
      }
      
      yield curErr;
      
      if (!canHoldCause(curErr)) {
        break;
      }
      
      if (checkCircular) {
        seen.push(curErr);
      }
      
      curErr = curErr[causeSymbol];
    }
  }
}


function linkErrors<C, R>(cause: C, result: R): TChain<C, R> {
  if (!CError.isChainable(result)) {
    throw new Error(`result can not be a primitive: ${inspect(result)}`);
  }
  
  // set the cause
  Object.defineProperty(result, causeSymbol, {enumerable: false, value: cause});
  
  // check if the error has already been modified
  if (origStackSymbol in result) {
    return result as TChain<C, R>;
  }
  
  // copy the stack
  // the stack may be a getter so we shouldn't simply copy the value
  // instead lets copy the property description
  const stackPropDesc = getPropertyDescriptor(result, 'stack') || {value: undefined};
  stackPropDesc.enumerable = false; // ensure unenumerable
  Object.defineProperty(result, origStackSymbol, stackPropDesc);
  
  // create a getter for the stack
  (result as any).stack = null;
  Object.defineProperty(result, 'stack', {
    get: function get() {
      const cause = this[causeSymbol];
      let stack = '';
      
      // start with the result
      if (this instanceof Error) {
        stack += (this as any)[origStackSymbol];
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
  
  return result as TChain<C, R>;
}

function canHoldCause<T>(val: T) : val is TChain<unknown, T> {
  return (
    typeof val === 'object' &&
    val &&
    causeSymbol in val
  );
}

export type TChain<C,R> = R & IChained<C>;
export interface IChained<C = unknown> {
  readonly [causeSymbol]: C;
}

export default CError;