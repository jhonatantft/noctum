import { useState, useCallback } from 'react';
import { TranscriptItem } from './useTranscription';

export interface Meeting {
  id: number;
  title: string;
  date: string;
  duration: number;
  summary?: string;
}

export function useMeetingPersistence() {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveMeeting = useCallback(async (
    title: string,
    _duration: number,
    transcript: TranscriptItem[]
  ) => {
    setIsSaving(true);
    setError(null);

    try {
      // Create meeting record
      const meetingId = await window.ipcRenderer.invoke('create-meeting', title);

      // Save transcript items
      for (const item of transcript) {
        await window.ipcRenderer.invoke('add-transcript', {
          meetingId,
          speaker: item.speaker,
          text: item.text,
          timestamp: Date.now()
        });
      }

      setIsSaving(false);
      return meetingId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save meeting');
      setIsSaving(false);
      throw err;
    }
  }, []);

  const getMeetings = useCallback(async (): Promise<Meeting[]> => {
    try {
      return await window.ipcRenderer.invoke('get-meetings');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load meetings');
      return [];
    }
  }, []);

  const getMeetingDetails = useCallback(async (id: number) => {
    try {
      return await window.ipcRenderer.invoke('get-meeting-details', id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load meeting details');
      return null;
    }
  }, []);

  return {
    saveMeeting,
    getMeetings,
    getMeetingDetails,
    isSaving,
    error
  };
}
