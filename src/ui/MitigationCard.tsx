import React from 'react';
import type { StatBlock, LockedParameter } from '../balancing/types';
import { SmartInput } from './components/SmartInput';
import { CardWrapper } from './components/CardWrapper';

interface MitigationCardProps {
    stats: StatBlock;
    lockedParam: LockedParameter;
    onParamChange: (param: keyof StatBlock, value: number) => void;
    onLockToggle: (param: LockedParameter) => void;
    onResetParam: (paramId: string) => void;
    onResetCard: () => void;
}

export const MitigationCard: React.FC<MitigationCardProps> = ({ stats, lockedParam, onParamChange, onLockToggle, onResetParam, onResetCard }) => {
    return (
        <CardWrapper title="Mitigation" color="text-green-400" onReset={onResetCard}>
            <div className="flex justify-between items-center mb-1.5 gap-2">
                <button
                    onClick={() => onParamChange('configFlatFirst', stats.configFlatFirst ? 0 : 1)}
                    className={`px-1.5 py-0.5 rounded text-xs ${stats.configFlatFirst ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                    title="Mitigation order: Flat (Armor) before % (Resistance)"
                >
                    {stats.configFlatFirst ? 'F→%' : '%→F'}
                </button>
                <button
                    onClick={() => onParamChange('configApplyBeforeCrit', stats.configApplyBeforeCrit ? 0 : 1)}
                    className={`px-1.5 py-0.5 rounded text-xs ${stats.configApplyBeforeCrit ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                    title="Damage order: Mitigation before Crit vs Crit before Mitigation"
                >
                    {stats.configApplyBeforeCrit ? 'M→C' : 'C→M'}
                </button>
            </div>

            <div className="space-y-2">
                <div className="grid grid-cols-2 gap-1.5">
                    {/* DIFESA */}
                    <div className="space-y-1.5 border-r border-gray-700 pr-1.5">
                        <h4 className="text-xs font-semibold text-blue-400">Def</h4>
                        <SmartInput
                            paramId="armor"
                            value={stats.armor}
                            onChange={(v) => onParamChange('armor', v)}
                            onReset={() => onResetParam('armor')}
                            lockedParam={lockedParam} onLockToggle={onLockToggle}
                            min={0} max={100}
                        />
                        <SmartInput
                            paramId="resistance"
                            value={stats.resistance}
                            onChange={(v) => onParamChange('resistance', v)}
                            onReset={() => onResetParam('resistance')}
                            lockedParam={lockedParam} onLockToggle={onLockToggle}
                            min={0} max={100} isPercentage
                        />
                    </div>

                    {/* ATTACCO */}
                    <div className="space-y-1.5 pl-1.5">
                        <h4 className="text-xs font-semibold text-red-400">Pen</h4>
                        <SmartInput
                            paramId="armorPen"
                            value={stats.armorPen}
                            onChange={(v) => onParamChange('armorPen', v)}
                            onReset={() => onResetParam('armorPen')}
                            lockedParam={lockedParam} onLockToggle={onLockToggle}
                            min={0} max={100}
                        />
                        <SmartInput
                            paramId="penPercent"
                            value={stats.penPercent}
                            onChange={(v) => onParamChange('penPercent', v)}
                            onReset={() => onResetParam('penPercent')}
                            lockedParam={lockedParam} onLockToggle={onLockToggle}
                            min={0} max={100} isPercentage
                        />
                    </div>
                </div>


                {/* Effective Damage - Now Editable! */}
                <SmartInput
                    paramId="effectiveDamage"
                    value={stats.effectiveDamage}
                    onChange={(v) => onParamChange('effectiveDamage', v)}
                    onReset={() => onResetParam('effectiveDamage')}
                    lockedParam={lockedParam}
                    onLockToggle={onLockToggle}
                    min={1}
                    max={200}
                    step={0.1}
                />
            </div>
        </CardWrapper>
    );
};
