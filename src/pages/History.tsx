
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, FileText, ChevronRight, Search } from 'lucide-react';
import { useMeetingPersistence, Meeting } from '@/hooks/useMeetingPersistence';

export function History() {
  const { getMeetings, getMeetingDetails } = useMeetingPersistence();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [filteredMeetings, setFilteredMeetings] = useState<Meeting[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMeeting, setSelectedMeeting] = useState<any | null>(null);

  useEffect(() => {
    loadMeetings();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMeetings(meetings);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = meetings.filter(m => 
        m.title.toLowerCase().includes(query) || 
        (m.summary && m.summary.toLowerCase().includes(query))
      );
      setFilteredMeetings(filtered);
    }
  }, [searchQuery, meetings]);

  const loadMeetings = async () => {
    const data = await getMeetings();
    setMeetings(data);
    setFilteredMeetings(data);
  };

  const handleViewDetails = async (id: number) => {
    const details = await getMeetingDetails(id);
    setSelectedMeeting(details);
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = (meeting: any) => {
    const exportData = {
      title: meeting.title,
      date: meeting.date,
      duration: meeting.duration,
      summary: meeting.summary,
      transcripts: meeting.transcripts
    };
    downloadFile(JSON.stringify(exportData, null, 2), `meeting-${meeting.id}-export.json`, 'application/json');
  };

  const handleExportMarkdown = (meeting: any) => {
    const content = `# ${meeting.title}
Date: ${new Date(meeting.date).toLocaleString()}
Duration: ${formatDuration(meeting.duration)}

## Summary
${meeting.summary || "No summary available."}

## Transcript
${meeting.transcripts ? meeting.transcripts.map((t: any) => `**${t.speaker}** (${new Date(t.timestamp).toLocaleTimeString()}): ${t.text}`).join('\n\n') : "No transcript available."}
`;
    downloadFile(content, `meeting-${meeting.id}-export.md`, 'text/markdown');
  };

  const handleExportText = (meeting: any) => {
    const content = `${meeting.title}
Date: ${new Date(meeting.date).toLocaleString()}
Duration: ${formatDuration(meeting.duration)}

SUMMARY
${meeting.summary || "No summary available."}

TRANSCRIPT
${meeting.transcripts ? meeting.transcripts.map((t: any) => `[${t.speaker}] ${new Date(t.timestamp).toLocaleTimeString()}: ${t.text}`).join('\n') : "No transcript available."}
`;
    downloadFile(content, `meeting-${meeting.id}-export.txt`, 'text/plain');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} mins`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Meeting History</h2>
          <p className="text-muted-foreground mt-1">
            {selectedMeeting ? 'Viewing meeting details' : 'Manage and review your past meetings.'}
          </p>
        </div>
        {selectedMeeting && (
          <Button variant="outline" onClick={() => setSelectedMeeting(null)}>
            Back to List
          </Button>
        )}
      </div>

      {!selectedMeeting ? (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search meetings by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="grid gap-4">
            {filteredMeetings.length === 0 ? (
              <Card className="p-12 flex flex-col items-center justify-center text-center text-muted-foreground border-dashed">
                <FileText className="w-12 h-12 mb-4 opacity-20" />
                <h3 className="text-lg font-semibold mb-1">
                  {searchQuery ? 'No matching meetings found' : 'No meetings recorded yet'}
                </h3>
                <p>
                  {searchQuery ? 'Try a different search term.' : 'Start a new meeting from the dashboard to see it here.'}
                </p>
              </Card>
            ) : (
              filteredMeetings.map((meeting) => (
                <Card key={meeting.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => handleViewDetails(meeting.id)}>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{meeting.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {formatDate(meeting.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatDuration(meeting.duration)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </Button>
                </Card>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6 flex-1 overflow-hidden">
          <Card className="col-span-2 flex flex-col overflow-hidden">
            <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
              <span className="font-medium">Transcript</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExportJSON(selectedMeeting)} title="Export as JSON">
                  <span className="font-mono text-xs">JSON</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExportMarkdown(selectedMeeting)} title="Export as Markdown">
                  <FileText className="w-4 h-4 mr-1" /> MD
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExportText(selectedMeeting)} title="Export as Text">
                  <span className="font-mono text-xs">TXT</span>
                </Button>
              </div>
            </div>
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {selectedMeeting.transcripts && selectedMeeting.transcripts.length > 0 ? (
                selectedMeeting.transcripts.map((t: any, i: number) => (
                  <div key={i} className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-xs font-bold shrink-0">
                      {t.speaker.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{t.speaker}</span>
                        <span className="text-xs text-muted-foreground">{new Date(t.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-sm leading-relaxed">{t.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground italic text-center mt-10">No transcript available for this meeting.</p>
              )}
            </div>
          </Card>

          <Card className="col-span-1 p-6 space-y-6">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Duration
              </h4>
              <p className="text-2xl font-mono">{formatDuration(selectedMeeting.duration)}</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Date
              </h4>
              <p className="text-muted-foreground">{formatDate(selectedMeeting.date)}</p>
            </div>

            <div className="pt-6 border-t">
              <h4 className="font-semibold mb-2">Summary</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {selectedMeeting.summary || "No summary generated for this meeting."}
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
