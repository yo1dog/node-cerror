export function getPropertyDescriptor(target: object, propertyKey: PropertyKey) {
  let curTarget: object | null = target;
  do {
    const desc = Reflect.getOwnPropertyDescriptor(curTarget, propertyKey);
    if (desc) {
      return desc;
    }
    
    curTarget = Reflect.getPrototypeOf(curTarget);
  }
  while (curTarget);
}
