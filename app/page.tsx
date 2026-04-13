'use client';

import { useRef } from 'react';
import { createSession } from '@/lib/gemini';

export default function MicReliable() {
  const sessionRef = useRef<any>(null);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const audioCtx = new AudioContext({ sampleRate: 48000 });
    await audioCtx.audioWorklet.addModule('/audio-processor.js');

    const source = audioCtx.createMediaStreamSource(stream);
    const worklet = new AudioWorkletNode(audioCtx, 'pcm-processor');

    const session = await createSession((text) => {
      console.log("FINAL:", text);
    });

    sessionRef.current = session;

  worklet.port.onmessage = (e) => {
  const buffer = e.data;
 function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;

  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}
  const base64 = arrayBufferToBase64(buffer);

  session.sendRealtimeInput({
    audio: {
      data: base64,
      mimeType: "audio/pcm;rate=16000",
    },
  });
};

    source.connect(worklet);

    console.log("🎤 Started reliable mic");
  };

  const stop = () => {
    sessionRef.current?.close();
    console.log("🛑 stopped");
  };

  return (
    <div className="p-10">
      <button onClick={start} className="bg-green-500 px-4 py-2 mr-4">
        Start Reliable Mic
      </button>

      <button onClick={stop} className="bg-red-500 px-4 py-2">
        Stop
      </button>
    </div>
  );
}