export interface ILogger {
  log(message: string): void
  error:(message: string, e :unknown) => void
}

export const defaultLogger: ILogger = {
  log: (message: string) => {
    console.log('VIM Ultra: ' + message)
  },
  error: (message: string, e: unknown) => {
    console.error('VIM Ultra: ' + message, e)
  }
}

export function createLogger (onMsg : (str : string) => void) {
  return {
    log: (str: string) => {
      defaultLogger.log(str)
      onMsg(str)
    },
    error: (str: string, e: unknown) => {
      defaultLogger.error(str, e)
      onMsg(str + ' ' + (e as Error).message)
    }
  }
}
