import { useState, useRef, useCallback } from 'react';

interface UseAudioRecorderReturn {
  isRecording: boolean;
  startRecording: (deviceId?: string) => Promise<void>;
  stopRecording: () => void;
  audioData: Uint8Array;
  timer: number;
  mediaStream: MediaStream | null;
  getDevices: () => Promise<MediaDeviceInfo[]>;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(0));
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const startRecording = useCallback(async (deviceId?: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          deviceId: deviceId ? { exact: deviceId } : undefined 
        } 
      });
      
      setMediaStream(stream);

      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.start();
      setIsRecording(true);
      startTimeRef.current = Date.now() - (timer * 1000);

      // Setup Audio Analysis
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      const updateTimer = () => {
        setTimer(Math.floor((Date.now() - startTimeRef.current) / 1000));
        
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          setAudioData(dataArray);
        }

        animationFrameRef.current = requestAnimationFrame(updateTimer);
      };
      updateTimer();

    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  }, [timer]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      cancelAnimationFrame(animationFrameRef.current);
      
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }
  }, [isRecording, mediaStream]);

  const getDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'audioinput');
    } catch (error) {
      console.error("Error listing devices:", error);
      return [];
    }
  }, []);

  return { 
    isRecording, 
    startRecording, 
    stopRecording, 
    timer, 
    audioData,
    mediaStream,
    getDevices
  };
}
