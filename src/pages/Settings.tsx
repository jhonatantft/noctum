import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Moon, Sun, Trash2, Key, Shield, Database, Mic } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

export function Settings() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [openAIKey, setOpenAIKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [aiProvider, setAiProvider] = useState<'openai' | 'anthropic' | 'gemini'>('openai');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  
  const { getDevices } = useAudioRecorder();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');

    const savedOpenAIKey = localStorage.getItem('openai_key') || '';
    const savedAnthropicKey = localStorage.getItem('anthropic_key') || '';
    const savedGeminiKey = localStorage.getItem('gemini_key') || '';
    const savedProvider = (localStorage.getItem('ai_provider') as 'openai' | 'anthropic' | 'gemini') || 'openai';
    
    setOpenAIKey(savedOpenAIKey);
    setAnthropicKey(savedAnthropicKey);
    setGeminiKey(savedGeminiKey);
    setAiProvider(savedProvider);

    const savedDevice = localStorage.getItem('audio_device_id') || '';
    setSelectedDevice(savedDevice);

    getDevices().then(setDevices);
  }, [getDevices]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const saveKeys = () => {
    localStorage.setItem('openai_key', openAIKey);
    localStorage.setItem('anthropic_key', anthropicKey);
    localStorage.setItem('gemini_key', geminiKey);
    localStorage.setItem('ai_provider', aiProvider);
    alert('AI Configuration saved!');
  };

  const saveDevice = (deviceId: string) => {
    setSelectedDevice(deviceId);
    localStorage.setItem('audio_device_id', deviceId);
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all meeting history? This cannot be undone.')) {
      console.log('Clearing data...');
      alert('Data cleared (simulated)');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your preferences and data.</p>
      </div>

      <div className="grid gap-6">
        {/* Audio Settings */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b pb-4">
            <Mic className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Audio Settings</h2>
          </div>
          <div className="space-y-2">
            <Label>Input Device</Label>
            <select 
              className="w-full p-2 border rounded bg-background"
              value={selectedDevice}
              onChange={(e) => saveDevice(e.target.value)}
            >
              <option value="">Default Microphone</option>
              {devices.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${device.deviceId.slice(0, 5)}...`}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">Select which microphone to use for recording.</p>
          </div>
        </Card>

        {/* AI Configuration Section */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b pb-4">
            <Key className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">AI Configuration</h2>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>AI Provider</Label>
              <select
                className="w-full p-2 border rounded bg-background"
                value={aiProvider}
                onChange={(e) => setAiProvider(e.target.value as 'openai' | 'anthropic')}
              >
                <option value="openai">OpenAI (GPT-3.5/4)</option>
                <option value="anthropic">Anthropic (Claude 3)</option>
                <option value="gemini">Google Gemini (2.5 Flash)</option>
              </select>
              <p className="text-xs text-muted-foreground">Choose which AI service to use for insights.</p>
            </div>

            <div className="space-y-2">
              <Label>OpenAI API Key</Label>
              <input 
                type="password" 
                className="w-full p-2 border rounded bg-background"
                placeholder="sk-..."
                value={openAIKey}
                onChange={(e) => setOpenAIKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Required if OpenAI is selected.</p>
            </div>

            <div className="space-y-2">
              <Label>Anthropic API Key</Label>
              <input 
                type="password" 
                className="w-full p-2 border rounded bg-background"
                placeholder="sk-ant-..."
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Required if Anthropic is selected.</p>
            </div>

            <div className="space-y-2">
              <Label>Gemini API Key</Label>
              <input 
                type="password" 
                className="w-full p-2 border rounded bg-background"
                placeholder="AIza..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Required if Gemini is selected.</p>
            </div>

            <Button onClick={saveKeys}>Save Configuration</Button>
          </div>
        </Card>

        {/* Appearance Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="w-5 h-5" /> Appearance
            </CardTitle>
            <CardDescription>Customize how the app looks.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Theme Mode</Label>
              <p className="text-sm text-muted-foreground">
                Switch between light and dark themes.
              </p>
            </div>
            <Button variant="outline" size="icon" onClick={toggleTheme}>
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </Button>
          </CardContent>
        </Card>

        {/* Data Management Section */}
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Shield className="w-5 h-5" /> Data Management
            </CardTitle>
            <CardDescription>Control your local data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-background/50">
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="font-medium text-sm">Clear All History</p>
                  <p className="text-xs text-muted-foreground">Delete all transcripts and recordings.</p>
                </div>
              </div>
              <Button variant="destructive" onClick={handleClearData} className="gap-2">
                <Trash2 className="w-4 h-4" /> Clear Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* About Section */}
        <Card>
          <CardHeader>
            <CardTitle>About Noctum</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Version 0.1.0 (Beta)</p>
              <p>Built with Electron, React, and TypeScript.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
