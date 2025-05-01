export interface VideoFrameHeader {
  timestamp: number
  duration: number
  frameType: number
  dataLength: number
}

export interface VideoFrameMessage {
  header: VideoFrameHeader
  dataBuffer: ArrayBuffer
}

export const HEADER_SIZE = 16

export function readHeader (buffer: ArrayBuffer): VideoFrameHeader {
  const headerView = new DataView(buffer)

  return {
    timestamp: headerView.getInt32(0, true),
    duration: headerView.getInt32(4, true),
    frameType: headerView.getInt32(8, true),
    dataLength: headerView.getInt32(12, true)
  }
}

export async function readBlob (blob: Blob): Promise<VideoFrameMessage> {
  const headerBytes = blob.slice(0, HEADER_SIZE)
  const buffer = await headerBytes.arrayBuffer()
  const header = readHeader(buffer)

  const data = blob.slice(HEADER_SIZE)
  const dataBuffer = await data.arrayBuffer()

  return { header, dataBuffer }
}
