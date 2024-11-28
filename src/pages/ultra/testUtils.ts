export function generateRandomIndices (count: number, maxValue: number): number[] {
  const randomIndices = new Set<number>()
  while (randomIndices.size < count) {
    randomIndices.add(Math.floor(Math.random() * maxValue))
  }
  return Array.from(randomIndices)
}
