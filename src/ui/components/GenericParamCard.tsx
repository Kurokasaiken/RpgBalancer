import React from 'react';
import type { StatBlock, LockedParameter } from '../../balancing/types';
import { SmartInput } from './SmartInput';
import { CardWrapper } from './CardWrapper';

interface ParamCardConfig {
    title: string;
    color: string;
    sections: {
        title: string;
        params: {
            id: keyof StatBlock;
            min: number;
            max: number;
            step?: number;
            isPercentage?: boolean;
            readOnly?: boolean;
        }[];
    }[];
    previewComponent?: React.ReactNode;
}

interface GenericParamCardProps {
    config: ParamCardConfig;
    stats: StatBlock;
    lockedParam: LockedParameter;
    onParamChange: (param: keyof StatBlock, value: number) => void;
    onLockToggle: (param: LockedParameter) => void;
    onResetParam: (paramId: string) => void;
    onResetCard: () => void;
}

export const GenericParamCard: React.FC<GenericParamCardProps> = ({
    config,
    stats,
    lockedParam,
    onParamChange,
    onLockToggle,
    onResetParam,
    onResetCard
}) => {
    return (
        <CardWrapper title={config.title} color={config.color} onReset={onResetCard}>
            <div className="space-y-2">
                {config.sections.length === 1 ? (
                    // Single section - no grid
                    <div className="space-y-2">
                        {config.sections[0].params.map(param => (
                            <SmartInput
                                key={param.id}
                                paramId={param.id}
                                value={stats[param.id] as number}
                                onChange={(v) => onParamChange(param.id, v)}
                                onReset={() => onResetParam(param.id)}
                                lockedParam={lockedParam}
                                onLockToggle={onLockToggle}
                                min={param.min}
                                max={param.max}
                                step={param.step}
                                isPercentage={param.isPercentage}
                                readOnly={param.readOnly}
                            />
                        ))}
                    </div>
                ) : (
                    // Multiple sections - use grid
                    <div className={`grid grid-cols-${config.sections.length} gap-1.5`}>
                        {config.sections.map((section, idx) => (
                            <div
                                key={section.title}
                                className={`space-y-1.5 ${idx < config.sections.length - 1 ? 'border-r border-gray-700 pr-1.5' : 'pl-1.5'}`}
                            >
                                <h4 className="text-xs font-semibold text-gray-400">{section.title}</h4>
                                {section.params.map(param => (
                                    <SmartInput
                                        key={param.id}
                                        paramId={param.id}
                                        value={stats[param.id] as number}
                                        onChange={(v) => onParamChange(param.id, v)}
                                        onReset={() => onResetParam(param.id)}
                                        lockedParam={lockedParam}
                                        onLockToggle={onLockToggle}
                                        min={param.min}
                                        max={param.max}
                                        step={param.step}
                                        isPercentage={param.isPercentage}
                                        readOnly={param.readOnly}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                )}

                {config.previewComponent && config.previewComponent}
            </div>
        </CardWrapper>
    );
};
