/**
 * Configuration for the video decoder.
 */
export const videoDecoderConfig = {
  // codec: 'avc1.420014', // Baseline
  // codec: 'avc1.4D0014', // Main
  codec: 'avc1.580014', // Extended
  codedWidth: 1280,
  codedHeight: 720
}

let decoder

/**
 * Expects messages of the form:
 * {  type: 'init' } | { type: 'frame', timestamp: number, duration: number, frameType: number, data: ArrayBuffer }
 *
 */
onmessage = (event) => {
  const message = event.data
  if (message.type === 'init') {
    init()
  } else if (message.type === 'frame') {
    onFrame(message)
  }
}

function init () {
  log('Initializing decoder worker')
  decoder = new globalThis.VideoDecoder({
    output: (e) => { handleFrame(e) },
    error: (e) => { console.error(e.message) }
  })
  decoder.configure(videoDecoderConfig)
}

function onFrame (message) {
  const chunk = createChunk(message)
  try {
    decoder.decode(chunk)
  } catch (e) {
    console.error('Error decoding video chunk: ', e)
  }
}

function createChunk (message) {
  const init = {
    type: message.frameType === 0 ? 'key' : 'delta', // Assuming 0 for KeyFrame
    data: message.data,
    timestamp: message.timestamp,
    duration: message.duration
  }
  return new globalThis.EncodedVideoChunk(init)
}

function log (message) {
  postMessage(`[Decoder Worker] ${message}`)
}
function handleFrame (videoFrame) {
  console.log('Frame decoded', videoFrame)
  // Transfer the VideoFrame back to the main thread
  postMessage({ type: 'frame', frame: videoFrame }, [videoFrame])
}
