import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient, LiveClient, LiveTranscriptionEvents } from '@deepgram/sdk';

interface UseTranscriptionReturn {
  transcript: TranscriptItem[];
  isListening: boolean;
  startListening: () => Promise<void>;
  stopListening: () => void;
  error: string | null;
  isModelLoading: boolean;
  loadingProgress: number;
  loadingStatus: string;
  setMediaStream: (stream: MediaStream | null) => void;
  debugLogs: string[];
}

export interface TranscriptItem {
  id: string;
  speaker: string;
  text: string;
  timestamp: string;
  isFinal: boolean;
}

export function useTranscription(): UseTranscriptionReturn {
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('Ready');
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const deepgramLive = useRef<LiveClient | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const isConnecting = useRef<boolean>(false);
  const apiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;

  const addLog = useCallback((msg: string) => {
    console.log(msg);
    setDebugLogs(prev => [...prev.slice(-19), msg]);
  }, []);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  const startListening = useCallback(async () => {
    if (isListening || isConnecting.current) {
      addLog('⚠️ Already listening or connecting, ignoring request');
      return;
    }

    if (!apiKey) {
      const msg = "Missing VITE_DEEPGRAM_API_KEY in .env";
      setError(msg);
      addLog(msg);
      return;
    }

    try {
      isConnecting.current = true;
      addLog('Starting listening...');
      setIsModelLoading(true);
      setLoadingStatus('Connecting to Deepgram...');

      // 1. Get Microphone Stream
      let stream = mediaStream;
      if (!stream) {
        addLog('Requesting user media...');
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMediaStream(stream);
      }

      // 2. Initialize Deepgram Client
      const deepgram = createClient(apiKey);
      
      // 3. Create Live Connection
      const live = deepgram.listen.live({
        model: "nova-2",
        language: "en-US",
        smart_format: true,
        diarize: true,
        keepAlive: true,
      });

      // 4. Handle Deepgram Events
      live.on(LiveTranscriptionEvents.Open, () => {
        addLog('✅ Connected to Deepgram');
        setIsModelLoading(false);
        setLoadingStatus('Listening');
        setIsListening(true);
        isConnecting.current = false;

        if (mediaRecorder.current && mediaRecorder.current.state === 'inactive') {
          addLog('Starting MediaRecorder...');
          mediaRecorder.current.start(250);
        }
      });

      live.on(LiveTranscriptionEvents.Transcript, (data) => {
        const received = data.channel.alternatives[0];
        if (received && received.transcript) {
          const text = received.transcript.trim();
          if (text) {
             // addLog(`Received: ${text.substring(0, 20)}...`);
             setTranscript(prev => {
                // If the last item is not final, replace it. Otherwise add new.
                // Deepgram sends partials (is_final=false) and then a final (is_final=true).
                const isFinal = data.is_final;
                const newItem: TranscriptItem = {
                  id: Date.now().toString() + Math.random(), // Simple ID
                  speaker: 'Speaker', // Diarization can improve this later
                  text: text,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  isFinal: isFinal
                };

                // Logic to merge partials could be improved, but for now just appending finals
                // or updating the last partial.
                // A simple approach for this demo:
                if (isFinal) {
                   return [...prev, newItem];
                } else {
                   // Optional: Show partials? For now let's just show finals to keep it clean
                   // or strictly append.
                   // Let's just append finals for simplicity in this migration step.
                   return prev;
                }
             });
             
             // If we want to show partials, we'd need a more complex state merge.
             // For this "replace everything" step, let's stick to finalized results to match previous behavior roughly.
             if (data.is_final) {
               addLog(`✅ Final: ${text}`);
             }
          }
        }
      });

      live.on(LiveTranscriptionEvents.Close, (event: any) => {
        addLog(`❌ Connection closed: ${event?.code} ${event?.reason || 'Unknown reason'}`);
        if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
          mediaRecorder.current.stop();
        }
        setIsListening(false);
        setIsModelLoading(false);
        isConnecting.current = false;
      });

      live.on(LiveTranscriptionEvents.Error, (err) => {
        console.error('Deepgram error:', err);
        addLog(`❌ Deepgram error: ${JSON.stringify(err)}`);
        setError(`Deepgram error: ${err}`);
        if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
          mediaRecorder.current.stop();
        }
        setIsListening(false);
        setIsModelLoading(false);
        isConnecting.current = false;
      });

      deepgramLive.current = live;

      // 5. Start MediaRecorder to send data
      addLog('Setting up MediaRecorder...');
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      recorder.addEventListener('dataavailable', (event) => {
        const readyState = deepgramLive.current?.getReadyState();
        if (event.data.size > 0 && readyState === 1) {
          deepgramLive.current.send(event.data);
          addLog(`✅ Sent ${event.data.size} bytes to Deepgram`);
        } else {
          // If socket is not open, we shouldn't be sending. 
          // If we are here, it means recorder is still running but socket is closed/closing.
          if (readyState !== 1) {
             addLog(`⚠️ Recorder active but WS not ready (state: ${readyState}). Stopping recorder.`);
             if (recorder.state !== 'inactive') recorder.stop();
          }
        }
      });

      recorder.addEventListener('error', (event: any) => {
        addLog(`❌ MediaRecorder error: ${event.error}`);
        console.error('MediaRecorder error:', event);
      });

      recorder.addEventListener('start', () => {
        addLog('✅ MediaRecorder started');
      });

      recorder.addEventListener('stop', () => {
        addLog('MediaRecorder stopped');
      });

      mediaRecorder.current = recorder;
      addLog('MediaRecorder initialized (waiting for connection)');

    } catch (e: any) {
      console.error('❌ Failed to start:', e);
      addLog(`❌ Failed to start: ${e.message}`);
      setError(e.message);
      setIsListening(false);
      setIsModelLoading(false);
      isConnecting.current = false;
    }
  }, [isListening, mediaStream, apiKey, addLog]);

  const stopListening = useCallback(() => {
    addLog('Stopping listening...');

    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
      mediaRecorder.current = null;
    }

    if (deepgramLive.current) {
      deepgramLive.current.finish();
      deepgramLive.current = null;
    }

    setIsListening(false);
    setLoadingStatus('Ready');
    isConnecting.current = false;
  }, [addLog]);

  return {
    transcript,
    isListening,
    startListening,
    stopListening,
    error,
    isModelLoading,
    loadingProgress: 0, // Not applicable for API
    loadingStatus,
    setMediaStream,
    debugLogs
  };
}
