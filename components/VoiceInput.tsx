"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Square, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceInputProps {
  onTranscript: (transcript: string) => void;
  placeholder?: string;
  className?: string;
}

type RecordingState = "idle" | "recording" | "processing";

export default function VoiceInput({
  onTranscript,
  placeholder = "Press the mic and speak your request...",
  className,
}: VoiceInputProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const stopAudioLevelMonitor = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscript("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Audio level monitoring
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const monitorLevel = () => {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setAudioLevel(avg);
        animFrameRef.current = requestAnimationFrame(monitorLevel);
      };
      monitorLevel();

      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        stopAudioLevelMonitor();
        stream.getTracks().forEach((t) => t.stop());
        setState("processing");

        // Use Web Speech API if available (client-side), else show placeholder
        if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
          // Already handled via recognition below
        }

        // Simulate transcription (replace with real Whisper API call if needed)
        await new Promise((r) => setTimeout(r, 800));
        const mockTranscript =
          "I would like a deep conditioning treatment with a trim and styling";
        setTranscript(mockTranscript);
        onTranscript(mockTranscript);
        setState("idle");
      };

      mr.start(200);
      setState("recording");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not access microphone. Please allow microphone permissions."
      );
      setState("idle");
    }
  }, [onTranscript, stopAudioLevelMonitor]);

  // Try Web Speech API for real-time transcription
  const startSpeechRecognition = useCallback(() => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: typeof window.speechSynthesis; webkitSpeechRecognition?: typeof window.speechSynthesis }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: typeof window.speechSynthesis }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      startRecording();
      return;
    }

    // Use Web Speech API for live transcript
    const recognition = new ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    setState("recording");
    setError(null);
    setTranscript("");

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setTranscript(final || interim);
      if (final) {
        onTranscript(final);
      }
    };

    recognition.onerror = (event: any) => {
      setError(`Speech recognition error: ${event.error}`);
      setState("idle");
    };

    recognition.onend = () => {
      setState("idle");
    };

    recognition.start();
  }, [startRecording, onTranscript]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const handleToggle = () => {
    if (state === "idle") {
      startSpeechRecognition();
    } else if (state === "recording") {
      stopRecording();
      setState("idle");
    }
  };

  const barCount = 5;
  const bars = Array.from({ length: barCount });

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col items-center gap-4 p-6 bg-midnight-900 border border-midnight-700 rounded-xl">
        {/* Visualizer */}
        <div className="flex items-end gap-1 h-12">
          {bars.map((_, i) => {
            const delay = i * 0.1;
            const height =
              state === "recording"
                ? Math.max(
                    8,
                    (audioLevel / 255) * 48 * (0.5 + Math.sin(Date.now() / 200 + i) * 0.5)
                  )
                : 8;
            return (
              <div
                key={i}
                className={cn(
                  "w-2 rounded-full transition-all duration-100",
                  state === "recording" ? "bg-gold-400" : "bg-midnight-700"
                )}
                style={{
                  height: `${height}px`,
                  transitionDelay: `${delay}s`,
                }}
              />
            );
          })}
        </div>

        {/* Record button */}
        <button
          onClick={handleToggle}
          disabled={state === "processing"}
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 border-2",
            state === "recording"
              ? "bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30 animate-pulse"
              : state === "processing"
              ? "bg-midnight-800 border-midnight-600 text-midnight-500 cursor-not-allowed"
              : "bg-midnight-800 border-gold-500 text-gold-400 hover:bg-midnight-700 hover:border-gold-400"
          )}
        >
          {state === "processing" ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : state === "recording" ? (
            <Square className="w-6 h-6" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </button>

        {/* Status text */}
        <p className="text-sm text-midnight-400">
          {state === "recording"
            ? "Listening... Click to stop"
            : state === "processing"
            ? "Processing your voice..."
            : placeholder}
        </p>
      </div>

      {/* Transcript display */}
      {transcript && (
        <div className="p-4 bg-midnight-800 border border-midnight-700 rounded-lg">
          <p className="text-xs text-midnight-500 mb-1 uppercase tracking-wider">
            Transcript
          </p>
          <p className="text-white text-sm italic">"{transcript}"</p>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="p-3 bg-red-950/50 border border-red-800 rounded-lg">
          <p className="text-red-400 text-sm flex items-center gap-2">
            <MicOff className="w-4 h-4 flex-shrink-0" />
            {error}
          </p>
        </div>
      )}
    </div>
  );
}
