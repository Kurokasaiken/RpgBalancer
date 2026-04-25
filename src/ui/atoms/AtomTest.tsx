import React, { useState } from 'react';
import { GlassCard } from './GlassCard';
import { GlassButton } from './GlassButton';
import { GlassInput } from './GlassInput';

export const AtomTest: React.FC = () => {
    const [inputValue, setInputValue] = useState('');

    return (
        <div className="p-8 space-y-8 min-h-screen bg-slate-900 text-white">
            <h1 className="text-3xl font-bold mb-8">⚛️ Atomic Design System Test</h1>

            {/* CARDS */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-blue-400">Glass Cards</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <GlassCard>
                        <h3 className="font-bold">Default Card</h3>
                        <p className="text-gray-400 text-sm">Standard glassmorphism.</p>
                    </GlassCard>

                    <GlassCard variant="neon">
                        <h3 className="font-bold text-blue-300">Neon Card</h3>
                        <p className="text-blue-200/70 text-sm">Glowing active state.</p>
                    </GlassCard>

                    <GlassCard variant="danger">
                        <h3 className="font-bold text-red-300">Danger Card</h3>
                        <p className="text-red-200/70 text-sm">Critical information.</p>
                    </GlassCard>
                </div>
            </section>

            {/* BUTTONS */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-blue-400">Glass Buttons</h2>
                <div className="flex flex-wrap gap-4 items-center">
                    <GlassButton>Primary</GlassButton>
                    <GlassButton variant="secondary">Secondary</GlassButton>
                    <GlassButton variant="danger">Danger</GlassButton>
                    <GlassButton variant="ghost">Ghost</GlassButton>
                    <GlassButton disabled>Disabled</GlassButton>
                    <GlassButton isLoading>Loading</GlassButton>
                </div>
                <div className="flex flex-wrap gap-4 items-center mt-4">
                    <GlassButton size="sm">Small</GlassButton>
                    <GlassButton size="md">Medium</GlassButton>
                    <GlassButton size="lg">Large</GlassButton>
                </div>
            </section>

            {/* INPUTS */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-blue-400">Glass Inputs</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                    <GlassInput
                        label="Username"
                        placeholder="Enter username"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                    />

                    <GlassInput
                        label="Password"
                        type="password"
                        placeholder="Enter password"
                    />

                    <GlassInput
                        label="With Error"
                        placeholder="Error state"
                        error="This field is required"
                    />

                    <GlassInput
                        label="With Icon"
                        placeholder="Search..."
                        leftIcon={<span>🔍</span>}
                    />
                </div>
            </section>
        </div>
    );
};
