type ParsedWav = {
  bitsPerSample: number;
  byteRate: number;
  channels: number;
  data: Uint8Array;
  durationMs: number;
  sampleRate: number;
};

function readAscii(bytes: Uint8Array, start: number, length: number) {
  return new TextDecoder("ascii").decode(bytes.slice(start, start + length));
}

function readUInt16LE(bytes: Uint8Array, offset: number) {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function readUInt32LE(bytes: Uint8Array, offset: number) {
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24)
  ) >>> 0;
}

function writeUInt16LE(target: Uint8Array, offset: number, value: number) {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >> 8) & 0xff;
}

function writeUInt32LE(target: Uint8Array, offset: number, value: number) {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >> 8) & 0xff;
  target[offset + 2] = (value >> 16) & 0xff;
  target[offset + 3] = (value >> 24) & 0xff;
}

export function parseWav(bytes: Uint8Array): ParsedWav {
  if (readAscii(bytes, 0, 4) !== "RIFF" || readAscii(bytes, 8, 4) !== "WAVE") {
    throw new Error("Unsupported WAV file header");
  }

  const channels = readUInt16LE(bytes, 22);
  const sampleRate = readUInt32LE(bytes, 24);
  const byteRate = readUInt32LE(bytes, 28);
  const bitsPerSample = readUInt16LE(bytes, 34);

  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const chunkId = readAscii(bytes, offset, 4);
    const chunkSize = readUInt32LE(bytes, offset + 4);
    const dataStart = offset + 8;

    if (chunkId === "data") {
      const dataEnd = dataStart + chunkSize;
      const data = bytes.slice(dataStart, dataEnd);
      return {
        bitsPerSample,
        byteRate,
        channels,
        data,
        durationMs: Math.round((data.length / byteRate) * 1000),
        sampleRate
      };
    }

    offset = dataStart + chunkSize + (chunkSize % 2);
  }

  throw new Error("WAV data chunk not found");
}

export function concatWavFiles(wavFiles: Uint8Array[]) {
  if (wavFiles.length === 0) {
    throw new Error("No WAV files to concatenate");
  }

  const parsed = wavFiles.map(parseWav);
  const first = parsed[0];

  for (const item of parsed.slice(1)) {
    if (
      item.sampleRate !== first.sampleRate ||
      item.channels !== first.channels ||
      item.bitsPerSample !== first.bitsPerSample
    ) {
      throw new Error("WAV files must share the same audio format");
    }
  }

  const totalDataLength = parsed.reduce((sum, item) => sum + item.data.length, 0);
  const output = new Uint8Array(44 + totalDataLength);

  output.set(new TextEncoder().encode("RIFF"), 0);
  writeUInt32LE(output, 4, 36 + totalDataLength);
  output.set(new TextEncoder().encode("WAVE"), 8);
  output.set(new TextEncoder().encode("fmt "), 12);
  writeUInt32LE(output, 16, 16);
  writeUInt16LE(output, 20, 1);
  writeUInt16LE(output, 22, first.channels);
  writeUInt32LE(output, 24, first.sampleRate);
  writeUInt32LE(output, 28, first.byteRate);
  writeUInt16LE(output, 32, (first.channels * first.bitsPerSample) / 8);
  writeUInt16LE(output, 34, first.bitsPerSample);
  output.set(new TextEncoder().encode("data"), 36);
  writeUInt32LE(output, 40, totalDataLength);

  let writeOffset = 44;
  for (const item of parsed) {
    output.set(item.data, writeOffset);
    writeOffset += item.data.length;
  }

  return {
    audioBytes: output,
    durationsMs: parsed.map((item) => item.durationMs)
  };
}
