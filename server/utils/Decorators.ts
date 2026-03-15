import { logger } from "./Logger";

/**
 * Method Decorators - Add logging, timing, and error handling to methods
 */

/**
 * @Log - Automatically logs method execution
 */
export function Log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    logger.info(`Executing: ${propertyKey}`, { args: JSON.stringify(args).slice(0, 100) });
    try {
      const result = await originalMethod.apply(this, args);
      logger.info(`Completed: ${propertyKey}`);
      return result;
    } catch (error) {
      logger.error(`Failed: ${propertyKey}`, error);
      throw error;
    }
  };

  return descriptor;
}

/**
 * @Timing - Automatically measures and logs method execution time
 */
export function Timing(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const start = Date.now();
    try {
      const result = await originalMethod.apply(this, args);
      const duration = Date.now() - start;
      if (duration > 100) {
        logger.warn(`Slow method: ${propertyKey} took ${duration}ms`);
      }
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error(`Method failed: ${propertyKey} (${duration}ms)`, error);
      throw error;
    }
  };

  return descriptor;
}

/**
 * @Validate - Decorator for input validation
 */
export function Validate(validator: (args: any[]) => void) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        validator(args);
        return await originalMethod.apply(this, args);
      } catch (error) {
        logger.error(`Validation failed: ${propertyKey}`, error);
        throw error;
      }
    };

    return descriptor;
  };
}
