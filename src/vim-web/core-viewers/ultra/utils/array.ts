export function invertMap<K, V>(inputMap: Map<K, V>): Map<V, K[]> {
  const invertedMap = new Map<V, K[]>();

  inputMap.forEach((value, key) => {
    const keys = invertedMap.get(value) || [];
    keys.push(key);
    invertedMap.set(value, keys);
  });

  return invertedMap;
}


/**
 * Batches an array into smaller arrays of a specified size.
 * @param array - The array to batch.
 * @param batchSize - The size of each batch.
 * @returns An array of arrays, each containing a batch of elements.
 * @throws An error if the batch size is not a positive integer.
 */
export function batchArray<T>(array: T[], batchSize: number): T[][] {
  if (batchSize <= 0) {
    throw new Error("Batch size must be a positive integer")
  }

  const batchedArray: T[][] = []
  for (let i = 0; i < array.length; i += batchSize) {
    const batch = array.slice(i, i + batchSize)
    if (batch.length > 0) {
      batchedArray.push(batch)
    }
  }
  return batchedArray
}

/**
 * Batches two arrays simultaneously, maintaining alignment between corresponding elements.
 * @param array1 - The first array to batch.
 * @param array2 - The second array to batch.
 * @param batchSize - The size of each batch.
 * @returns An array of objects, each containing a batch from each array.
 * @throws An error if the input arrays are not of the same length.
 */
export function batchArrays<T, U>(
  array1: T[],
  array2: U[],
  batchSize: number
): [T[], U[]][] {
  if (array1.length !== array2.length) {
    throw new Error('Arrays must be of the same length')
  }

  if (batchSize <= 0) {
    throw new Error('Batch size must be a positive integer')
  }

  const batchedArrays: [T[], U[]][] = []
  for (let i = 0; i < array1.length; i += batchSize) {
    const batch1 = array1.slice(i, i + batchSize)
    const batch2 = array2.slice(i, i + batchSize)
    batchedArrays.push([ batch1, batch2 ])
  }
  return batchedArrays
}