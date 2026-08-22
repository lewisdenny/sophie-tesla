import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const audioDirectory = join(root, "audio");
const sampleRate = 44_100;

const presets = [
  {
    file: "ludicrous-blast.wav",
    seed: 11,
    duration: 1.18,
    startPitch: 105,
    endPitch: 45,
    wobbleRate: 18,
    wobbleDepth: 22,
    pulseRate: 8,
    tone: 0.42,
    noise: 0.8,
    drive: 2.6,
    pops: [0.12, 0.38, 0.67],
  },
  {
    file: "falcon-heavy.wav",
    seed: 22,
    duration: 1.82,
    startPitch: 72,
    endPitch: 31,
    wobbleRate: 8,
    wobbleDepth: 10,
    pulseRate: 4.5,
    tone: 0.56,
    noise: 0.66,
    drive: 2.9,
    pops: [0.16, 0.52, 0.88, 1.2],
  },
  {
    file: "plaid-poot.wav",
    seed: 33,
    duration: 0.92,
    startPitch: 158,
    endPitch: 84,
    wobbleRate: 25,
    wobbleDepth: 31,
    pulseRate: 13,
    tone: 0.62,
    noise: 0.56,
    drive: 2.1,
    pops: [0.08, 0.28, 0.5],
  },
  {
    file: "cyber-rumble.wav",
    seed: 44,
    duration: 1.48,
    startPitch: 54,
    endPitch: 38,
    wobbleRate: 13,
    wobbleDepth: 7,
    pulseRate: 6,
    tone: 0.38,
    noise: 0.92,
    drive: 3.4,
    pops: [0.1, 0.36, 0.64, 0.93],
  },
  {
    file: "supercharged.wav",
    seed: 55,
    duration: 1.26,
    startPitch: 88,
    endPitch: 118,
    wobbleRate: 31,
    wobbleDepth: 18,
    pulseRate: 15,
    tone: 0.5,
    noise: 0.72,
    drive: 2.5,
    pops: [0.1, 0.25, 0.42, 0.62, 0.84],
  },
  {
    file: "short-shorts.wav",
    seed: 66,
    duration: 0.58,
    startPitch: 144,
    endPitch: 71,
    wobbleRate: 22,
    wobbleDepth: 24,
    pulseRate: 10,
    tone: 0.54,
    noise: 0.64,
    drive: 2.25,
    pops: [0.07, 0.27],
  },
];

function seededRandom(seed) {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function createSound(preset) {
  const length = Math.floor(sampleRate * preset.duration);
  const samples = new Float64Array(length);
  const random = seededRandom(preset.seed);
  let phase = 0;
  let brownNoise = 0;
  let filteredNoise = 0;

  for (let index = 0; index < length; index += 1) {
    const time = index / sampleRate;
    const progress = time / preset.duration;
    const edgeEnvelope = Math.min(1, time / 0.025) * Math.pow(1 - progress, 0.68);
    const pulse = 0.48 + 0.52 * Math.pow(Math.max(0, Math.sin(Math.PI * time * preset.pulseRate)), 0.45);
    const pitch = preset.startPitch
      + (preset.endPitch - preset.startPitch) * Math.pow(progress, 0.72)
      + Math.sin(Math.PI * 2 * preset.wobbleRate * time) * preset.wobbleDepth;

    phase += Math.PI * 2 * Math.max(20, pitch) / sampleRate;

    const whiteNoise = random() * 2 - 1;
    brownNoise = brownNoise * 0.986 + whiteNoise * 0.105;
    filteredNoise += 0.17 * (brownNoise - filteredNoise);

    const body = Math.sin(phase)
      + 0.38 * Math.sin(phase * 2.01 + 0.5)
      + 0.14 * Math.sin(phase * 0.51);
    let popLayer = 0;

    for (const popTime of preset.pops) {
      const offset = time - popTime;
      const popEnvelope = Math.exp(-Math.abs(offset) * 58);
      popLayer += popEnvelope * Math.sin(Math.PI * 2 * (pitch * 0.72) * offset);
    }

    const mixed = (
      body * preset.tone
      + filteredNoise * preset.noise
      + popLayer * 0.72
    ) * edgeEnvelope * pulse;

    samples[index] = Math.tanh(mixed * preset.drive);
  }

  let peak = 0;
  for (const sample of samples) {
    peak = Math.max(peak, Math.abs(sample));
  }

  const gain = peak === 0 ? 0 : 0.88 / peak;
  return Float64Array.from(samples, (sample) => sample * gain);
}

function encodeWave(samples) {
  const bytesPerSample = 2;
  const dataLength = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataLength);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * bytesPerSample, 28);
  buffer.writeUInt16LE(bytesPerSample, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataLength, 40);

  for (let index = 0; index < samples.length; index += 1) {
    const value = Math.max(-1, Math.min(1, samples[index]));
    buffer.writeInt16LE(Math.round(value * 32_767), 44 + index * bytesPerSample);
  }

  return buffer;
}

function insideCircle(x, y, centerX, centerY, radius) {
  return (x - centerX) ** 2 + (y - centerY) ** 2 <= radius ** 2;
}

function createFavicon() {
  const size = 32;
  const bitmapHeaderSize = 40;
  const pixelBytes = size * size * 4;
  const maskBytes = size * 4;
  const imageSize = bitmapHeaderSize + pixelBytes + maskBytes;
  const icon = Buffer.alloc(22 + imageSize);

  icon.writeUInt16LE(0, 0);
  icon.writeUInt16LE(1, 2);
  icon.writeUInt16LE(1, 4);
  icon.writeUInt8(size, 6);
  icon.writeUInt8(size, 7);
  icon.writeUInt8(0, 8);
  icon.writeUInt8(0, 9);
  icon.writeUInt16LE(1, 10);
  icon.writeUInt16LE(32, 12);
  icon.writeUInt32LE(imageSize, 14);
  icon.writeUInt32LE(22, 18);

  const header = 22;
  icon.writeUInt32LE(bitmapHeaderSize, header);
  icon.writeInt32LE(size, header + 4);
  icon.writeInt32LE(size * 2, header + 8);
  icon.writeUInt16LE(1, header + 12);
  icon.writeUInt16LE(32, header + 14);
  icon.writeUInt32LE(0, header + 16);
  icon.writeUInt32LE(pixelBytes, header + 20);

  const pixels = header + bitmapHeaderSize;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const outputY = size - y - 1;
      const offset = pixels + (outputY * size + x) * 4;
      const inBackground = insideCircle(x, y, 15.5, 15.5, 15);
      const inTrail = (y >= 14 && y <= 17 && x >= 4 && x <= 15)
        || (y >= 20 && y <= 22 && x >= 8 && x <= 16);
      const inPuff = insideCircle(x, y, 18, 16, 5)
        || insideCircle(x, y, 22, 12, 4)
        || insideCircle(x, y, 24, 18, 5);

      if (inPuff) {
        icon[offset] = 245;
        icon[offset + 1] = 245;
        icon[offset + 2] = 245;
        icon[offset + 3] = 255;
      } else if (inTrail) {
        icon[offset] = 39;
        icon[offset + 1] = 33;
        icon[offset + 2] = 232;
        icon[offset + 3] = 255;
      } else if (inBackground) {
        icon[offset] = 17;
        icon[offset + 1] = 15;
        icon[offset + 2] = 13;
        icon[offset + 3] = 255;
      }
    }
  }

  return icon;
}

mkdirSync(audioDirectory, { recursive: true });

for (const preset of presets) {
  const samples = createSound(preset);
  writeFileSync(join(audioDirectory, preset.file), encodeWave(samples));
}

writeFileSync(join(root, "favicon.ico"), createFavicon());

console.log(`Generated ${presets.length} sounds and favicon.ico`);
