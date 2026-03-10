/** Creates a headers object with a Bearer authorization token. */
export function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` }
}
