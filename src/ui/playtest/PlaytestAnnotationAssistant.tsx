import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { mergeAnnotationConfig, type AnnotationAssistantConfig, type AnnotationSeverity, type AnnotationTag, type QuickNoteTemplate } from './config/annotationConfig';
import {
  getPlaytestLogger,
  type PlaytestEvent,
  type PlaytestLogger,
  type PlaytestSession,
} from './systems/playtestLogger';
import {
  buildAnnotationMarkdownReport,
  dedupe,
  formatRelativeTime,
  generateAnnotationId,
  getAutoTagsForEvent,
  type PlaytestAnnotation,
} from './PlaytestAnnotationAssistant.helpers';

export interface PlaytestAnnotationAssistantProps {
  className?: string;
  logger?: PlaytestLogger;
  config?: Partial<AnnotationAssistantConfig>;
  onExport?: (markdown: string) => void;
  onAnnotationCreate?: (annotation: PlaytestAnnotation) => void;
}

const DEFAULT_SEVERITY: AnnotationSeverity = 'issue';


export function PlaytestAnnotationAssistant({
  className = '',
  logger,
  config,
  onExport,
  onAnnotationCreate,
}: PlaytestAnnotationAssistantProps) {
  const resolvedConfig = useMemo(() => mergeAnnotationConfig(config), [config]);
  const loggerInstance = useMemo(() => logger ?? getPlaytestLogger(), [logger]);

  const [events, setEvents] = useState<PlaytestEvent[]>(() =>
    loggerInstance.getRecentEvents(resolvedConfig.timeline.maxVisibleEvents),
  );
  const [session, setSession] = useState<PlaytestSession | null>(() => loggerInstance.getCurrentSession());
  const [annotations, setAnnotations] = useState<PlaytestAnnotation[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<AnnotationSeverity>(DEFAULT_SEVERITY);
  const [noteBody, setNoteBody] = useState('');
  const [title, setTitle] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activeQuickNoteId, setActiveQuickNoteId] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => {
      setEvents(loggerInstance.getRecentEvents(resolvedConfig.timeline.maxVisibleEvents));
      setSession(loggerInstance.getCurrentSession());
    };

    refresh();
    const interval = window.setInterval(refresh, resolvedConfig.timeline.refreshIntervalMs);
    return () => window.clearInterval(interval);
  }, [loggerInstance, resolvedConfig.timeline.maxVisibleEvents, resolvedConfig.timeline.refreshIntervalMs]);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId),
    [events, selectedEventId],
  );

  const suggestedTags = useMemo(
    () => getAutoTagsForEvent(selectedEvent, resolvedConfig),
    [selectedEvent, resolvedConfig],
  );

  const handleTagToggle = useCallback((tagId: string) => {
    setSelectedTags((current) =>
      current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId],
    );
  }, []);

  const handleQuickNote = useCallback((note: QuickNoteTemplate) => {
    setTitle((current) => (current ? current : note.label));
    setNoteBody(note.template);
    setSelectedTags((current) => dedupe([...current, ...note.tags]));
    setActiveQuickNoteId(note.id);
  }, []);

  const handleSelectEvent = useCallback((eventId: string) => {
    setSelectedEventId((current) => (current === eventId ? null : eventId));
  }, []);

  const handleAddSuggestedTags = useCallback(() => {
    setSelectedTags((current) => dedupe([...current, ...suggestedTags]));
  }, [suggestedTags]);

  const handleCreateAnnotation = useCallback(() => {
    const trimmedTitle = title.trim();
    const trimmedBody = noteBody.trim();

    if (!trimmedTitle && !trimmedBody) {
      return;
    }

    const annotation: PlaytestAnnotation = {
      id: generateAnnotationId(),
      title: trimmedTitle || 'Untitled annotation',
      body: trimmedBody,
      severity: selectedSeverity,
      tags: dedupe([...selectedTags, ...suggestedTags]),
      timestamp: Date.now(),
      eventId: selectedEvent?.id,
      quickNoteId: activeQuickNoteId ?? undefined,
    };

    setAnnotations((current) => [annotation, ...current]);
    onAnnotationCreate?.(annotation);

    setTitle('');
    setNoteBody('');
    setSelectedTags([]);
    setSelectedEventId(null);
    setActiveQuickNoteId(null);
  }, [
    title,
    noteBody,
    selectedSeverity,
    selectedTags,
    suggestedTags,
    selectedEvent?.id,
    activeQuickNoteId,
    onAnnotationCreate,
  ]);

  const handleExportMarkdown = useCallback(() => {
    const markdown = buildAnnotationMarkdownReport({
      annotations,
      session,
      events,
      config: resolvedConfig,
    });

    if (onExport) {
      onExport(markdown);
      return;
    }

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `playtest-annotations-${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }, [annotations, session, events, resolvedConfig, onExport]);

  const severityOptions = Object.entries(resolvedConfig.severities);

  return (
    <section className={`playtest-annotation-assistant ${className}`.trim()}>
      <header className="paa-header">
        <div>
          <h2>Playtest Annotation Assistant</h2>
          <p>{session ? `Session ${session.id}` : 'No active session detected.'}</p>
        </div>
        <button className="paa-export" onClick={handleExportMarkdown} disabled={annotations.length === 0}>
          Export Markdown
        </button>
      </header>

      <div className="paa-grid">
        <div className="paa-column">
          <section className="paa-card">
            <h3>Quick Notes</h3>
            <div className="paa-quick-notes">
              {resolvedConfig.quickNotes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => handleQuickNote(note)}
                  className={`paa-chip ${activeQuickNoteId === note.id ? 'active' : ''}`}
                >
                  {note.label}
                </button>
              ))}
            </div>
          </section>

          <section className="paa-card">
            <h3>New Annotation</h3>
            <label className="paa-field">
              <span>Title</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Add a short title" />
            </label>
            <label className="paa-field">
              <span>Details</span>
              <textarea
                value={noteBody}
                onChange={(event) => setNoteBody(event.target.value)}
                placeholder="Write what happened, reproduction steps, expectations..."
              />
            </label>

            <div className="paa-field">
              <span>Severity</span>
              <div className="paa-severities">
                {severityOptions.map(([severity, style]) => (
                  <button
                    key={severity}
                    type="button"
                    className={`paa-chip ${selectedSeverity === severity ? 'active' : ''}`}
                    style={{ borderColor: style.color, color: style.color }}
                    onClick={() => setSelectedSeverity(severity as AnnotationSeverity)}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="paa-field">
              <span>Tags</span>
              <div className="paa-tags">
                {resolvedConfig.tags.map((tag: AnnotationTag) => (
                  <button
                    key={tag.id}
                    type="button"
                    className={`paa-chip ${selectedTags.includes(tag.id) ? 'active' : ''}`}
                    style={{ borderColor: tag.color, color: tag.color }}
                    onClick={() => handleTagToggle(tag.id)}
                  >
                    {tag.icon ? `${tag.icon} ` : ''}
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>

            {suggestedTags.length > 0 && (
              <div className="paa-field">
                <div className="paa-suggestions">
                  <span>Suggested tags:</span>
                  <div>
                    {suggestedTags.map((tag) => (
                      <span key={tag} className="paa-suggestion">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                <button type="button" className="paa-add-suggestions" onClick={handleAddSuggestedTags}>
                  Add suggested tags
                </button>
              </div>
            )}

            <button type="button" className="paa-primary" onClick={handleCreateAnnotation}>
              Save Annotation
            </button>
          </section>
        </div>

        <div className="paa-column">
          <section className="paa-card">
            <div className="paa-card-header">
              <h3>Timeline</h3>
              <span>{events.length} events</span>
            </div>
            <ul className="paa-timeline">
              {events.map((event) => (
                <li
                  key={event.id}
                  className={selectedEventId === event.id ? 'active' : ''}
                  onClick={() => handleSelectEvent(event.id)}
                >
                  <strong>{event.type}</strong>
                  <span>{formatRelativeTime(event.timestamp, session?.startTime)}</span>
                  {event.element && <span className="paa-timeline-element">{event.element}</span>}
                </li>
              ))}
            </ul>
          </section>

          <section className="paa-card">
            <div className="paa-card-header">
              <h3>Annotations</h3>
              <span>{annotations.length}</span>
            </div>
            {annotations.length === 0 ? (
              <p className="paa-empty">No annotations yet.</p>
            ) : (
              <ul className="paa-annotations">
                {annotations.map((annotation) => {
                  const severityStyle = resolvedConfig.severities[annotation.severity];
                  return (
                    <li key={annotation.id}>
                      <div className="paa-annotation-header" style={{ borderColor: severityStyle.color }}>
                        <span className="paa-annotation-severity" style={{ color: severityStyle.color }}>
                          {severityStyle.label}
                        </span>
                        <span className="paa-annotation-title">{annotation.title}</span>
                        <span className="paa-annotation-time">
                          {new Date(annotation.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p>{annotation.body || '—'}</p>
                      {annotation.tags.length > 0 && (
                        <div className="paa-annotation-tags">
                          {annotation.tags.map((tag) => (
                            <span key={tag}>#{tag}</span>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
