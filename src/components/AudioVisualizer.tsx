
import { cn } from '@/lib/utils';

interface AudioVisualizerProps {
  audioData: Uint8Array;
  isRecording: boolean;
  className?: string;
}

export function AudioVisualizer({ audioData, isRecording, className }: AudioVisualizerProps) {
  // Normalize data to 0-100 range for height percentage
  const bars = Array.from(audioData).slice(0, 30).map(val => (val / 255) * 100);

  return (
    <div className={cn("flex items-end justify-center gap-[2px] h-12 w-full", className)}>
      {isRecording ? (
        bars.map((height, i) => (
          <div
            key={i}
            className="w-1.5 bg-primary rounded-t-sm transition-all duration-75 ease-in-out"
            style={{ height: `${Math.max(height, 5)}%` }}
          />
        ))
      ) : (
        // Idle state visualization
        Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="w-1.5 bg-muted rounded-t-sm h-1"
          />
        ))
      )}
    </div>
  );
}
