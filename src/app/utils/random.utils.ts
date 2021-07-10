export class RandomUtils {
  public static randomChoice<T>(list: T[]): T {
    const index = Math.floor(Math.random() * list.length);
    return list[index];
  }
}
