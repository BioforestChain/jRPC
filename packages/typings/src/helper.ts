/**
 * 不能使用instanceof，会触发Proxy的getPrototypeOf
 * @param obj
 */
export const isObj = (obj: unknown): obj is object => {
  const targetType = typeof obj;
  return (targetType === "object" || targetType === "function") && obj !== null;
};
