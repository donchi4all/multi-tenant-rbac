import crypto from 'crypto';

export default class NumberOperations {
  public static randomIntegerInterval(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  public static randomIntegers(length: number = 6): string {
    let randInt = '';
    while(length > 0){
      randInt += crypto.randomInt(10);
      length--;
    }
    
    return randInt;
  }
}
