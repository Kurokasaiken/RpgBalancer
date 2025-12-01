import React, { useState } from 'react';
import { useDensity } from '../../contexts/DensityContext';
import {
    CompactCard,
    StatDisplay,
    ProgressBar,
    CompactButton,
    IconButton,
    CompactInput,
    CompactNumberInput,
    CompactSlider,
} from '../components/compact';

export const CompactDemo: React.FC = () => {
    const { density, toggleDensity, text, spacing } = useDensity();
    const [inputValue, setInputValue] = useState('');
    const [numberValue, setNumberValue] = useState(50);
    const [sliderValue, setSliderValue] = useState(75);

    return (
        <div className={spacing.section}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className={`${text.heading} text-parchment-light`}>
                        Compact UI Demo
                    </h1>
                    <p className={`${text.small} text-parchment-light/60 mt-1`}>
                        Information-dense components for professional dashboards
                    </p>
                </div>
                <CompactButton
                    variant="ghost"
                    size="sm"
                    onClick={toggleDensity}
                    icon={density === 'compact' ? '▪' : '▫'}
                >
                    {density === 'compact' ? 'Compact' : 'Comfortable'}
                </CompactButton>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <CompactCard variant="glass">
                    <StatDisplay label="Budget" value={72} unit="pt" color="gold" />
                </CompactCard>
                <CompactCard variant="glass">
                    <StatDisplay label="Balance" value="94%" color="success" trend="up" />
                </CompactCard>
                <CompactCard variant="glass">
                    <StatDisplay label="Tier" value="II" color="default" />
                </CompactCard>
                <CompactCard variant="glass">
                    <StatDisplay label="Entities" value={12} color="default" />
                </CompactCard>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Buttons Section */}
                <CompactCard title="Buttons" icon="🎛️" variant="default">
                    <div className={spacing.section}>
                        <div className="flex flex-wrap gap-2">
                            <CompactButton variant="primary" size="sm">Primary</CompactButton>
                            <CompactButton variant="secondary" size="sm">Secondary</CompactButton>
                            <CompactButton variant="gold" size="sm">Gold</CompactButton>
                            <CompactButton variant="danger" size="sm">Danger</CompactButton>
                            <CompactButton variant="ghost" size="sm">Ghost</CompactButton>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                            <CompactButton variant="primary" size="xs">XS Size</CompactButton>
                            <CompactButton variant="secondary" size="md">MD Size</CompactButton>
                            <CompactButton variant="gold" size="sm" icon="✨">With Icon</CompactButton>
                            <CompactButton variant="secondary" size="sm" isLoading>Loading</CompactButton>
                        </div>
                        <div className="flex gap-2 mt-3">
                            <IconButton icon="⚙️" tooltip="Settings" />
                            <IconButton icon="🗑️" variant="danger" tooltip="Delete" />
                            <IconButton icon="📋" variant="secondary" tooltip="Copy" />
                        </div>
                    </div>
                </CompactCard>

                {/* Inputs Section */}
                <CompactCard title="Inputs" icon="✏️" variant="default">
                    <div className={spacing.section}>
                        <CompactInput
                            label="Text Input"
                            placeholder="Enter text..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                        />
                        <CompactInput
                            label="With Icon"
                            placeholder="Search..."
                            icon="🔍"
                        />
                        <CompactNumberInput
                            label="Number Input"
                            value={numberValue}
                            onChange={setNumberValue}
                            min={0}
                            max={100}
                        />
                        <CompactSlider
                            label="Slider"
                            value={sliderValue}
                            onChange={setSliderValue}
                            color="gold"
                        />
                    </div>
                </CompactCard>

                {/* Progress Bars */}
                <CompactCard title="Progress" icon="📊" variant="default">
                    <div className={spacing.section}>
                        <ProgressBar label="Default" value={65} />
                        <ProgressBar label="Gold" value={82} color="gold" />
                        <ProgressBar label="Nature" value={45} color="nature" />
                        <ProgressBar label="Error" value={23} color="error" />
                        <ProgressBar value={sliderValue} label="Linked to slider" color="gold" />
                    </div>
                </CompactCard>

                {/* Stats Display */}
                <CompactCard title="Stat Displays" icon="📈" variant="default">
                    <div className={spacing.section}>
                        <StatDisplay label="Health Points" value={1000} unit="HP" />
                        <StatDisplay label="Attack Damage" value={85} trend="up" color="success" />
                        <StatDisplay label="Defense" value={42} trend="down" color="error" />
                        <StatDisplay label="Hit Chance" value="78%" color="gold" />
                        <StatDisplay label="Critical Rate" value="15%" trend="neutral" />
                    </div>
                </CompactCard>
            </div>

            {/* Card Variants */}
            <div className="mt-4">
                <h2 className={`${text.subheading} text-parchment-light mb-3`}>Card Variants</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <CompactCard variant="default" title="Default">
                        <p className={`${text.small} text-parchment-light/60`}>Standard card style</p>
                    </CompactCard>
                    <CompactCard variant="glass" title="Glass">
                        <p className={`${text.small} text-parchment-light/60`}>Glassmorphism effect</p>
                    </CompactCard>
                    <CompactCard variant="solid" title="Solid">
                        <p className={`${text.small} text-parchment-light/60`}>Solid background</p>
                    </CompactCard>
                    <CompactCard variant="outline" title="Outline">
                        <p className={`${text.small} text-parchment-light/60`}>Border only</p>
                    </CompactCard>
                </div>
            </div>

            {/* Density Comparison */}
            <div className="mt-4">
                <CompactCard title="Density Mode Info" icon="ℹ️" variant="glass">
                    <p className={`${text.body} text-parchment-light/80`}>
                        Current mode: <strong className="text-gold">{density}</strong>
                    </p>
                    <p className={`${text.small} text-parchment-light/60 mt-1`}>
                        {density === 'compact'
                            ? 'Optimized for maximum information density. Ideal for desktop power users.'
                            : 'More breathing room for touch interactions. Better for mobile and casual use.'
                        }
                    </p>
                </CompactCard>
            </div>
        </div>
    );
};
