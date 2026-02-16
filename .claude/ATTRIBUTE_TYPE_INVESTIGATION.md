# GPU Attribute Type Investigation

## Original Question
Why are buffer attributes stored as `Uint16BufferAttribute` / `Uint32BufferAttribute` but declared as `float` in shaders?

## Answer: The Original Code Was Correct ✅

The pattern of storing as typed arrays but declaring as `float` in shaders is **intentional and correct** in WebGL 2 / GLSL 3.

### Why It Works

1. **Storage layer (CPU/GPU memory)**: `Uint16BufferAttribute` / `Uint32BufferAttribute`
   - Memory efficient
   - Correct semantic type

2. **Transfer layer (WebGL API)**: Default behavior converts to float32
   - `gl.vertexAttribPointer()` with `gl.FLOAT` type
   - Automatic conversion: uint16 → float32

3. **Shader layer (GPU)**: `in float submeshIndex`
   - Receives float32 values
   - Cast back to int: `int colorIndex = int(submeshIndex)`
   - **No precision loss** (float32 can exactly represent all integers up to 16,777,216)

### The Exception: PickingMaterial

PickingMaterial uses a different pattern for `packedId`:

```glsl
in uint packedId;  // NOT float!
```

```typescript
// No gpuType set - still sends as float
// But shader uses uintBitsToFloat() for bit-exact conversion
float packedIdFloat = uintBitsToFloat(vPackedId);
```

**Why this works**: When you declare `in uint` in GLSL, WebGL **automatically converts** the incoming float bits to uint. The `uintBitsToFloat()` reinterprets those bits back as float for bit-exact packing.

## What We Tried (And Why It Failed)

### ❌ Attempt 1: Add `gpuType = THREE.IntType` + `in uint submeshIndex`

**Problem**: Type mismatch error
```
GL_INVALID_OPERATION: Vertex shader input type does not match the type of the bound vertex attribute.
```

**Why**: `THREE.IntType` tells WebGL to use `gl.vertexAttribIPointer()` which sends **signed integers**, but shader declared `uint` (unsigned). Even if we used signed/unsigned correctly, Three.js's integer attribute support is incomplete.

### ❌ Attempt 2: Remove `gpuType`, keep `in uint submeshIndex`

**Problem**: Same type mismatch error

**Why**: Without `gpuType`, Three.js sends float data via `gl.vertexAttribPointer()` with `gl.FLOAT` type, but shader expects integer data via `gl.vertexAttribIPointer()`.

## Conclusion

The original code is **already optimal**:

- ✅ Efficient storage: Uint16/Uint32 typed arrays
- ✅ Compatible transfer: Default float conversion
- ✅ Correct shader logic: `in float` + `int()` cast
- ✅ No precision issues: float32 handles uint16 perfectly

**No changes needed!** The perceived "inconsistency" is actually the correct pattern for WebGL 2 attribute handling.

## Key Takeaway

In WebGL 2 with Three.js:
- Store attributes in typed arrays (Uint8/16/32, Int8/16/32, Float32)
- Declare as `float` in shaders (default path)
- Cast to int in shader if needed: `int(floatValue)`
- Only use integer attributes (`in uint`, `in int`) for specialized cases with explicit `gpuType`

The default float conversion path is simpler, more compatible, and has no downsides for small integers (< 16M).
