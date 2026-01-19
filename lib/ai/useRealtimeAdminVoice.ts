"use client";

import { useRef, useState } from "react";

type VoiceState = {
  connected: boolean;
  supported: boolean;
  error?: string;
};

export function useRealtimeAdminVoice(tone: string) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);


  const [state, setState] = useState<VoiceState>({
    connected: false,
    supported: true,
  });

  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");

  function isSupported() {
    return (
      typeof window !== "undefined" &&
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function" &&
      typeof RTCPeerConnection !== "undefined"
    );
  }

  async function start() {
    if (state.connected) return;

    if (!isSupported()) {
      setState({
        connected: false,
        supported: false,
        error: "Live voice is not supported on this browser.",
      });
      return;
    }

    try {
      setInterimTranscript("");
      setFinalTranscript("");

      const res = await fetch("/api/admin/ai/realtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tone }),
      });

      if (!res.ok) {
        throw new Error("Failed to create realtime session");
      }

      const session = await res.json();

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // 🔊 Audio output
      audioRef.current = document.createElement("audio");
      audioRef.current.autoplay = true;

      pc.ontrack = (e) => {
  if (audioRef.current) {
    audioRef.current.srcObject = e.streams[0];
  }

  // Capture final transcript from OpenAI stream
  e.streams[0].getTracks().forEach((track: any) => {
    track.onended = () => {
      if (track.label) {
        setFinalTranscript(track.label);
      }
    };
  });
};


      // 🎤 Mic input
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // 📡 Data channel (THIS IS THE MISSING PIECE)
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);

          // Partial transcript
          if (msg.type === "input_audio_buffer.speech_started") {
            setInterimTranscript("");
          }

          if (msg.type === "input_audio_buffer.transcript") {
            setInterimTranscript(msg.text || "");
          }

          // Final transcript
          if (msg.type === "input_audio_buffer.speech_stopped") {
            setFinalTranscript((prev) =>
              prev
                ? prev + " " + (interimTranscript || "")
                : interimTranscript || ""
            );
            setInterimTranscript("");
          }
        } catch {
          // ignore non-json messages
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpRes = await fetch(
        "https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.client_secret.value}`,
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        }
      );

      const answerSDP = await sdpRes.text();

      await pc.setRemoteDescription({
        type: "answer",
        sdp: answerSDP,
      });

      setState({
        connected: true,
        supported: true,
      });
    } catch (err: any) {
      console.error("Realtime voice error:", err);
      setState({
        connected: false,
        supported: true,
        error: err?.message || "Voice connection failed",
      });
    }
  }

  function stop() {
    dcRef.current?.close();
    pcRef.current?.close();

    dcRef.current = null;
    pcRef.current = null;

    setState((prev) => ({
      ...prev,
      connected: false,
    }));
  }

  return {
    start,
    stop,
    connected: state.connected,
    supported: state.supported,
    error: state.error,

    // 🔥 THIS IS WHAT YOUR UI NEEDED
    interimTranscript,
    finalTranscript,
  };
}
