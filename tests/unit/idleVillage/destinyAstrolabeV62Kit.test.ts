/**
 * destinyAstrolabeV62Kit — frozen kit contract (R-032 V6.2): the kit keeps the
 * astrolabe inside the SkinSystemProvider chain and exposes the standalone
 * shell wrapper — re-export of the canonical component, never a copy.
 */
import { describe, expect, it } from 'vitest';
import {
  DESTINY_ASTROLABE_V62_PROVIDER_CHAIN,
  DestinyAstrolabeV62,
  DestinyAstrolabeV62KitShell,
  DestinyAstrolabeV62Standalone,
} from '@/ui/idleVillage/frozen/kits/destinyAstrolabeV62Kit';
import { DestinyAstrolabeV62 as CanonicalAstrolabe } from '@/ui/idleVillage/components/destinyAstrolabeV62/DestinyAstrolabeV62';

describe('destinyAstrolabeV62Kit — frozen kit contract', () => {
  // INV:destiny-astrolabe-v62-kit.INV-1 — the kit re-exports the canonical V6.2
  // component by identity, pins the SkinSystemProvider chain and exposes the
  // standalone shell wrapper.
  it('re-exports the canonical component and pins the provider chain', () => {
    expect(DESTINY_ASTROLABE_V62_PROVIDER_CHAIN).toEqual(['SkinSystemProvider']);
    expect(DestinyAstrolabeV62).toBe(CanonicalAstrolabe);
    expect(DestinyAstrolabeV62KitShell).toBeTruthy();
    expect(DestinyAstrolabeV62Standalone).toBeTruthy();
  });
});
