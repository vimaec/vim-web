/**
 * 
 * @param value 
 * @param strict 
 * @returns 
 */
export function sanitize(value: string, strict: boolean, fallback: number) {
  // Special cases for non-strict mode
  if (!strict) {
    if (value === '' || value === '-') return value;
  }
  
  // Parse the number
  const num = parseFloat(value);
  console.log(num)
  
  // Handle invalid numbers
  if (isNaN(num)) {
    return strict ? fallback.toString() : undefined;
  }
  
  // Valid number
  return String(num);
}