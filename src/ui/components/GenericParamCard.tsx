import React from 'react';
import type { StatBlock, LockedParameter } from '../../balancing/types';
import { SmartInput } from './SmartInput';
import { CardWrapper } from './CardWrapper';

/**
 * Configuration for a parameter card section.
 */
interface ParamCardConfig {
    /**
     * The title of the parameter card.
     */
    title: string;
    /**
     * The color of the parameter card.
     */
    color: string;
    /**
     * The sections of the parameter card.
     */
    sections: {
        /**
         * The title of the section.
         */
        title: string;
        /**
         * The parameters of the section.
         */
        params: {
            /**
             * The ID of the parameter.
             */
            id: keyof StatBlock;
            /**
             * The minimum value of the parameter.
             */
            min: number;
            /**
             * The maximum value of the parameter.
             */
            max: number;
            /**
             * The step value of the parameter.
             */
            step?: number;
            /**
             * Whether the parameter is a percentage.
             */
            isPercentage?: boolean;
            /**
             * Whether the parameter is read-only.
             */
            readOnly?: boolean;
        }[];
    }[];
    /**
     * The preview component of the parameter card.
     */
    previewComponent?: React.ReactNode;
}

/**
 * Props for the GenericParamCard component.
 */
interface GenericParamCardProps {
    /**
     * The configuration of the parameter card.
     */
    config: ParamCardConfig;
    /**
     * The stats of the parameter card.
     */
    stats: StatBlock;
    /**
     * The locked parameter of the parameter card.
     */
    lockedParam: LockedParameter;
    /**
     * The callback function for when a parameter changes.
     */
    onParamChange: (param: keyof StatBlock, value: number) => void;
    /**
     * The callback function for when the lock toggle is clicked.
     */
    onLockToggle: (param: LockedParameter) => void;
    /**
     * The callback function for when a parameter is reset.
     */
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
