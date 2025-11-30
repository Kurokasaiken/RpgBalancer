import React, { useState } from 'react';
import { FantasyCard, FantasyButton, FantasyInput, FantasySlider, FantasySelect } from './index.fantasy';

export const FantasyComponentShowcase: React.FC = () => {
    const [inputValue, setInputValue] = useState('');
    const [sliderValue, setSliderValue] = useState(50);
    const [selectValue, setSelectValue] = useState('');

    const selectOptions = [
        { value: 'warrior', label: '⚔️ Warrior' },
        { value: 'mage', label: '🔮 Mage' },
        { value: 'rogue', label: '🗡️ Rogue' },
        { value: 'cleric', label: '✨ Cleric' },
    ];

    return (
        <div className="min-h-screen bg-parchment-light p-8 font-body">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="font-display text-4xl text-wood-dark mb-4">
                        🎨 Fantasy Component Showcase
                    </h1>
                    <p className="font-body text-lg text-wood-medium">
                        Medieval Fantasy UI Components - 2D Vector Art Style
                    </p>
                </div>

                {/* Cards */}
                <section>
                    <h2 className="font-display text-2xl text-wood-dark mb-4">Fantasy Cards</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FantasyCard variant="parchment">
                            <h3 className="font-display text-xl font-bold mb-2">Parchment Card</h3>
                            <p className="font-body text-base">
                                Classic parchment background with wood border and bronze corner ornaments.
                            </p>
                        </FantasyCard>

                        <FantasyCard variant="wood">
                            <h3 className="font-display text-xl font-bold mb-2">Wood Card</h3>
                            <p className="font-body text-base">
                                Dark wood background with bronze border for contrast sections.
                            </p>
                        </FantasyCard>

                        <FantasyCard variant="marble">
                            <h3 className="font-display text-xl font-bold mb-2">Marble Card</h3>
                            <p className="font-body text-base">
                                Elegant marble background for important information panels.
                            </p>
                        </FantasyCard>
                    </div>

                    <div className="mt-6">
                        <FantasyCard variant="parchment" interactive>
                            <h3 className="font-display text-xl font-bold mb-2">🖱️ Interactive Card</h3>
                            <p className="font-body text-base">
                                Hover over this card to see the interactive effects with glow and scale.
                            </p>
                        </FantasyCard>
                    </div>
                </section>

                {/* Buttons */}
                <section>
                    <h2 className="font-display text-2xl text-wood-dark mb-4">Fantasy Buttons</h2>
                    <FantasyCard variant="parchment" padding="lg">
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-display text-lg mb-3">Variants</h3>
                                <div className="flex flex-wrap gap-4">
                                    <FantasyButton variant="primary">
                                        Primary Action
                                    </FantasyButton>
                                    <FantasyButton variant="secondary">
                                        Secondary Action
                                    </FantasyButton>
                                    <FantasyButton variant="accent">
                                        Accent Action
                                    </FantasyButton>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-display text-lg mb-3">Sizes</h3>
                                <div className="flex flex-wrap items-center gap-4">
                                    <FantasyButton size="sm">Small</FantasyButton>
                                    <FantasyButton size="md">Medium</FantasyButton>
                                    <FantasyButton size="lg">Large</FantasyButton>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-display text-lg mb-3">With Icons</h3>
                                <div className="flex flex-wrap gap-4">
                                    <FantasyButton leftIcon="⚔️">
                                        Attack
                                    </FantasyButton>
                                    <FantasyButton rightIcon="🛡️">
                                        Defend
                                    </FantasyButton>
                                    <FantasyButton variant="accent" leftIcon="✨" rightIcon="🔮">
                                        Cast Spell
                                    </FantasyButton>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-display text-lg mb-3">States</h3>
                                <div className="flex flex-wrap gap-4">
                                    <FantasyButton isLoading>
                                        Loading...
                                    </FantasyButton>
                                    <FantasyButton disabled>
                                        Disabled
                                    </FantasyButton>
                                </div>
                            </div>
                        </div>
                    </FantasyCard>
                </section>

                {/* Inputs */}
                <section>
                    <h2 className="font-display text-2xl text-wood-dark mb-4">Fantasy Inputs</h2>
                    <FantasyCard variant="parchment" padding="lg">
                        <div className="space-y-6">
                            <FantasyInput
                                label="Character Name"
                                value={inputValue}
                                onChange={setInputValue}
                                placeholder="Enter your character name..."
                            />

                            <FantasyInput
                                label="With Left Icon"
                                value={inputValue}
                                onChange={setInputValue}
                                leftIcon="🗡️"
                                placeholder="Weapon name..."
                            />

                            <FantasyInput
                                label="With Right Icon"
                                value={inputValue}
                                onChange={setInputValue}
                                rightIcon="⚔️"
                                placeholder="Search..."
                            />

                            <FantasyInput
                                label="With Error"
                                value=""
                                onChange={() => { }}
                                error="This field is required"
                            />

                            <FantasyInput
                                label="Disabled"
                                value="Disabled input"
                                onChange={() => { }}
                                disabled
                            />
                        </div>
                    </FantasyCard>
                </section>

                {/* Sliders */}
                <section>
                    <h2 className="font-display text-2xl text-wood-dark mb-4">Fantasy Sliders</h2>
                    <FantasyCard variant="parchment" padding="lg">
                        <div className="space-y-8">
                            <FantasySlider
                                label="Power Level"
                                value={sliderValue}
                                onChange={setSliderValue}
                                min={0}
                                max={100}
                            />

                            <FantasySlider
                                label="With Marks"
                                value={sliderValue}
                                onChange={setSliderValue}
                                min={0}
                                max={100}
                                marks={[0, 25, 50, 75, 100]}
                            />

                            <FantasySlider
                                label="Disabled"
                                value={75}
                                onChange={() => { }}
                                disabled
                            />
                        </div>
                    </FantasyCard>
                </section>

                {/* Selects */}
                <section>
                    <h2 className="font-display text-2xl text-wood-dark mb-4">Fantasy Selects</h2>
                    <FantasyCard variant="parchment" padding="lg">
                        <div className="space-y-6">
                            <FantasySelect
                                label="Choose Your Class"
                                value={selectValue}
                                onChange={setSelectValue}
                                options={selectOptions}
                                placeholder="Select a class..."
                            />

                            <FantasySelect
                                label="With Error"
                                value=""
                                onChange={() => { }}
                                options={selectOptions}
                                error="Please select a class"
                            />

                            <FantasySelect
                                label="Disabled"
                                value="warrior"
                                onChange={() => { }}
                                options={selectOptions}
                                disabled
                            />
                        </div>
                    </FantasyCard>
                </section>

                {/* Combined Example */}
                <section>
                    <h2 className="font-display text-2xl text-wood-dark mb-4">Combined Example</h2>
                    <FantasyCard variant="wood" padding="lg">
                        <h3 className="font-display text-2xl font-bold mb-6 text-center">
                            ⚔️ Create Your Hero
                        </h3>
                        <div className="space-y-6">
                            <FantasyInput
                                label="Hero Name"
                                value={inputValue}
                                onChange={setInputValue}
                                placeholder="Enter hero name..."
                                leftIcon="👤"
                                fullWidth
                            />

                            <FantasySelect
                                label="Class"
                                value={selectValue}
                                onChange={setSelectValue}
                                options={selectOptions}
                                fullWidth
                            />

                            <FantasySlider
                                label="Strength"
                                value={sliderValue}
                                onChange={setSliderValue}
                                min={1}
                                max={20}
                                marks={[1, 5, 10, 15, 20]}
                            />

                            <div className="flex gap-4 mt-8">
                                <FantasyButton variant="secondary" className="flex-1">
                                    Cancel
                                </FantasyButton>
                                <FantasyButton variant="primary" className="flex-1" rightIcon="✨">
                                    Create Hero
                                </FantasyButton>
                            </div>
                        </div>
                    </FantasyCard>
                </section>
            </div>
        </div>
    );
};
