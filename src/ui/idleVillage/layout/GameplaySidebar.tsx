import { useMemo } from 'react';
import type { JSX } from 'react';
import type { MinimalResident } from '../types/gameplayTypes';

export interface SidebarEventLogEntry {
  id: string;
  timestamp: string;
  message: string;
  severity?: 'info' | 'warn' | 'error';
}

export interface GameplaySidebarProps {
  residents: MinimalResident[];
  eventLog: SidebarEventLogEntry[];
}

const severityAccent: Record<string, string> = {
  info: 'var(--slot-helper-color, rgba(255,255,255,0.55))',
  warn: 'var(--accent-color, #f59e0b)',
  error: 'var(--color-crimson, #ef4444)',
};

function ResidentCard({ resident }: { resident: MinimalResident }) {
  const fatigue = Math.min(Math.max(resident.fatigue, 0), 100);
  const statusBadges: { label: string; tone: string }[] = [];
  if (resident.isWorking) statusBadges.push({ label: 'Working', tone: 'var(--accent-color, #f59e0b)' });
  if (resident.isInjured) statusBadges.push({ label: 'Injured', tone: 'var(--color-crimson, #ef4444)' });
  if (fatigue >= 70) statusBadges.push({ label: 'Fatigued', tone: 'var(--slot-ring-active, #a855f7)' });

  const statEntries = Object.entries(resident.stats).slice(0, 4);

  return (
    <article
      aria-label={`Resident ${resident.name}`}
      style={{
        border: '1px solid var(--panel-border, rgba(255,255,255,0.15))',
        borderRadius: 20,
        padding: '14px 18px',
        background: 'rgba(5,6,9,0.75)',
        boxShadow: '0 25px 45px rgba(0,0,0,0.45)',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 600,
              color: 'var(--text-primary, #f7f2d8)',
            }}
          >
            {resident.name}
          </p>
          <p
            style={{
              margin: '2px 0 0 0',
              fontSize: 12,
              color: 'var(--text-muted, rgba(226,232,240,0.6))',
            }}
          >
            Lv {resident.level}
          </p>
        </div>
        <div
          aria-label="Fatigue gauge"
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            border: '1px solid var(--panel-border, rgba(255,255,255,0.15))',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--slot-ring-active, #a855f7)',
            }}
          >
            {fatigue}%
          </div>
        </div>
      </header>

      {statusBadges.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            marginTop: 10,
          }}
        >
          {statusBadges.map((badge) => (
            <span
              key={`${resident.id}-${badge.label}`}
              style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 999,
                border: `1px solid ${badge.tone}`,
                color: badge.tone,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
              }}
            >
              {badge.label}
            </span>
          ))}
        </div>
      )}

      <dl
        style={{
          margin: '12px 0 0 0',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0,1fr))',
          gap: 8,
          fontSize: 12,
        }}
      >
        {statEntries.map(([stat, value]) => (
          <div
            key={stat}
            style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 12,
              padding: '6px 10px',
              display: 'flex',
              justifyContent: 'space-between',
              color: 'var(--text-primary, #f7f2d8)',
            }}
          >
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.65 }}>{stat.slice(0, 3)}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </dl>
    </article>
  );
}

function EventLog({ entries }: { entries: SidebarEventLogEntry[] }) {
  const cappedEntries = entries.slice(0, 5);

  return (
    <section aria-label="Event log" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 12,
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            color: 'var(--slot-helper-color, rgba(255,255,255,0.55))',
          }}
        >
          Event Log
        </p>
        <span
          style={{
            fontSize: 11,
            color: 'var(--text-muted, rgba(226,232,240,0.65))',
          }}
        >
          Last {cappedEntries.length} events
        </span>
      </div>

      <div
        style={{
          border: '1px solid var(--panel-border, rgba(255,255,255,0.12))',
          borderRadius: 18,
          padding: '12px 16px',
          background: 'linear-gradient(125deg, rgba(255,255,255,0.02), transparent), rgba(8,10,15,0.85)',
          minHeight: 140,
        }}
      >
        {cappedEntries.length === 0 ? (
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: 'var(--text-muted, rgba(226,232,240,0.55))',
            }}
          >
            No events recorded yet.
          </p>
        ) : (
          <ol
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {cappedEntries.map((entry) => (
              <li key={entry.id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted, rgba(226,232,240,0.55))',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                  }}
                >
                  {entry.timestamp}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    color: severityAccent[entry.severity ?? 'info'],
                  }}
                >
                  {entry.message}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

export function GameplaySidebar({ residents, eventLog }: GameplaySidebarProps): JSX.Element {
  const sortedResidents = useMemo(() =>
    [...residents].sort((a, b) => a.name.localeCompare(b.name, 'en')), [residents]);

  return (
    <div
      style={{
        padding: '18px 20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        height: '100%',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
              color: 'var(--slot-helper-color, rgba(255,255,255,0.55))',
            }}
          >
            Residents
          </p>
          <p
            style={{
              margin: '4px 0 0 0',
              fontSize: 14,
              color: 'var(--text-primary, #f7f2d8)',
              fontWeight: 600,
            }}
          >
            {residents.length} active
          </p>
        </div>
        <span
          style={{
            fontSize: 12,
            color: 'var(--text-muted, rgba(226,232,240,0.55))',
          }}
        >
          Summary feed
        </span>
      </header>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {sortedResidents.map((resident) => (
          <ResidentCard key={resident.id} resident={resident} />
        ))}
      </div>

      <EventLog entries={eventLog} />
    </div>
  );
}

export default GameplaySidebar;
