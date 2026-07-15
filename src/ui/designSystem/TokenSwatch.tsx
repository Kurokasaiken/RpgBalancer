import React from 'react';

/**
 * TokenSwatch Component
 * 
 * Componente headless che renderizza un quadrato colorato con nome token e valore hex/rgb.
 * Legge i token CSS da wanderlustTokens.css e li mostra come swatch visivi.
 * 
 * @param tokenName - Nome del token CSS (es. '--void', '--acc-primary')
 * @param tokenValue - Valore del token (hex/rgb)
 * @param label - Label opzionale per il token
 */
interface TokenSwatchProps {
  tokenName: string;
  tokenValue: string;
  label?: string;
}

export function TokenSwatch({ tokenName, tokenValue, label }: TokenSwatchProps) {
  const displayLabel = label || tokenName.replace('--', '').replace(/-/g, ' ');
  
  return (
    <div 
      className="flex flex-col items-center p-3 rounded border border-slate-700 bg-slate-800/50"
      data-testid={`token-swatch-${tokenName.replace('--', '')}`}
    >
      {/* Color Swatch */}
      <div
        className="w-16 h-16 rounded border border-slate-600 mb-2"
        style={{ 
          backgroundColor: tokenValue,
          boxShadow: `0 0 12px ${tokenValue}40`
        }}
        data-testid={`token-color-${tokenName.replace('--', '')}`}
      />
      
      {/* Token Name */}
      <div className="text-xs text-slate-300 font-mono mb-1" data-testid={`token-name-${tokenName.replace('--', '')}`}>
        {displayLabel}
      </div>
      
      {/* Token Value */}
      <div className="text-xs text-slate-500 font-mono" data-testid={`token-value-${tokenName.replace('--', '')}`}>
        {tokenValue}
      </div>
    </div>
  );
}

/**
 * TokenSwatchGrid Component
 * 
 * Griglia di TokenSwatch per mostrare più token insieme.
 * 
 * @param tokens - Array di token da mostrare
 */
interface TokenSwatchGridProps {
  tokens: Array<{
    name: string;
    value: string;
    label?: string;
  }>;
}

export function TokenSwatchGrid({ tokens }: TokenSwatchGridProps) {
  return (
    <div 
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
      data-testid="token-swatch-grid"
    >
      {tokens.map((token) => (
        <TokenSwatch
          key={token.name}
          tokenName={token.name}
          tokenValue={token.value}
          label={token.label}
        />
      ))}
    </div>
  );
}
