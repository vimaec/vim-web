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
