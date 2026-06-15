/**
 * Minimal Destiny Astrolabe Test Page
 * Tests the reusable DestinyAstrolabeComponent with various configurations
 */

import React, { useState } from 'react';
import { DestinyAstrolabeComponent } from '@/ui/idleVillage/components/DestinyAstrolabeComponent';
import type { DestinyAstrolabeResult, DestinyAstrolabeSkill } from '@/ui/idleVillage/components/DestinyAstrolabeComponent';

const SKILL_PRESETS = {
  single: [{ name: 'Atletica', stat: 65, difficulty: 50 }],
  double: [
    { name: 'Atletica', stat: 65, difficulty: 50 },      // Saltare burraco
    { name: 'Destrezza', stat: 55, difficulty: 60 },     // Disarmare trappola
  ],
  triple: [
    { name: 'Atletica', stat: 65, difficulty: 50 },      // Saltare
    { name: 'Destrezza', stat: 55, difficulty: 60 },     // Disarmare
    { name: 'Forza', stat: 70, difficulty: 45 },         // Rompere porta
  ],
  quadruple: [
    { name: 'Atletica', stat: 65, difficulty: 50 },      // Saltare
    { name: 'Destrezza', stat: 55, difficulty: 60 },     // Disarmare
    { name: 'Forza', stat: 70, difficulty: 45 },         // Rompere
    { name: 'Intelletto', stat: 50, difficulty: 55 },    // Risolvere enigma
  ],
  five: [
    { name: 'Atletica', stat: 65, difficulty: 50 },      // Saltare
    { name: 'Destrezza', stat: 55, difficulty: 60 },     // Disarmare
    { name: 'Forza', stat: 70, difficulty: 45 },         // Rompere
    { name: 'Intelletto', stat: 50, difficulty: 55 },    // Enigma
    { name: 'Carisma', stat: 60, difficulty: 48 },       // Persuadere
  ],
};

export default function MinimalDestinyAstrolabe() {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [lastResult, setLastResult] = useState<DestinyAstrolabeResult | null>(null);
  const [skills, setSkills] = useState<DestinyAstrolabeSkill[]>(SKILL_PRESETS.single);
  const [critChance, setCritChance] = useState(5);
  const [woundChance, setWoundChance] = useState(10);
  const [deathChance, setDeathChance] = useState(5);
  const [forcedVerdict, setForcedVerdict] = useState<string>('');

  const handleComplete = (result: DestinyAstrolabeResult) => {
    setLastResult(result);
    console.log('Skill check completed:', result);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <h1 className="text-4xl font-bold mb-8 text-amber-400">Destiny Astrolabe - Multi-Skill Test Hub</h1>

      {/* Tabs */}
      <div className="mb-8 flex gap-2 border-b border-amber-600/30">
        <button
          onClick={() => setActiveTab('presets')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'presets'
              ? 'text-amber-400 border-b-2 border-amber-400'
              : 'text-gray-400 hover:text-amber-300'
          }`}
        >
          Presets
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'custom'
              ? 'text-amber-400 border-b-2 border-amber-400'
              : 'text-gray-400 hover:text-amber-300'
          }`}
        >
          Custom Builder
        </button>
      </div>

      {/* Presets Tab */}
      {activeTab === 'presets' && (
        <div className="mb-8 bg-gray-800 p-6 rounded-lg border border-amber-600/20">
          <label className="block text-sm font-semibold mb-2">Number of Skills</label>
          <select
            value={skills.length}
            onChange={(e) => {
              const count = Number(e.target.value);
              const presetKey = ['single', 'double', 'triple', 'quadruple', 'five'][count - 1] as keyof typeof SKILL_PRESETS;
              setSkills(SKILL_PRESETS[presetKey]);
            }}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
          >
            <option value="1">1 Skill (5 punte)</option>
            <option value="2">2 Skills (3+2 punte)</option>
            <option value="3">3 Skills (2+2+1 punte)</option>
            <option value="4">4 Skills (2+1+1+1 punte)</option>
            <option value="5">5 Skills (1 punta each)</option>
          </select>
        </div>
      )}

      {/* Custom Builder Tab */}
      {activeTab === 'custom' && (
        <div className="mb-8 bg-gray-800 p-6 rounded-lg border border-amber-600/20">
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-3">Number of Skills</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    const newSkills = Array.from({ length: num }, (_, i) =>
                      skills[i] || { name: `Skill ${i + 1}`, stat: 60, difficulty: 50 }
                    );
                    setSkills(newSkills);
                  }}
                  className={`px-4 py-2 rounded font-semibold transition-colors ${
                    skills.length === num
                      ? 'bg-amber-500 text-black'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {skills.map((skill, idx) => (
              <div key={idx} className="bg-gray-700/50 p-4 rounded border border-gray-600">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-300">Name</label>
                    <input
                      type="text"
                      value={skill.name}
                      onChange={(e) => {
                        const newSkills = [...skills];
                        newSkills[idx].name = e.target.value;
                        setSkills(newSkills);
                      }}
                      className="w-full bg-gray-600 border border-gray-500 rounded px-2 py-1 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-300">Stat ({skill.stat})</label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={skill.stat}
                      onChange={(e) => {
                        const newSkills = [...skills];
                        newSkills[idx].stat = Number(e.target.value);
                        setSkills(newSkills);
                      }}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-300">Difficulty ({skill.difficulty})</label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={skill.difficulty}
                      onChange={(e) => {
                        const newSkills = [...skills];
                        newSkills[idx].difficulty = Number(e.target.value);
                        setSkills(newSkills);
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="mt-2 text-xs text-amber-400">
                  TST = 50 + ({skill.stat} - {skill.difficulty}) = {50 + (skill.stat - skill.difficulty)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk & Force controls — always visible */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 bg-gray-800 p-6 rounded-lg border border-amber-600/20">
        <div>
          <label className="block text-sm font-semibold mb-2">Critical Fail % ({critChance})</label>
          <input type="range" min="1" max="20" value={critChance}
            onChange={(e) => setCritChance(Number(e.target.value))} className="w-full" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Wounded % ({woundChance})</label>
          <input type="range" min="1" max="50" value={woundChance}
            onChange={(e) => setWoundChance(Number(e.target.value))} className="w-full" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Death % ({deathChance})</label>
          <input type="range" min="1" max="50" value={deathChance}
            onChange={(e) => setDeathChance(Number(e.target.value))} className="w-full" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Force Verdict</label>
          <select value={forcedVerdict} onChange={(e) => setForcedVerdict(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2">
            <option value="">Random</option>
            <option value="bigwin">Big Win</option>
            <option value="win">Win</option>
            <option value="almost">Almost</option>
            <option value="fail">Failure</option>
            <option value="epicfail">Epic Fail</option>
          </select>
        </div>
      </div>

      {/* Skills Display */}
      <div className="mb-8 bg-blue-900/30 border border-blue-700 p-4 rounded-lg">
        <h3 className="text-lg font-bold text-blue-400 mb-3">Skills in Test</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {skills.map((skill, idx) => (
            <div key={idx} className="bg-blue-950 p-3 rounded border border-blue-600/50">
              <p className="text-xs text-blue-300 uppercase">{skill.name}</p>
              <p className="text-lg font-bold text-amber-400">+{skill.stat}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Last Result Display */}
      {lastResult && (
        <div className="mb-8 bg-green-900/30 border border-green-700 p-6 rounded-lg">
          <h3 className="text-2xl font-bold text-green-400 mb-4">Last Result</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-400">Verdict</p>
              <p className="text-xl font-bold text-amber-400">{lastResult.verdict.toUpperCase()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Tested Skill</p>
              <p className="text-xl font-bold text-cyan-400">{lastResult.skillName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">D100 Roll</p>
              <p className="text-xl font-bold text-blue-400">{lastResult.roll}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Risk Roll</p>
              <p className="text-xl font-bold text-red-400">{lastResult.riskRoll}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-green-700">
            <p className="text-sm text-gray-400">Status</p>
            <p className="text-xl font-bold">
              {lastResult.dead ? '☠️ DEAD' : lastResult.wounded ? '🩹 WOUNDED' : '✅ OK'}
            </p>
          </div>
        </div>
      )}

      {/* Component */}
      <div className="border-2 border-amber-600 rounded-lg overflow-hidden">
        <DestinyAstrolabeComponent
          skills={skills}
          criticalFailChance={critChance}
          woundedChance={woundChance}
          deathChance={deathChance}
          onComplete={handleComplete}
          autoStart={true}
          forcedVerdict={forcedVerdict as any}
        />
      </div>
    </div>
  );
}
