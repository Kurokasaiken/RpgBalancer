import React from 'react';
import type { StatBlock, LockedParameter } from '../balancing/types';
import { SmartInput } from './components/SmartInput';
import { CardWrapper } from './components/CardWrapper';

interface CriticalCardProps {
    stats: StatBlock;
    lockedParam: LockedParameter;
    onParamChange: (param: keyof StatBlock, value: number) => void;
    onLockToggle: (param: LockedParameter) => void;
    onResetParam: (paramId: string) => void;
    onResetCard: () => void;
}

export const CriticalCard: React.FC<CriticalCardProps> = ({ stats, lockedParam, onParamChange, onLockToggle, onResetParam, onResetCard }) => {
    return (
        <CardWrapper title="Crit & Fail" color="text-red-400" onReset={onResetCard}>

            <div className="space-y-2">
                <div className="grid grid-cols-2 gap-1.5">
                    {/* CRITICO */}
                    <div className="space-y-1.5 border-r border-gray-700 pr-1.5">
                        <h4 className="text-xs font-semibold text-yellow-400">Crit</h4>
                        <SmartInput
                            paramId="critChance"
                            value={stats.critChance}
                            onChange={(v) => onParamChange('critChance', v)}
                            onReset={() => onResetParam('critChance')}
                            lockedParam={lockedParam} onLockToggle={onLockToggle}
                            min={0} max={100} isPercentage
                        />
                        <SmartInput
                            paramId="critMult"
                            value={stats.critMult}
                            onChange={(v) => onParamChange('critMult', v)}
                            onReset={() => onResetParam('critMult')}
                            lockedParam={lockedParam} onLockToggle={onLockToggle}
                            min={1} max={5} step={0.1}
                        />
                        <SmartInput
                            paramId="critTxCBonus"
                            value={stats.critTxCBonus}
                            onChange={(v) => onParamChange('critTxCBonus', v)}
                            onReset={() => onResetParam('critTxCBonus')}
                            lockedParam={lockedParam} onLockToggle={onLockToggle}
                            min={0} max={100}
                        />
                    </div>

                    {/* FALLIMENTO */}
                    <div className="space-y-1.5 pl-1.5">
                        <h4 className="text-xs font-semibold text-red-400">Fail</h4>
                        <SmartInput
                            paramId="failChance"
                            value={stats.failChance}
                            onChange={(v) => onParamChange('failChance', v)}
                            onReset={() => onResetParam('failChance')}
                            lockedParam={lockedParam} onLockToggle={onLockToggle}
                            min={0} max={100} isPercentage
                        />
                        <SmartInput
                            paramId="failMult"
                            value={stats.failMult}
                            onChange={(v) => onParamChange('failMult', v)}
                            onReset={() => onResetParam('failMult')}
                            lockedParam={lockedParam} onLockToggle={onLockToggle}
                            min={0} max={1} step={0.1}
                        />
                        <SmartInput
                            paramId="failTxCMalus"
                            value={stats.failTxCMalus}
                            onChange={(v) => onParamChange('failTxCMalus', v)}
                            onReset={() => onResetParam('failTxCMalus')}
                            lockedParam={lockedParam} onLockToggle={onLockToggle}
                            min={0} max={100}
                        />
                    </div>
                </div>
            </div>
        </CardWrapper>
    );
};
