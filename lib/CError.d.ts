declare const causeSymbol: unique symbol;
declare const origStackSymbol: unique symbol;

declare class CError extends Error {
  /**
   * Chains together errors such that the first error is the root cause
   * and the last error is the result.
   * 
   * Returns the last error.
   */
  public static chain<T extends object>(cause: unknown, result: T): T;
  public static chain<T extends object>(cause: unknown, result1: object, result2: T): T;
  public static chain<T extends object>(cause: unknown, result1: object, result2: object, result3: T): T;
  public static chain<T extends object>(cause: unknown, result1: object, result2: object, result3: object, result4: T): T;
  public static chain<T extends object>(cause: unknown, result1: object, result2: object, result3: object, result4: object, result5: T): T;
  public static chain<T extends object>(cause: unknown, result1: object, result2: object, result3: object, result4: object, result5: object, result6: T): T;
  public static chain<T extends object>(cause: unknown, result1: object, result2: object, result3: object, result4: object, result5: object, result6: object, result7: T): T;
  public static chain<T extends object>(cause: unknown, result1: object, result2: object, result3: object, result4: object, result5: object, result6: object, result7: object, result8: T): T;
  public static chain<T extends object>(cause: unknown, result1: object, result2: object, result3: object, result4: object, result5: object, result6: object, result7: object, result8: object, result9: T): T;
  public static chain<T extends object>(cause: unknown, result1: object, result2: object, result3: object, result4: object, result5: object, result6: object, result7: object, result8: object, result9: object, result10: T): T;
  public static chain(cause: unknown, result1: object, ...results: object[]): object;
  
  /** @deprecated Use CError.chain() */
  public static link(cause: unknown, result1: object, ...results: object[]): object;
  
  /**
   * Creates an error with a cause.
   * 
   * Equivalent to `CError.chain(cause, new Error(message))`
   */
  public constructor(cause: unknown, message?: string);
  
  /**
   * Returns the cause of the given error (the next error in the chain).
   * 
   * Equivalent to `err[CError.causeSymbol]` or `CError.getChain(err)[1]`
   */
  public static getCause(err: unknown): unknown;
  
  /**
   * Returns the given error's chain of errors.
   * 
   * *Note:* the chain contains the given error at index 0.
   */
  public static getChain(err: unknown): unknown[];
  
  /**
   * Returns the root error of the given error's chain.
   * 
   * *Note:* If the given error does not have a cause, the given
   * error is the root and is returned.
   * 
   * Equivalent to `CError.getChain(err).pop()`
   */
  public static getRootError(err: unknown): unknown;
  
  /**
   * Returns the first error in the given error's chain that satisfies the
   * given testing function.
   * 
   * Similar to `CError.getChain(err).find(callback)` except the arguments
   * passed to `callback` differ slighty.
   */
  public static findInChain(err: unknown, callback: (err: unknown, depth: number) => unknown): unknown;
  
  /**
   * Returns the first error in the given error's chain that is an instance
   * of the given constructor.
   * 
   * Equivalent to `CError.findInChain(err, err => err instanceof constructor)`
   */
  public static getFirstInstanceOf<T>(err: unknown, constructor: new (...args: any[]) => T): T | undefined
  
  /**
   * Returns the error in the given depth in the given error's chain.
   * 
   * A depth of 0 will return the given error. 1 will return
   * the given error's cause. etc.
   * 
   * Similar to `CError.getChain(err)[depth]` except this function
   * will traverse circular references (won't throw an error).
   */
  public static getErrorAt(err: unknown, depth: number): unknown;
  
  /**
   * Returns an interator that traverses the given error's chain.
   */
  public static getChainIterator(err: unknown, checkCircular?: boolean): IterableIterator<unknown>;
  
  static readonly causeSymbol: typeof causeSymbol;
  static readonly origStackSymbol: typeof origStackSymbol;
}

export = CError;