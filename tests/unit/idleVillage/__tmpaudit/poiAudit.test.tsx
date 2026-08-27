import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
vi.mock('@/localization/useTranslation', () => ({
  useTranslation: () => ({ t: (_k: string, o?: any) => o?.defaultValue ?? 'x' }),
}));
import PoiMatericV3 from '@/ui/idleVillage/components/poi/PoiMatericV3';

describe('audit', () => {
  beforeEach(() => { vi.spyOn(Math, 'random').mockReturnValue(0.5); });
  it('semantics', () => {
    const h = (p: any) => render(<PoiMatericV3 {...p} />).container.innerHTML;
    const base = h({ type: 'quest', state: 'available' });
    console.log('type job     identical:', h({type:'job',state:'available'}) === base);
    console.log('type event   identical:', h({type:'event',state:'available'}) === base);
    console.log('state new    identical:', h({type:'quest',state:'new'}) === base);
    console.log('selected     identical:', h({type:'quest',state:'available',selected:true}) === base);
    console.log('disabled     identical:', h({type:'quest',state:'available',disabled:true}) === base);
    console.log('importance   identical:', h({type:'quest',state:'available',importance:'critical'}) === base);
    // durationMs / autoStart / onExpire
    const spy = vi.fn();
    render(<PoiMatericV3 type="quest" state="assigned" durationMs={10} autoStart onExpire={spy} progress={0.2} />);
    console.log('onExpire wired (sync):', spy.mock.calls.length);
    // per-instance randomness -> two markers differ?
    (Math.random as any).mockRestore();
    const x = h({type:'quest',state:'available'}), y = h({type:'quest',state:'available'});
    console.log('two instances byte-identical:', x === y);
    expect(true).toBe(true);
  });
});
