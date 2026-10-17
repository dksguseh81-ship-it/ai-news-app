export type PoolResult<R> =
  | { ok: true; value: R }
  | { ok: false; error: unknown };

// 동시에 limit개까지만 실행하고, 한 건의 실패가 나머지를 막지 않게 결과를 개별로 돌려준다.
export async function runPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<PoolResult<R>[]> {
  const results: PoolResult<R>[] = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const i = next++;
      try {
        results[i] = { ok: true, value: await fn(items[i]) };
      } catch (error) {
        results[i] = { ok: false, error };
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
  return results;
}
