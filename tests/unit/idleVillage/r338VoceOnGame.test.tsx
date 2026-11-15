/**
 * R-338 (2026-11-14) — «in /game nn c'è il componente Voce, dovrebbe esserci…
 * averlo sempre presente e fare apparire la bandiera solo quando ha qualcosa da dire».
 *
 * The Director's contract for the narrator on /game:
 *   - the BUST is always mounted (persistent piece, blueprint B1 'voce' slot);
 *   - the plaque (bandiera) exists only while a message is current — no feed → bust alone;
 *   - a new message while the plaque is open REPLACES the text (exit+enter, never a queue);
 *   - dismiss folds the plaque; clicking the bust reopens it while the message is still current;
 *   - the feed is the events ledger's own nextEventModel (alarm/quiet/none).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HudRealVoce } from '@/ui/idleVillage/hudReal/HudRealVoce';
import { voceMessageFor } from '@/ui/idleVillage/hudReal/voceFeed';
import { nextEventModel } from '@/ui/idleVillage/components/gameFrame/nextEvent';
import { placeHudBlueprint } from '@/ui/idleVillage/hudReal/layout/gameHudPlacement';
import { M } from '@/ui/idleVillage/hudReal/layout/hudLayoutB';
import type { HudEvent } from '@/ui/idleVillage/components/gameFrame/HudEventLedger';

const LABELS = { expand: 'Leggi tutto', collapse: 'Riduci', dismiss: 'Chiudi', bust: 'La voce' };
const plaque = () => document.querySelector('[data-hr-voce-plaque]');

const t = (key: string, opts?: Record<string, unknown>) => (opts ? `${key}|${JSON.stringify(opts)}` : key);

const ev = (over: Partial<HudEvent> = {}): HudEvent => ({ id: 'invasion', typeId: 'threat', title: 'L\u2019orda', daysLeft: 2, ...over });

beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] }));
afterEach(() => vi.useRealTimers());
const settle = (ms = 300) => act(() => { vi.advanceTimersByTime(ms); });

describe('R-338 — voceMessageFor: the feed speaks only inside the next-event window', () => {
  it('none → no message (the bandiera stays folded)', () => {
    expect(voceMessageFor(nextEventModel([]), t)).toBeNull();
    expect(voceMessageFor(nextEventModel([ev({ daysLeft: 30 })]), t)).toBeNull(); // outside the 10-day window
    expect(voceMessageFor(nextEventModel([ev({ arriving: true })]), t)).toBeNull();
  });
  it('quiet → type title + quiet line with the day phrase; daysLeft 0 reads "today"', () => {
    const msg = voceMessageFor(nextEventModel([ev({ typeId: 'quest', daysLeft: 6 })]), t)!;
    expect(msg.id).toBe('voce:invasion');
    expect(msg.title).toContain('gameFrame.events.types.quest');
    expect(msg.text).toContain('gameFrame.voce.line.quiet');
    const today = voceMessageFor(nextEventModel([ev({ daysLeft: 0 })]), t)!;
    expect(today.text).toContain('gameFrame.voce.when.today');
  });
  it('a threat within the alarm window → the alarm line', () => {
    const msg = voceMessageFor(nextEventModel([ev({ daysLeft: 3 })]), t)!;
    expect(msg.text).toContain('gameFrame.voce.line.alarm');
  });
});

describe('R-338 — HudRealVoce: bust persistente, bandiera solo a messaggio', () => {
  it('renders the bust alone when the feed is silent — no plaque, no dead affordance', () => {
    render(<HudRealVoce labels={LABELS}>{null}</HudRealVoce>);
    expect(document.querySelector('[data-hr-voce-bust]')).toBeInTheDocument();
    expect(plaque()).toBeNull();
    fireEvent.click(document.querySelector('[data-hr-voce-bust]')!);
    settle();
    expect(plaque()).toBeNull();
  });

  it('opens the plaque when a message arrives; folds it when the feed goes silent', () => {
    const { rerender } = render(<HudRealVoce labels={LABELS}>{null}</HudRealVoce>);
    rerender(<HudRealVoce title="MINACCIA" messageKey="voce:a" labels={LABELS}>Arriva l'orda — tra 2 giorni.</HudRealVoce>);
    settle();
    expect(plaque()).toBeInTheDocument();
    expect(screen.getByText("Arriva l'orda — tra 2 giorni.")).toBeInTheDocument();
    rerender(<HudRealVoce labels={LABELS}>{null}</HudRealVoce>);
    settle();
    expect(plaque()).toBeNull();
    expect(document.querySelector('[data-hr-voce-bust]')).toBeInTheDocument();
  });

  it('a new messageKey while open replaces the text after the leave pass — never a second plaque', () => {
    const { rerender } = render(<HudRealVoce title="A" messageKey="voce:a" labels={LABELS}>testo A</HudRealVoce>);
    rerender(<HudRealVoce title="B" messageKey="voce:b" labels={LABELS}>testo B</HudRealVoce>);
    expect(screen.getByText('testo A')).toBeInTheDocument(); // exit pass still holds the old text
    settle(300);
    expect(screen.getByText('testo B')).toBeInTheDocument();
    expect(screen.queryByText('testo A')).toBeNull();
    expect(document.querySelectorAll('[data-hr-voce-plaque]')).toHaveLength(1);
  });

  it('dismiss folds the plaque; the bust reopens the still-current message', () => {
    const onDismiss = vi.fn(); const onReopen = vi.fn();
    render(<HudRealVoce title="A" messageKey="voce:a" labels={LABELS} onDismiss={onDismiss} onReopen={onReopen}>testo A</HudRealVoce>);
    fireEvent.click(document.querySelector('[data-hr-voce-close]')!);
    settle(300);
    expect(plaque()).toBeNull();
    expect(onDismiss).toHaveBeenCalled();
    fireEvent.click(document.querySelector('[data-hr-voce-bust]')!);
    settle();
    expect(plaque()).toBeInTheDocument();
    expect(screen.getByText('testo A')).toBeInTheDocument();
    expect(onReopen).toHaveBeenCalled();
  });

  it('the mount-with-message path is unchanged (lab contract): plaque open at once', () => {
    render(<HudRealVoce title="X" labels={LABELS}>testo</HudRealVoce>);
    expect(plaque()).toBeInTheDocument();
    expect(screen.getByText('testo')).toBeInTheDocument();
  });
});

describe('R-338 — placeHudBlueprint exposes the signed voce slot (B1, bottom-left)', () => {
  it('places the 440-wide piece on the blueprint margin, bottom 6px from the edge', () => {
    const p = placeHudBlueprint(1440, 900, 1);
    expect(p.voce).toBeDefined();
    expect(p.voce!.left).toBeCloseTo(M, 3);
    expect(p.voce!.top + 230.56 * p.voce!.scale).toBeCloseTo(900 - 6, 3);
    expect(p.voce!.scale).toBeCloseTo(360 / 440, 3);
    expect(p.voce!.left + 440 * p.voce!.scale).toBeLessThanOrEqual(p.nav.left); // clear of the nav dock
  });
});
