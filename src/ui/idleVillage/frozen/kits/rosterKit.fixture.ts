/**
 * rosterKit.fixture
 *
 * Re-export of the canonical resident data source used by TestRosterPage. Per
 * Plan v2 §S1, no inline mock arrays are permitted here — the fixture is the
 * same code path that production uses.
 *
 * To freeze a specific fixture version, the `cert.json` for this kit pins the
 * SHA-256 of `MINIMAL_GAMEPLAY_RESIDENTS` and `TEST_ROSTER_HEROES` at the time
 * of certification. A change to either upstream file will fail the contract
 * test until re-certification.
 */

export {
  MINIMAL_GAMEPLAY_RESIDENTS as rosterKitMinimalGameplayResidents,
  TEST_ROSTER_HEROES as rosterKitTestRosterHeroes,
  TEST_RESIDENTS as rosterKitTestResidents,
} from '../_infra/CanonicalDataBridge';

export { canonicalResidentData as rosterKitFixtureResidents } from '../_infra/CanonicalDataBridge';
