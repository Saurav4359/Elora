class PCMProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0][0];
    if (!input) return true;

    const downsampled = downsample(input, sampleRate, 16000);

    const int16 = new Int16Array(downsampled.length);
    for (let i = 0; i < downsampled.length; i++) {
      let s = Math.max(-1, Math.min(1, downsampled[i]));
      int16[i] = s * 32767;
    }

    class PCMProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0][0];
    if (!input) return true;

    const downsampled = downsample(input, sampleRate, 16000);

    const int16 = new Int16Array(downsampled.length);
    for (let i = 0; i < downsampled.length; i++) {
      let s = Math.max(-1, Math.min(1, downsampled[i]));
      int16[i] = s * 32767;
    }

    // ✅ send raw buffer (NOT base64)
    this.port.postMessage(int16.buffer);

    return true;
  }
}

registerProcessor("pcm-processor", PCMProcessor);

    return true;
  }
}

function downsample(buffer, inRate, outRate) {
  const ratio = inRate / outRate;
  const len = Math.round(buffer.length / ratio);
  const result = new Float32Array(len);

  let offset = 0;
  for (let i = 0; i < len; i++) {
    const next = Math.round((i + 1) * ratio);
    let sum = 0, count = 0;

    for (let j = offset; j < next && j < buffer.length; j++) {
      sum += buffer[j];
      count++;
    }

    result[i] = sum / count;
    offset = next;
  }

  return result;
}

function toBase64(int16) {
  const bytes = new Uint8Array(int16.buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

registerProcessor("pcm-processor", PCMProcessor);