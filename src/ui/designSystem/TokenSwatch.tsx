import React from 'react';

/**
 * TokenSwatch — a single design-token specimen.
 *
 * The chrome styles itself with `--skin-*` vars only, so the swatch card
 * always matches the active skin. Paintable values (colors/gradients) render
 * as a color chip; non-paintable values (fonts, radii, shadows, clip-paths)
 * render as a text chip.
 *
 * @param tokenName - CSS custom property name (e.g. '--skin-title-color')
 * @param tokenValue - Resolved value of the token
 * @param label - Optional display label
 * @param source - Optional provenance ('base' | 'override') shown as a badge
 */
interface TokenSwatchProps {
  tokenName: string;
  tokenValue: string;
  label?: string;
  source?: 'base' | 'override';
}

function isPaintable(value: string): boolean {
  const v = value.trim();
  return (
    v.startsWith('#') ||
    v.startsWith('rgb') ||
    v.startsWith('hsl') ||
    v.includes('linear-gradient') ||
    v.includes('radial-gradient') ||
    v.includes('repeating-linear-gradient')
  );
}

export function TokenSwatch({ tokenName, tokenValue, label, source }: TokenSwatchProps) {
  const displayLabel = label || tokenName.replace('--', '').replace(/-/g, ' ');
  const slug = tokenName.replace('--', '');
  const paintable = isPaintable(tokenValue);

  return (
    <div
      className="flex flex-col items-center p-3"
      style={{
        background: 'var(--skin-inset-bg)',
        border: '1px solid var(--skin-inset-border)',
        borderRadius: 'var(--skin-inset-radius)',
      }}
      data-testid={`token-swatch-${slug}`}
    >
      {paintable ? (
        <div
          className="w-16 h-16 mb-2"
          style={{
            background: tokenValue,
            border: '1px solid var(--skin-separator)',
            borderRadius: 'var(--skin-inset-radius)',
          }}
          data-testid={`token-color-${slug}`}
        />
      ) : (
        <div
          className="w-full h-16 mb-2 flex items-center justify-center px-1 text-center"
          style={{
            border: '1px dashed var(--skin-separator)',
            borderRadius: 'var(--skin-inset-radius)',
            color: 'var(--skin-text-secondary)',
            fontSize: '10px',
            overflow: 'hidden',
          }}
          data-testid={`token-color-${slug}`}
        >
          <span style={{ maxHeight: '100%', overflow: 'hidden' }}>{tokenValue}</span>
        </div>
      )}

      <div
        className="text-xs font-mono mb-1 text-center"
        style={{ color: 'var(--skin-text-primary)' }}
        data-testid={`token-name-${slug}`}
      >
        {displayLabel}
      </div>

      <div
        className="text-xs font-mono text-center break-all"
        style={{ color: 'var(--skin-text-muted)', maxWidth: '100%' }}
        data-testid={`token-value-${slug}`}
      >
        {tokenValue.length > 42 ? `${tokenValue.slice(0, 42)}…` : tokenValue}
      </div>

      {source === 'override' && (
        <span data-skin="badge" style={{ marginTop: '6px', fontSize: '9px' }} data-testid={`token-source-${slug}`}>
          preset override
        </span>
      )}
    </div>
  );
}

/**
 * TokenSwatchGrid — grid of TokenSwatch specimens.
 */
interface TokenSwatchGridProps {
  tokens: Array<{
    name: string;
    value: string;
    label?: string;
    source?: 'base' | 'override';
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
          source={token.source}
        />
      ))}
    </div>
  );
}
