
/**
 * Checks if the given string is a valid URL.
 * @param str - The string to check.
 * @returns True if the string is a valid URL; otherwise, false.
 */
export function isURL(str: string): boolean {
  try {
    const url = new URL(str)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch (_) {
    return false
  }
}

export function isFileURI(inputString: string | null | undefined): boolean {
  // Check if inputString is a string and not null or undefined
  if (typeof inputString !== 'string' || inputString === null) {
      return false;
  }

  // Trim whitespace from both ends of the string
  const trimmedString = inputString.trim();

  // Normalize the string for consistent comparison
  const normalizedString = trimmedString.toLowerCase();

  // Check if the string starts with 'file://'
  // This will also match file:///'
  return normalizedString.startsWith('file://');
}

export function isWebSocketUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return url.protocol === 'ws:' || url.protocol === 'wss:';
  } catch (e) {
    // If URL constructor throws, the input is not a valid URL
    return false;
  }
}

export function isLocalUrl (url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1'
  } catch (e) {
    return false
  }
}

export function isFilePathOrUri (input: string): boolean {
  // Check if it's a file URI
  const fileUriPattern = /^file:\/\//i
  if (fileUriPattern.test(input)) {
    return true
  }

  // Check if it's a URL with a common scheme
  const urlPattern = /^(https?|ftp|data|mailto|tel):/i
  if (urlPattern.test(input)) {
    return false // It's a URL, not a file path
  }

  // If none of the URL patterns match, consider it a file path
  return true
}
