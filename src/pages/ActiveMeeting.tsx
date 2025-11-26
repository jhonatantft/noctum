import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, Square, Pause, Save, Maximize2, Sparkles, CheckCircle2, Info, BarChart3, HelpCircle, Lightbulb, ShieldAlert, MessageSquare, Zap } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useTranscription } from '@/hooks/useTranscription';
import { useMeetingPersistence } from '@/hooks/useMeetingPersistence';
import { AudioVisualizer } from '@/components/AudioVisualizer';
import { AIService, AIInsight, MeetingMode } from '@/lib/ai';
import { cn } from '@/lib/utils';

export function ActiveMeeting() {
  const { 
    isRecording, 
    startRecording, 
    stopRecording, 
    timer: duration, 
    audioData,
    mediaStream 
  } = useAudioRecorder();

  const { 
    transcript, 
    startListening, 
    stopListening, 
    error: transcriptionError,
    isModelLoading,
    loadingProgress,
    loadingStatus,
    setMediaStream,
    debugLogs
  } = useTranscription();

  const { saveMeeting, isSaving } = useMeetingPersistence();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [meetingMode, setMeetingMode] = useState<MeetingMode>('general');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [isOverlay, setIsOverlay] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastAnalyzedIndex = useRef<number>(0);

  // Sync media stream
  useEffect(() => {
    setMediaStream(mediaStream);
  }, [mediaStream, setMediaStream]);

  // Sync recording with transcription
  useEffect(() => {
    if (isRecording) {
      startListening();
    } else {
      stopListening();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);

  // AI Analysis Loop
  useEffect(() => {
    if (!isRecording || transcript.length === 0) return;

    const analyzeNewTranscript = async () => {
      // Only analyze new final segments
      const newSegments = transcript.slice(lastAnalyzedIndex.current).filter(t => t.isFinal);
      
      if (newSegments.length > 0) {
        lastAnalyzedIndex.current = transcript.length;
        const textToAnalyze = newSegments.map(t => t.text).join(' ');
        
        try {
          const newInsights = await AIService.analyzeTranscript(textToAnalyze, meetingMode); // Pass meetingMode
          if (newInsights.length > 0) {
            setInsights(prev => [...newInsights, ...prev].slice(0, 20));
          }
        } catch (e) {
          console.error("AI Analysis failed", e);
        }
      }
    };

    const interval = setInterval(analyzeNewTranscript, 5000); // Analyze every 5 seconds
    return () => clearInterval(interval);
  }, [isRecording, transcript]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'question': return <HelpCircle className="w-4 h-4 text-purple-500" />;
      case 'strategy': return <Lightbulb className="w-4 h-4 text-amber-500" />;
      case 'objection': return <ShieldAlert className="w-4 h-4 text-red-500" />;
      case 'reply': return <MessageSquare className="w-4 h-4 text-indigo-500" />;
      case 'argument': return <Zap className="w-4 h-4 text-yellow-500" />;
      default: return <Info className="w-4 h-4 text-primary" />;
    }
  };

  const handleStopRecording = useCallback(() => {
    stopRecording();
    setShowSaveDialog(true);
    setMeetingTitle(`Meeting - ${new Date().toLocaleDateString()}`);
  }, [stopRecording]);

  const handleSaveMeeting = async () => {
    if (!meetingTitle.trim()) return;
    
    try {
      await saveMeeting(meetingTitle, duration, transcript);
      setShowSaveDialog(false);
      setMeetingTitle('');
    } catch (err) {
      console.error('Failed to save meeting:', err);
    }
  };

  const handleStartRecording = useCallback(async () => {
    const deviceId = localStorage.getItem('audio_device_id') || undefined;
    await startRecording(deviceId);
  }, [startRecording]);

  const toggleOverlay = async () => {
    const newState = !isOverlay;
    setIsOverlay(newState);
    await window.ipcRenderer.invoke('toggle-overlay', newState);
  };

  // State refs for event listener
  const stateRef = useRef({ isRecording, isModelLoading });
  useEffect(() => {
    stateRef.current = { isRecording, isModelLoading };
  }, [isRecording, isModelLoading]);

  // Handle Global Shortcut
  useEffect(() => {
    const handleTriggerRecord = () => {
      const { isRecording, isModelLoading } = stateRef.current;
      if (isRecording) {
        handleStopRecording();
      } else if (!isModelLoading) {
        handleStartRecording();
      }
    };

    if (window.ipcRenderer) {
      window.ipcRenderer.on('trigger-record', handleTriggerRecord);
      return () => {
        window.ipcRenderer.off('trigger-record', handleTriggerRecord);
      };
    }
  }, [handleStartRecording, handleStopRecording]);

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Active Meeting</h1>
          <p className="text-muted-foreground mt-2">Real-time transcription and insights.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={toggleOverlay} title="Toggle Overlay Mode">
            <Maximize2 className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2 bg-muted px-3 py-1 rounded-md">
            <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="font-mono font-medium">{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Recording Status and Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            {isRecording ? (
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            ) : (
              <span className="h-3 w-3 rounded-full bg-slate-300" />
            )}
            {isRecording ? 'Recording in Progress...' : 'Ready to Record'}
          </h2>
          
          {isModelLoading && (
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs text-blue-500">
                <span>{loadingStatus}</span>
                <span>{Math.round(loadingProgress)}%</span>
              </div>
              <div className="h-1 w-full bg-blue-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300" 
                  style={{ width: `${loadingProgress}%` }} 
                />
              </div>
            </div>
          )}
          
          {transcriptionError && <p className="text-destructive text-sm mt-1">Transcription Error: {transcriptionError}</p>}
          
          {/* Debug / Test AI Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-2 text-xs text-muted-foreground"
            onClick={async () => {
              console.log("Testing AI Service...");
              try {
                const testInsights = await AIService.analyzeTranscript("We need to finish the project by Friday. John will handle the database.");
                console.log("AI Test Result:", testInsights);
                if (testInsights.length > 0) {
                  setInsights(prev => [...testInsights, ...prev]);
                  alert("AI Test Success! Check insights sidebar.");
                } else {
                  alert("AI Test returned no insights. Check console.");
                }
              } catch (e) {
                console.error("AI Test Failed:", e);
                alert("AI Test Failed. Check console.");
              }
            }}
          >
            Test AI Integration
          </Button>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="w-64">
             <AudioVisualizer audioData={audioData} isRecording={isRecording} />
          </div>

          {!isRecording ? (
            <Button 
              size="lg" 
              className="bg-red-500 hover:bg-red-600 text-white gap-2" 
              onClick={handleStartRecording}
              disabled={isModelLoading}
            >
              <Mic className="w-4 h-4" /> 
              {isModelLoading ? 'Loading Model...' : 'Start Recording'}
            </Button>
          ) : (
            <>
              <Button variant="outline" size="icon" onClick={handleStopRecording}>
                <Pause className="w-4 h-4" />
              </Button>
              <Button variant="destructive" size="lg" className="gap-2" onClick={handleStopRecording}>
                <Square className="w-4 h-4" /> Stop & Save
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-3 gap-6 overflow-hidden">
        {/* Transcript View */}
        <Card className="col-span-2 flex flex-col overflow-hidden bg-card/50 backdrop-blur">
          <div className="p-4 border-b bg-muted/30 font-medium text-sm text-muted-foreground">
            Live Transcript
          </div>
          <div className="flex-1 p-6 overflow-y-auto space-y-6" ref={scrollRef}>
            {transcript.length === 0 && !isRecording && (
              <div className="text-center text-muted-foreground mt-10 italic">
                Start recording to see live transcription...
              </div>
            )}

            {transcript.length === 0 && isRecording && (
              <div className="text-center text-blue-500 mt-10 italic animate-pulse">
                Listening... (Processing audio in 3s chunks)
              </div>
            )}
            
            {transcript.map((item) => (
              <div key={item.id} className={cn("flex gap-4", !item.isFinal && "opacity-70")}>
                <div className="h-8 w-8 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-xs font-bold shrink-0">
                  {item.speaker.substring(0, 2).toUpperCase()}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{item.speaker}</span>
                    <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                    {!item.isFinal && item.id === 'processing' && (
                      <span className="text-xs text-blue-500 italic flex items-center gap-1">
                        <span className="inline-block w-1 h-1 bg-blue-500 rounded-full animate-pulse"></span>
                        processing...
                      </span>
                    )}
                    {!item.isFinal && item.id !== 'processing' && (
                      <span className="text-xs text-blue-500 italic">speaking...</span>
                    )}
                  </div>
                  <p className={cn(
                    "text-sm leading-relaxed",
                    !item.isFinal && item.id === 'processing' && "italic text-blue-500/50 animate-pulse",
                    !item.isFinal && item.id !== 'processing' && "italic text-muted-foreground"
                  )}>
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
            
            {isRecording && (
               <div className="flex gap-4 opacity-50">
               <div className="h-8 w-8 rounded-full bg-slate-500/20 text-slate-500 flex items-center justify-center text-xs font-bold shrink-0">
                 ...
               </div>
               <div className="space-y-1 w-full">
                 <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                 <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
               </div>
             </div>
            )}
          </div>
        </Card>

        {/* Sidebar */}
      <div className="col-span-1 border-l bg-muted/30 flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b bg-background/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="font-semibold">AI Copilot</h2>
            </div>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Live</span>
          </div>
          
          <select 
            className="w-full p-2 text-sm border rounded bg-background mb-2"
            value={meetingMode}
            onChange={(e) => setMeetingMode(e.target.value as MeetingMode)}
          >
            <option value="general">General Advisor</option>
            <option value="sales">Sales Coach</option>
            <option value="pitch">Investor Pitch</option>
            <option value="interview">Interview Prep</option>
          </select>
          <p className="text-[10px] text-muted-foreground">
            {meetingMode === 'general' && "Strategic insights & smart questions."}
            {meetingMode === 'sales' && "Objection handling & closing tactics."}
            {meetingMode === 'pitch' && "Vision, confidence & investor Q&A."}
            {meetingMode === 'interview' && "STAR method & leadership cues."}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 pr-2 custom-scrollbar">
            {insights.length === 0 && (
              <div className="text-center text-muted-foreground text-sm italic mt-4 space-y-2">
                {!AIService.hasKey() ? (
                  <div className="bg-yellow-500/10 text-yellow-600 p-3 rounded-md border border-yellow-500/20">
                    <p className="font-semibold">Missing API Key</p>
                    <p className="text-xs mt-1">Please configure your API key in Settings &gt; AI Configuration.</p>
                  </div>
                ) : (
                  <p>AI is listening for facts and action items...</p>
                )}
              </div>
            )}

            {insights.map((insight) => (
              <div key={insight.id} className="p-3 rounded-lg bg-white border shadow-sm text-sm animate-in slide-in-from-right-5 fade-in duration-300">
                <div className="flex items-center gap-2 mb-1">
                  {getInsightIcon(insight.type)}
                  <span className={cn(
                    "text-xs font-bold uppercase tracking-wider",
                    insight.type === 'question' ? "text-purple-600" :
                    insight.type === 'strategy' ? "text-amber-600" : 
                    insight.type === 'objection' ? "text-red-600" :
                    insight.type === 'reply' ? "text-indigo-600" :
                    insight.type === 'argument' ? "text-yellow-600" : "text-primary"
                  )}>
                    {insight.type.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-auto">{insight.timestamp}</span>
                </div>
                <div className="text-sm text-black font-medium leading-relaxed">
                  {insight.content}
                </div>
              </div>
            ))}
          </div>
          <style>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background-color: rgba(0, 0, 0, 0.2);
              border-radius: 3px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background-color: rgba(0, 0, 0, 0.3);
            }
          `}</style>
        </div>
      </div>

      {/* Save Meeting Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold">Save Meeting</h3>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Meeting Title</label>
              <input
                type="text"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
                placeholder="Enter meeting title..."
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveMeeting} disabled={isSaving || !meetingTitle.trim()} className="gap-2">
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Meeting'}
              </Button>
            </div>
          </Card>
        </div>
      )}
      {/* Debug Info Panel */}
      <div className="border-t bg-muted/20 p-4">
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer font-medium hover:text-foreground">
            Debug Info (Worker Status: {loadingStatus})
          </summary>
          <div className="mt-2 space-y-1 font-mono max-h-40 overflow-y-auto bg-black/5 p-2 rounded">
            {debugLogs.map((log, i) => (
              <div key={i} className="whitespace-nowrap">{log}</div>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}
