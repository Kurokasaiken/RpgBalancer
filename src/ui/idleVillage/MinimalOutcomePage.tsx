/**
 * MinimalOutcomePage — Fase 10: OutcomeModal Isolato
 *
 * Pagina di test per OutcomeModal in isolamento.
 * Mostra 4 varianti dell'esito post-skill-check:
 * - Success (ricompense complete)
 * - Injury (ricompense ridotte + stato ferito)
 * - Death (nessuna ricompensa + stato morto)
 * - Partial success (ricompense parziali)
 *
 * Spec: minimal_slice/10_outcome.md
 * Route: /minimal-outcome
 */

import React, { useState } from 'react';
import { WanderlustSurface } from '@/ui/wanderlust-surface';

// ─── Tipi locali ──────────────────────────────────────────────────────────────

type OutcomeType = 'success' | 'injury' | 'death' | 'partial';

interface OutcomeData {
  type: OutcomeType;
  questName: string;
  questIcon: string;
  residentName: string;
  residentPortrait: string;
  gold?: number;
  xp?: number;
  item?: string;
  consequence?: string;
  recoveryDays?: number;
}

// ─── Mock outcomes ─────────────────────────────────────────────────────────────

const MOCK_OUTCOMES: OutcomeData[] = [
  {
    type: 'success',
    questName: 'Invasione di Topi',
    questIcon: '🐀',
    residentName: 'Aelin Swiftblade',
    residentPortrait: '🗡️',
    gold: 20,
    xp: 20,
  },
  {
    type: 'partial',
    questName: 'Campo dei Banditi',
    questIcon: '⚔️',
    residentName: 'Borin Stonefist',
    residentPortrait: '🛡️',
    gold: 22,
    xp: 40,
    item: 'Armatura di cuoio (danneggiata)',
    consequence: 'Le scorte recuperate erano parzialmente rubate.',
  },
  {
    type: 'injury',
    questName: 'Villaggio Appestato',
    questIcon: '☠️',
    residentName: 'Theron the Wise',
    residentPortrait: '📚',
    gold: 40,
    xp: 75,
    consequence: 'Ferita grave: –30% efficacia per 2 giorni.',
    recoveryDays: 2,
  },
  {
    type: 'death',
    questName: 'La Caverna del Drago',
    questIcon: '🐉',
    residentName: 'Lyra Blacksmith',
    residentPortrait: '⚒️',
    consequence: 'Lyra è caduta in battaglia. Il suo sacrificio non sarà dimenticato.',
  },
];

// ─── Outcome Modal Component ──────────────────────────────────────────────────

function OutcomeModal({
  outcome,
  onClose,
}: {
  outcome: OutcomeData;
  onClose: () => void;
}): React.ReactElement {
  const config = {
    success: {
      title: 'Missione Completata!',
      titleColor: 'text-green-400',
      borderColor: 'border-green-500',
      bgColor: 'bg-green-900/20',
      icon: '✅',
    },
    partial: {
      title: 'Successo Parziale',
      titleColor: 'text-yellow-400',
      borderColor: 'border-yellow-500',
      bgColor: 'bg-yellow-900/20',
      icon: '⚡',
    },
    injury: {
      title: 'Missione Completata — Ferito',
      titleColor: 'text-orange-400',
      borderColor: 'border-orange-500',
      bgColor: 'bg-orange-900/20',
      icon: '🩹',
    },
    death: {
      title: 'Personaggio Caduto',
      titleColor: 'text-red-400',
      borderColor: 'border-red-600',
      bgColor: 'bg-red-900/20',
      icon: '💀',
    },
  }[outcome.type];

  return (
    <div
      className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4"
      data-testid="outcome-modal-overlay"
    >
      <WanderlustSurface
        shape="card"
        material="bronze"
        interactive={false}
        style={{ maxWidth: '400px', width: '100%' }}
        data-testid="outcome-modal"
        data-outcome-type={outcome.type}
      >
        <div className="flex flex-col gap-4 p-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <span className="text-4xl">{config.icon}</span>
          <div>
            <h2
              className={`text-xl font-bold ${config.titleColor}`}
              data-testid="outcome-title"
            >
              {config.title}
            </h2>
            <p className="text-sm text-gray-400">
              {outcome.questIcon} {outcome.questName}
            </p>
          </div>
        </div>

        {/* Resident portrait */}
        <div
          className={`rounded-lg p-4 ${config.bgColor} flex items-center gap-4`}
          data-testid="outcome-resident-info"
        >
          <div className="text-4xl w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center border-2 border-gray-600">
            {outcome.residentPortrait}
          </div>
          <div>
            <p
              className="font-semibold text-white"
              data-testid="outcome-resident-name"
            >
              {outcome.residentName}
            </p>
            {outcome.type === 'injury' && (
              <p className="text-xs text-orange-300 mt-0.5" data-testid="outcome-injury-status">
                🩹 Ferito — recupero in {outcome.recoveryDays} {outcome.recoveryDays === 1 ? 'giorno' : 'giorni'}
              </p>
            )}
            {outcome.type === 'death' && (
              <p className="text-xs text-red-300 mt-0.5" data-testid="outcome-death-status">
                💀 Caduto in battaglia
              </p>
            )}
          </div>
        </div>

        {/* Rewards */}
        {(outcome.gold || outcome.xp || outcome.item) && (
          <div className="space-y-2" data-testid="outcome-rewards">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Ricompense</p>
            <div className="flex flex-wrap gap-3">
              {outcome.gold && (
                <span
                  className="text-sm bg-yellow-900/30 border border-yellow-700/50 text-yellow-400 px-3 py-1.5 rounded-lg"
                  data-testid="outcome-gold"
                >
                  💰 +{outcome.gold} Gold
                </span>
              )}
              {outcome.xp && (
                <span
                  className="text-sm bg-blue-900/30 border border-blue-700/50 text-blue-400 px-3 py-1.5 rounded-lg"
                  data-testid="outcome-xp"
                >
                  ⭐ +{outcome.xp} XP
                </span>
              )}
              {outcome.item && (
                <span
                  className="text-sm bg-purple-900/30 border border-purple-700/50 text-purple-400 px-3 py-1.5 rounded-lg"
                  data-testid="outcome-item"
                >
                  📦 {outcome.item}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Consequence */}
        {outcome.consequence && (
          <div
            className="text-sm text-gray-300 bg-gray-700/50 rounded-lg p-3"
            data-testid="outcome-consequence"
          >
            {outcome.consequence}
          </div>
        )}

        {/* No rewards (death) */}
        {outcome.type === 'death' && !outcome.gold && !outcome.xp && (
          <div
            className="text-sm text-red-400 bg-red-900/20 rounded-lg p-3 text-center"
            data-testid="outcome-no-rewards"
          >
            Nessuna ricompensa recuperata.
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className={`w-full font-semibold py-3 rounded-lg transition-colors ${
            outcome.type === 'death'
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              : 'bg-green-700 hover:bg-green-600 text-white'
          }`}
          data-testid="outcome-close-btn"
        >
          {outcome.type === 'death' ? 'Continua...' : 'Ottimo! Continua →'}
        </button>
        </div>
      </WanderlustSurface>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MinimalOutcomePage(): React.ReactNode {
  const [activeOutcome, setActiveOutcome] = useState<OutcomeData | null>(null);

  const typeLabels: Record<OutcomeType, { label: string; color: string }> = {
    success: { label: 'Successo', color: 'bg-green-700 hover:bg-green-600' },
    partial:  { label: 'Parziale', color: 'bg-yellow-700 hover:bg-yellow-600' },
    injury:  { label: 'Ferita',   color: 'bg-orange-700 hover:bg-orange-600' },
    death:   { label: 'Morte',    color: 'bg-red-800 hover:bg-red-700' },
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6 text-white">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Fase 10: OutcomeModal Isolato</h1>
          <p className="text-gray-400 text-sm">
            Mostra il modal post-skill-check per i 4 esiti possibili.
          </p>
        </div>

        {/* Trigger buttons */}
        <div className="grid grid-cols-2 gap-4 mb-8" data-testid="outcome-trigger-grid">
          {MOCK_OUTCOMES.map((outcome) => {
            const cfg = typeLabels[outcome.type];
            return (
              <button
                key={outcome.type}
                onClick={() => setActiveOutcome(outcome)}
                className={`${cfg.color} text-white font-semibold py-4 rounded-xl transition-colors flex flex-col items-center gap-2`}
                data-testid={`outcome-trigger-${outcome.type}`}
              >
                <span className="text-2xl">{outcome.questIcon}</span>
                <span>{cfg.label}</span>
                <span className="text-xs opacity-75">{outcome.questName}</span>
              </button>
            );
          })}
        </div>

        {/* Preview cards */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
            Anteprima stati
          </h2>
          {MOCK_OUTCOMES.map((outcome) => {
            const colors = {
              success: 'border-green-700 bg-green-900/10',
              partial:  'border-yellow-700 bg-yellow-900/10',
              injury:  'border-orange-700 bg-orange-900/10',
              death:   'border-red-800 bg-red-900/10',
            }[outcome.type];
            return (
              <div
                key={outcome.type}
                className={`rounded-lg border ${colors} p-4 flex items-center gap-4 cursor-pointer`}
                onClick={() => setActiveOutcome(outcome)}
                data-testid={`outcome-preview-${outcome.type}`}
              >
                <span className="text-2xl">{outcome.residentPortrait}</span>
                <div className="flex-1">
                  <p className="font-semibold text-white text-sm">{outcome.residentName}</p>
                  <p className="text-xs text-gray-400">{outcome.questIcon} {outcome.questName}</p>
                </div>
                {outcome.gold && (
                  <span className="text-xs text-yellow-400">+{outcome.gold}g</span>
                )}
                {outcome.type === 'death' && (
                  <span className="text-xs text-red-400">💀</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">
            📋 Spec Fase 10 (minimal_slice/10_outcome.md)
          </h3>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>✓ 4 esiti: success, partial, injury, death — stile visivo distinto</li>
            <li>✓ Success/Partial: ricompense gold + XP + item</li>
            <li>✓ Injury: ricompense ridotte + badge ferita + giorni recupero</li>
            <li>✓ Death: nessuna ricompensa + messaggio commemorativo</li>
            <li>✓ Pulsante "Continua" con testo contestuale</li>
          </ul>
        </div>
      </div>

      {/* Modal */}
      {activeOutcome && (
        <OutcomeModal
          outcome={activeOutcome}
          onClose={() => setActiveOutcome(null)}
        />
      )}
    </div>
  );
}
