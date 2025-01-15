export interface ILogger {
  log(message: string, obj?: any): void
  error:(message: string, e :unknown) => void
}



export const defaultLogger: ILogger = {
  
  log: (message: string, obj?: any) => {
    const caller = getCaller()
    const msg = `VIM Ultra : ${message}` 
    if(obj){
      console.log(msg, obj, {caller})
    } 
    else{
      console.log(msg, {caller})
    } 
  },
  error: (message: string, e: unknown) => {
    console.error('VIM Ultra ' + message, e)
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

function getCaller(): string {
  const stack = new Error().stack;
  if (!stack) return '';
  const files = stack.split('/')
  const file = files[files.length - 1]
  const clean = file.replace(/\?[^:]+/, ''); // Removes "?t=..." or similar
  return clean
}