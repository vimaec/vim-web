
const vertexShaderSource = `
  attribute vec2 xy;
  varying highp vec2 uv;
  void main(void) {
    gl_Position = vec4(xy, 0.0, 1.0);
    // Map vertex coordinates (-1 to +1) to UV coordinates (0 to 1).
    // UV coordinates are Y-flipped relative to vertex coordinates.
    uv = vec2((1.0 + xy.x) / 2.0, (1.0 - xy.y) / 2.0);
  }
`
const fragmentShaderSource = `
  varying highp vec2 uv;
  uniform sampler2D texture;
  void main(void) {
    gl_FragColor = texture2D(texture, uv);
  }
`

export class WebGLRenderer {
  private readonly canvas: OffscreenCanvas | null = null
  private readonly ctx: WebGLRenderingContext | null = null

  constructor (canvas: OffscreenCanvas) {
    this.canvas = canvas

    const gl = (this.ctx = canvas.getContext(
      'webgl2'
    ) as WebGLRenderingContext)
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)
    if (vertexShader !== null) {
      gl.shaderSource(vertexShader, vertexShaderSource)
      gl.compileShader(vertexShader)
      if (gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS) === false) {
        throw new Error(gl.getShaderInfoLog(vertexShader) ?? 'Unknown error')
      }
    }
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    if (fragmentShader !== null) {
      gl.shaderSource(fragmentShader, fragmentShaderSource)
      gl.compileShader(fragmentShader)
      if (gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS) === false) {
        throw new Error(gl.getShaderInfoLog(fragmentShader) ?? 'Unknown error')
      }
    }
    const shaderProgram = gl.createProgram()
    if (shaderProgram === null) {
      throw new Error('Could not create program')
    }
    if (shaderProgram !== null && vertexShader !== null && fragmentShader !== null) {
      gl.attachShader(shaderProgram, vertexShader)
      gl.attachShader(shaderProgram, fragmentShader)
      gl.linkProgram(shaderProgram)
      if (gl.getProgramParameter(shaderProgram, gl.LINK_STATUS) === false) {
        throw new Error(gl.getProgramInfoLog(shaderProgram) ?? 'Unknown error')
      }
      gl.useProgram(shaderProgram)
    }
    // Vertex coordinates, clockwise from bottom-left.
    const vertexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1.0, -1.0, -1.0, +1.0, +1.0, +1.0, +1.0, -1.0]),
      gl.STATIC_DRAW
    )
    const xyLocation = gl.getAttribLocation(shaderProgram, 'xy')
    gl.vertexAttribPointer(xyLocation, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(xyLocation)
    // Create one texture to upload frames to.
    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    this.clear()
  }

  draw (frame: globalThis.VideoFrame): void {
    if (this.canvas !== null) {
      this.canvas.width = frame.displayWidth
      this.canvas.height = frame.displayHeight
    }
    const gl = this.ctx
    if (gl !== null) {
      // Upload the frame.
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        frame
      )

      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)

      // Draw the frame.
      this.clear()
      gl.drawArrays(gl.TRIANGLE_FAN, 0, 4)
    }
  }

  clear (): void {
    const gl = this.ctx
    if (gl !== null) {
      gl.clearColor(1.0, 1.0, 1.0, 1.0)
      gl.clear(gl.COLOR_BUFFER_BIT)
    }
  }
}
