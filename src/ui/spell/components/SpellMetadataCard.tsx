import React from 'react';
import type { Spell } from '../../../balancing/spellTypes';

interface SpellMetadataCardProps {
    spell: Spell;
    updateField: <K extends keyof Spell>(field: K, value: Spell[K]) => void;
}

export const SpellMetadataCard: React.FC<SpellMetadataCardProps> = ({ spell, updateField }) => {
    return (
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-lg p-4 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span>📝 Spell Metadata</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Description */}
                <div className="flex flex-col gap-1 col-span-2">
                    <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Description</label>
                    <textarea
                        rows={3}
                        value={spell.description || ''}
                        onChange={e => updateField('description', e.target.value)}
                        placeholder="Describe the spell's effect..."
                        className="w-full bg-black/20 text-white px-3 py-2 rounded border border-white/10 text-sm focus:border-purple-400 focus:shadow-[0_0_8px_rgba(168,85,247,0.5)] outline-none transition-all placeholder-white/20 resize-none"
                    />
                </div>

                {/* Tags */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Tags</label>
                    <input
                        type="text"
                        value={(spell.tags || []).join(', ')}
                        onChange={e => updateField('tags', e.target.value.split(',').map(t => t.trim()).filter(t => t))}
                        placeholder="fire, aoe, ultimate..."
                        className="w-full bg-black/20 text-white px-3 py-2 rounded border border-white/10 text-sm focus:border-purple-400 focus:shadow-[0_0_8px_rgba(168,85,247,0.5)] outline-none transition-all placeholder-white/20"
                    />
                </div>

                {/* Scaling Stat */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Scaling Stat</label>
                    <select
                        value={spell.scalingStat || ''}
                        onChange={e => updateField('scalingStat', (e.target.value || undefined) as Spell['scalingStat'])}
                        className="w-full bg-black/20 text-white px-3 py-2 rounded border border-white/10 text-sm focus:border-purple-400 focus:shadow-[0_0_8px_rgba(168,85,247,0.5)] outline-none transition-all appearance-none"
                    >
                        <option value="">None</option>
                        <option value="attack">Attack</option>
                        <option value="magic">Magic</option>
                        <option value="health">Health</option>
                        <option value="mana">Mana</option>
                        <option value="defense">Defense</option>
                    </select>
                </div>

                {/* CC Effect (only for type cc) */}
                {spell.type === 'cc' && (
                    <div className="flex flex-col gap-1">
                        <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold">CC Effect</label>
                        <select
                            value={spell.ccEffect || ''}
                            onChange={e => updateField('ccEffect', (e.target.value || undefined) as Spell['ccEffect'])}
                            className="w-full bg-black/20 text-white px-3 py-2 rounded border border-white/10 text-sm focus:border-purple-400 focus:shadow-[0_0_8px_rgba(168,85,247,0.5)] outline-none transition-all appearance-none"
                        >
                            <option value="">None</option>
                            <option value="stun">Stun</option>
                            <option value="slow">Slow</option>
                            <option value="knockback">Knockback</option>
                            <option value="silence">Silence</option>
                        </select>
                    </div>
                )}

                {/* Situational Modifiers (JSON) */}
                <div className="flex flex-col gap-1 col-span-2">
                    <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Situational Modifiers (JSON)</label>
                    <textarea
                        rows={3}
                        value={JSON.stringify(spell.situationalModifiers || [], null, 2)}
                        onChange={e => {
                            try {
                                const parsed = JSON.parse(e.target.value);
                                updateField('situationalModifiers', parsed);
                            } catch {
                                // ignore invalid JSON
                            }
                        }}
                        className="w-full bg-black/20 text-white px-3 py-2 rounded border border-white/10 text-xs font-mono focus:border-purple-400 focus:shadow-[0_0_8px_rgba(168,85,247,0.5)] outline-none transition-all placeholder-white/20"
                    />
                </div>
            </div>
        </div>
    );
};
