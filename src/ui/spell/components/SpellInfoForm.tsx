import React from 'react';
import type { Spell } from '../../../balancing/spellTypes';

interface SpellInfoFormProps {
    spell: Spell;
    updateField: (field: keyof Spell, value: any) => void;
}

export const SpellInfoForm: React.FC<SpellInfoFormProps> = ({ spell, updateField }) => (
    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 backdrop-blur-md bg-white/5 border border-white/10 rounded-lg p-4 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
        {/* CC Effect (only for type cc) */}
        {spell.type === 'cc' && (
            <>
                <div>
                    <label className="block text-sm text-gray-300 mb-1">Effect (%)</label>
                    <input
                        type="number"
                        value={spell.effect}
                        onChange={e => updateField('effect', Number(e.target.value))}
                        className="w-full bg-white/5 text-white px-4 py-2 rounded border border-white/10 focus:border-blue-400 focus:shadow-[0_0_8px_rgba(96,165,250,0.5)] outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-300 mb-1">CC Effect</label>
                    <select
                        value={spell.ccEffect || ''}
                        onChange={e => updateField('ccEffect', e.target.value || undefined)}
                        className="w-full bg-white/5 text-white px-4 py-2 rounded border border-white/10 focus:border-blue-400 focus:shadow-[0_0_8px_rgba(96,165,250,0.5)] outline-none transition-all"
                    >
                        <option value="">None</option>
                        <option value="stun">Stun</option>
                        <option value="slow">Slow</option>
                        <option value="knockback">Knockback</option>
                        <option value="silence">Silence</option>
                    </select>
                </div>
            </>
        )}
        {/* Damage Type */}
        <div>
            <label className="block text-sm text-gray-300 mb-1">Damage Type</label>
            <select
                value={spell.damageType || ''}
                onChange={e => updateField('damageType', e.target.value || undefined)}
                className="w-full bg-white/5 text-white px-4 py-2 rounded border border-white/10 focus:border-blue-400 focus:shadow-[0_0_8px_rgba(96,165,250,0.5)] outline-none transition-all"
            >
                <option value="">None</option>
                <option value="physical">Physical</option>
                <option value="magical">Magical</option>
                <option value="true">True</option>
            </select>
        </div>
        {/* Scaling Stat */}
        <div>
            <label className="block text-sm text-gray-300 mb-1">Scaling Stat</label>
            <select
                value={spell.scalingStat || ''}
                onChange={e => updateField('scalingStat', e.target.value || undefined)}
                className="w-full bg-white/5 text-white px-4 py-2 rounded border border-white/10 focus:border-blue-400 focus:shadow-[0_0_8px_rgba(96,165,250,0.5)] outline-none transition-all"
            >
                <option value="">None</option>
                <option value="attack">Attack</option>
                <option value="magic">Magic</option>
                <option value="health">Health</option>
                <option value="mana">Mana</option>
                <option value="defense">Defense</option>
            </select>
        </div>
        {/* Tags */}
        <div>
            <label className="block text-sm text-gray-300 mb-1">Tags (comma‑separated)</label>
            <input
                type="text"
                value={(spell.tags || []).join(', ')}
                onChange={e => updateField('tags', e.target.value.split(',').map(t => t.trim()).filter(t => t))}
                className="w-full bg-white/5 text-white px-4 py-2 rounded border border-white/10 focus:border-blue-400 focus:shadow-[0_0_8px_rgba(96,165,250,0.5)] outline-none transition-all"
            />
        </div>
        {/* Situational Modifiers (JSON textarea) */}
        <div className="col-span-2">
            <label className="block text-sm text-gray-300 mb-1">Situational Modifiers (JSON array)</label>
            <textarea
                rows={4}
                value={JSON.stringify(spell.situationalModifiers || [], null, 2)}
                onChange={e => {
                    try {
                        const parsed = JSON.parse(e.target.value);
                        updateField('situationalModifiers', parsed);
                    } catch {
                        // ignore invalid JSON
                    }
                }}
                className="w-full bg-white/5 text-white px-4 py-2 rounded border border-white/10 focus:border-blue-400 focus:shadow-[0_0_8px_rgba(96,165,250,0.5)] outline-none transition-all"
            />
        </div>
    </div>
);
