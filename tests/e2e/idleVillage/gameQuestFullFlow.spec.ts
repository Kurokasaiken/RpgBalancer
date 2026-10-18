/**
 * gameQuestFullFlow.spec.ts — R-183: la quest «Goblin Extermination» giocata
 * su `/game` SOLO con input reali, dall'apparizione del POI fino alla HUD.
 *
 *   Regia F10 → «Show quest» (il POI quest compare sulla mappa)
 *   → click sul marker → planner (POI detail)
 *   → drag reali roster→slot → SWAP slot↔slot (drag del token, senza
 *     estrarlo) + swap rifiutato dal gate di eleggibilità
 *   → consumabili scelti dalle tessere del picker esterno della bisaccia
 *     (WS-3: 3 slot icona + UN toggle «quest-tray-toggle» → Selection Tray)
 *   → «Invia spedizione» → controlli tempo HUD (×4)
 *   → la run risolta fase per fase: beat saltati con Enter, scelte
 *     cliccate nella QuestRunWindow, consumabili armati/usati dalla cintura
 *   → rapporto finale → XP ai PG (store + roster + report)
 *   → oro nella HUD (readout del ribbon) → «Chiudi rapporto» → POI goblin
 *   `repeatable` restituito (R-200: mai consumato, torna available)
 *   → reload: XP e oro restano.
 *
 * Differenza con `gameQuestLifecycle.spec.ts`: qui NESSUNA azione passa
 * dagli hook. `__idleVillageTestHooks` è usato solo in LETTURA (assegnazioni,
 * run, settlement, villaggio) per asserire i numeri che la UI racconta.
 *
 * Screenshot: ogni passaggio salva un JPEG allegato al report Playwright.
 * Con `QUEST_DOC_SHOTS=1` gli stessi file finiscono in
 * `src/docs/docs/testing/quest_full_flow/` — sono le immagini del documento
 * `quest_full_flow_walkthrough.md`.
 */

import path from 'node:path';
import fs from 'node:fs';
import { test, expect, type Page, type Locator, type TestInfo } from '@playwright/test';
import { dragResidentPointer } from '../../utils/dragResident';

const POI = 'poi-goblin';
const SLOT_LEADER = `${POI}:goblin-slot-leader`;
const SLOT_MEMBER_1 = `${POI}:goblin-slot-member-1`;
const SLOT_MEMBER_2 = `${POI}:goblin-slot-member-2`;
const SLOT_BODYGUARD = `${POI}:goblin-slot-bodyguard`;
const HERO = 'hero-sir-spaccaculi'; //        edge|fortitude — leader/member/bodyguard
const FOLK_FIGHTER = 'villager-mastro-beppe'; // fortitude — leader o member-1
const FOLK_SCOUT = 'villager-lisetta'; //        precision — member-2, NON leader
const FOLK_GUARD = 'villager-baldassarre'; //    warden    — bodyguard
/** Tre consumabili reali del catalogo (bagSlots = 3). */
const LOADOUT = ['quest_consumable_forza', 'quest_consumable_percezione', 'quest_consumable_cura'] as const;

/* ---------- screenshot del documento ---------- */

const DOC_DIR = path.resolve('src/docs/docs/testing/quest_full_flow');
const docShots = process.env.QUEST_DOC_SHOTS === '1';

/** `target` = ritaglio sull'elemento; `around` = ritaglio della PAGINA sul
 *  box dell'elemento (+margine) — include ciò che vive in un portal sopra di
 *  esso, es. il fantasma del token durante lo swap. */
async function shot(page: Page, info: TestInfo, name: string, target?: Locator, around = false) {
  const file = docShots ? path.join(DOC_DIR, `${name}.jpg`) : info.outputPath(`${name}.jpg`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const opts = { path: file, type: 'jpeg' as const, quality: 74, animations: 'disabled' as const };
  const box = around && target ? await target.boundingBox() : null;
  if (box) {
    const pad = 24;
    const x = Math.max(0, box.x - pad);
    const y = Math.max(0, box.y - pad);
    await page.screenshot({ ...opts, clip: { x, y, width: box.width + pad * 2, height: Math.min(box.height + pad * 2, 1000 - y) } });
  } else if (target) await target.screenshot(opts);
  else await page.screenshot(opts);
  await info.attach(name, { path: file, contentType: 'image/jpeg' });
}

/* ---------- lettura stato (sola lettura) ---------- */

type RunShape = {
  ended: boolean;
  nodeId: string;
  visitedNodes: string[];
  outcome?: string;
  gold?: number;
  xp?: number;
  flags: string[];
  consumablesUsed?: string[];
  party: { id: string; name: string; dead?: boolean; wounded?: boolean; hp: number; maxHp: number }[];
  frontier: { status: 'waiting' | 'pending' | 'ready'; readyAt: number };
  resolvedOffer?: { rewardResolved?: number } | null;
};
type SettlementShape = {
  status: 'settling' | 'settled';
  plan: { outcome: string; effects: { key: string; kind: string; residentId?: string; amount?: number }[] };
};
type VillageShape = {
  gold: number;
  xp: number;
  residents: { id: string; isDead: boolean; isInjured: boolean; xp: number }[];
};

interface HooksWindow extends Window {
  __idleVillageTestHooks?: {
    expedition?: Record<string, Record<string, (...a: unknown[]) => unknown>>;
    getClock?: () => { currentTick: number; isPaused: boolean; speedMultiplier: number };
  };
}

const read = <T,>(page: Page, action: 'getRun' | 'getSettlement' | 'getVillage' | 'getAssignments' | 'getEventLog') =>
  page.evaluate(
    ({ pid, act }) => {
      const exp = (window as HooksWindow).__idleVillageTestHooks?.expedition?.[pid];
      if (!exp?.[act]) throw new Error(`read hook "${act}" missing`);
      return exp[act]();
    },
    { pid: POI, act: action },
  ) as Promise<T>;

const assignments = (page: Page) => read<Record<string, string | null>>(page, 'getAssignments');

/* ---------- DOM ---------- */

const marker = (page: Page) => page.locator(`[data-quest-poi-id="${POI}"]`);
const planner = (page: Page) => page.getByTestId(`floating-panel-quest-expedition-${POI}`);
const sendButton = (page: Page) => page.getByTestId('quest-expedition-send');
const questWindow = (page: Page) => page.getByTestId('quest-window');
const closeReport = (page: Page) => page.getByTestId('quest-window-close-report');
/* R-199 pt.14: il rapporto di ritorno vive nel `quest-reward-popup` — placca
 *  centrata sopra la window che copre `quest-window-close-report`. Chiuderlo
 *  è il dismissal canonico (`closeReward` → run sganciata, POI reso). */
const dismissReport = async (page: Page) => {
  const popup = page.getByTestId('quest-reward-popup');
  if (await popup.isVisible()) {
    const stagedClose = popup.getByTestId('quest-reward-close');
    if (await stagedClose.isVisible()) {
      await stagedClose.click();
    } else {
      await popup.locator('[data-hud-controls] button').first().click();
    }
    return;
  }
  await closeReport(page).click();
};
const speed = (page: Page, mult: 1 | 2 | 4) => page.locator('[role="radiogroup"]').getByRole('radio', { name: `×${mult}` });

const goldReadout = async (page: Page): Promise<number> => {
  const label = await page.getByRole('group', { name: /gold|oro/i }).first().getAttribute('aria-label');
  const digits = (label ?? '').replace(/[^\d]/g, '');
  if (!digits) throw new Error(`gold readout not parseable: "${label}"`);
  return Number(digits);
};

const waitForAssignment = (page: Page, slotId: string, residentId: string | null) =>
  page.waitForFunction(
    ({ pid, sid, rid }) => {
      const exp = (window as HooksWindow).__idleVillageTestHooks?.expedition?.[pid] as
        | { getAssignments?: () => Record<string, string | null> }
        | undefined;
      return (exp?.getAssignments?.()?.[sid] ?? null) === rid;
    },
    { pid: POI, sid: slotId, rid: residentId },
    { timeout: 5_000 },
  );

/** Drag reale card del roster → slot (stesso helper della suite R-119). */
async function dragFromRoster(page: Page, residentId: string, slotId: string) {
  const card = page.locator(`[data-worker-id="${residentId}"]`).first();
  const slot = page.locator(`[data-slot-id="${slotId}"]`).first();
  for (let attempt = 0; attempt < 2; attempt++) {
    await slot.scrollIntoViewIfNeeded();
    await card.scrollIntoViewIfNeeded();
    await dragResidentPointer(page, card, slot);
    try {
      await waitForAssignment(page, slotId, residentId);
      return;
    } catch {
      /* drop mancato: un giocatore riproverebbe una volta */
    }
  }
  throw new Error(`real drag never assigned ${residentId} to ${slotId}`);
}

/**
 * Drag reale del TOKEN già nello slot verso un altro slot (R-183 swap).
 * Tre punti delicati:
 * - il DndContext usa `pointerWithin`: `over` è il droppable sotto il
 *   PUNTATORE, non il token — si mira al centro di `slot-button-*` (il
 *   setNodeRef di useDroppable), non al wrapper `data-slot-id` i cui margini
 *   (label sotto il cerchio) davano `over: null` → drop perso in silenzio;
 * - l'attivazione è a 8 px: il primo move supera subito la soglia, perché
 *   sullo stesso mousedown corre il press-and-hold di estrazione (~560 ms);
 * - il rilascio deve trovare `over` già risolto: micro-move + settle finale
 *   così l'ultimo collision tick registra il puntatore dentro il target.
 * `onMidway` gira col puntatore FERMO SOPRA il target e il drag ancora
 * attivo — il momento in cui lo slot mostra il verdetto `data-drop-state`.
 */
async function dragSlotToken(page: Page, fromSlot: string, toSlot: string, onMidway?: () => Promise<void>) {
  const token = page.getByTestId(`slot-token-${fromSlot}`);
  const target = page.getByTestId(`slot-button-${toSlot}`);
  const a = await token.boundingBox();
  const b = await target.boundingBox();
  if (!a || !b) throw new Error('slot token / target not measurable');
  const from = { x: a.x + a.width / 2, y: a.y + a.height / 2 };
  const to = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  /* supera gli 8px di attivazione prima che il hold di estrazione maturi */
  const kick = { x: from.x + (to.x >= from.x ? 14 : -14), y: from.y + (to.y >= from.y ? 6 : -6) };
  await page.mouse.move(kick.x, kick.y, { steps: 2 });
  await expect(page.getByTestId('slot-token-ghost')).toBeVisible();
  const steps = 8;
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(kick.x + ((to.x - kick.x) * i) / steps, kick.y + ((to.y - kick.y) * i) / steps);
  }
  if (onMidway) await onMidway();
  await page.mouse.move(to.x + 1, to.y);
  await page.mouse.move(to.x, to.y);
  await page.waitForTimeout(60);
  await page.mouse.up();
}

/** F10 → «Show quest» → F10: il POI quest REALE compare sulla mappa. */
async function revealQuestPoiViaDirector(page: Page, info: TestInfo, withShot = true) {
  await page.keyboard.press('F10');
  const director = page.getByTestId('director-panel');
  await expect(director).toBeVisible({ timeout: 10_000 });
  if (withShot) await shot(page, info, '02-regia-show-quest', director);
  await page.locator('[data-action-id="quest"]').click();
  await expect(page.getByTestId('pixi-world-anchors')).toBeVisible({ timeout: 60_000 });
  await expect(marker(page)).toBeVisible({ timeout: 15_000 });
  await page.keyboard.press('F10');
  await expect(director).toBeHidden({ timeout: 5_000 });
}

/* ---------- la run, fase per fase, solo DOM ---------- */

type PhaseRecord = { nodeId: string; kind: 'choice' | 'pending' | 'beat'; option?: string };

/**
 * Gioca la run fino alla fine con input reali:
 * - beat in scena → Enter (salta il beat, come un giocatore);
 * - scelte visibili → (prima volta) arma la cintura; se un membro è ferito
 *   usa la cura; poi clicca la scelta (la prima abilitata; ruota se il
 *   nodo si ripete — push-your-luck);
 * - frontiera `pending` → il tempo scorre da solo a ×4 (nessun advanceTicks).
 */
async function playRunPhaseByPhase(page: Page, info: TestInfo): Promise<PhaseRecord[]> {
  const phases: PhaseRecord[] = [];
  let lastChoiceNode = '';
  let repeats = 0;
  let armed = false;
  let shotChoice = false;
  let shotBeat = false;
  let shotPending = false;
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    if (await closeReport(page).isVisible()) return phases;
    const run = await read<RunShape | null>(page, 'getRun');
    if (!run) throw new Error('run vanished mid-play');

    const beat = page.getByTestId('quest-window-beat');
    if (await beat.isVisible()) {
      if (!shotBeat) {
        shotBeat = true;
        await shot(page, info, '12-run-beat-in-scena', questWindow(page));
      }
      phases.push({ nodeId: run.nodeId, kind: 'beat' });
      /* PLAN-040: un check beat armato tiene sull'overlay esterno finché il
       *  giocatore non lancia — `skipToResult` è no-op pre-throw, quindi il
       *  driver clicca THROW quando lo vede (`.da-tira` è page-level). */
      const astroThrow = page.locator('.da-tira');
      if (await astroThrow.isVisible()) {
        await astroThrow.click().catch(() => undefined);
      } else {
        await page.keyboard.press('Enter');
      }
      await page.waitForTimeout(120);
      continue;
    }

    const enabled = page.locator('[data-testid="quest-window-choice"]:not([disabled])');
    const count = await enabled.count();
    if (count > 0 && !run.ended && run.frontier.status === 'waiting') {
      const belt = page.getByTestId('quest-consumable-belt');
      if (!armed && (await belt.isVisible())) {
        const arm = belt.locator('[data-testid^="belt-arm-"]').first();
        if (await arm.isVisible()) {
          await arm.click();
          await expect(arm).toHaveAttribute('aria-pressed', 'true');
          armed = true;
          await shot(page, info, '11-run-cintura-armata', questWindow(page));
        }
      }
      const hurt = run.party.some((m) => !m.dead && m.hp < m.maxHp);
      const healing = page.getByTestId('belt-healing');
      if (hurt && (await healing.isVisible())) await healing.click();

      if (!shotChoice) {
        shotChoice = true;
        await shot(page, info, '10-run-prima-scelta', questWindow(page));
      }
      repeats = run.nodeId === lastChoiceNode ? repeats + 1 : 0;
      lastChoiceNode = run.nodeId;
      const pick = enabled.nth(Math.min(repeats, count - 1));
      const optionId = (await pick.getAttribute('data-option-id')) ?? '?';
      phases.push({ nodeId: run.nodeId, kind: 'choice', option: optionId });
      await pick.click();
      /* il motore committa la frontiera: aspetta che la UI cambi stato */
      await page
        .waitForFunction(
          ({ pid, fv, node }) => {
            const exp = (window as HooksWindow).__idleVillageTestHooks?.expedition?.[pid] as
              | { getRun?: () => RunShape | null }
              | undefined;
            const r = exp?.getRun?.();
            return !r || r.ended || r.nodeId !== node || r.frontier.readyAt !== fv || r.frontier.status !== 'waiting';
          },
          { pid: POI, fv: run.frontier.readyAt, node: run.nodeId },
          { timeout: 5_000 },
        )
        .catch(() => undefined);
      continue;
    }

    if (!run.ended && run.frontier.status === 'pending') {
      if (!shotPending) {
        shotPending = true;
        await shot(page, info, '13-run-fase-in-viaggio', questWindow(page));
      }
      if (phases.at(-1)?.nodeId !== run.nodeId || phases.at(-1)?.kind !== 'pending') {
        phases.push({ nodeId: run.nodeId, kind: 'pending' });
      }
    }
    await page.waitForTimeout(250);
  }
  throw new Error('run did not reach the report within 180s of real play');
}

/* ================= test ================= */

test.describe('R-183 — quest goblin dal vero su /game (solo input reali)', () => {
  test.use({ viewport: { width: 1600, height: 1000 } });

  test('POI → planner → roster + swap → consumabili → run fase per fase → XP ai PG → oro in HUD', async ({ page }, info) => {
    test.setTimeout(420_000);

    /* ── 1. Boot: auto-reveal R-200, roster aperto col tasto R ───────── */
    await page.goto('/game');
    await page.waitForFunction(
      (pid) => Boolean((window as HooksWindow).__idleVillageTestHooks?.expedition?.[pid]),
      POI,
      { timeout: 60_000 },
    );
    await page.keyboard.press('r');
    await expect(page.locator(`[data-worker-id="${HERO}"]`).first()).toBeVisible({ timeout: 15_000 });
    /* R-200: le offerte si rivelano da sole a stagger dopo il veil — il
     *  contratto R-124 «mappa pulita al boot» è superato, non asseriamo
     *  più il count-0 (sarebbe una race col primo slot dello stagger). */
    const goldBefore = await goldReadout(page);
    const villageBefore = await read<VillageShape>(page, 'getVillage');
    expect(villageBefore.gold).toBe(goldBefore);
    /* Doc shot deterministico: il primo marker (goblin, ~1s post-veil) è
     *  già sulla mappa — lo shot documenta l'auto-reveal, non l'attesa. */
    await expect(marker(page)).toBeVisible({ timeout: 15_000 });
    await shot(page, info, '01-boot-auto-reveal');

    /* ── 2. Creazione del POI quest: la Regia lo rivela ──────────────── */
    await revealQuestPoiViaDirector(page, info);
    await expect(marker(page)).toHaveAttribute('data-quest-status', 'available');
    await shot(page, info, '03-poi-quest-sulla-mappa');

    /* ── 3. Click sul marker → POI detail (quest planner) ────────────── */
    await marker(page).click();
    await expect(planner(page)).toBeVisible();
    await expect(page.getByTestId('quest-planner-hero')).toContainText('Goblin Extermination');
    await expect(sendButton(page)).toBeDisabled();
    await expect(page.getByTestId('quest-expedition-forecast')).toHaveAttribute('data-forecast-state', 'incomplete');

    /* ── 3b. WS-3: hero letterbox + placca forecast esterna (pinned wing) ── */
    const cinema = page.getByTestId('quest-planner-hero');
    await expect(cinema).toBeVisible();
    const cinemaBox = await cinema.boundingBox();
    expect(cinemaBox).not.toBeNull();
    /* letterbox cinematografica — mai più stretta del ~21:9. */
    expect(cinemaBox!.width / cinemaBox!.height).toBeGreaterThanOrEqual(2.6);
    expect(await cinema.locator('img').evaluate((img) => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);

    const forecastCol = page.getByTestId('quest-expedition-forecast-column');
    await expect(forecastCol).toBeVisible();
    /* sidecar ESTERNO, a destra della placca principale (BV-4: ≥840px). */
    const mainBox = await planner(page).boundingBox();
    const sideBox = await forecastCol.boundingBox();
    expect(sideBox!.x).toBeGreaterThanOrEqual(mainBox!.x + mainBox!.width - 1);
    /* Goblin Extermination: Primaria = Forza, Secondaria = Percezione. */
    await expect(page.getByTestId('forecast-key-stats')).toBeVisible();
    await expect(page.getByTestId('forecast-primary-stats')).toContainText(/strength|forza/i);
    await expect(page.getByTestId('forecast-secondary-stats')).toContainText(/perception|percezione/i);
    await shot(page, info, '04-planner-vuoto', planner(page));

    /* ── 4. Party dal roster: drag reali ────────────────────────────── */
    await dragFromRoster(page, FOLK_FIGHTER, SLOT_LEADER); // Beppe parte da capo…
    await dragFromRoster(page, HERO, SLOT_MEMBER_1); //      …e l'eroe da gregario
    await dragFromRoster(page, FOLK_SCOUT, SLOT_MEMBER_2);
    await dragFromRoster(page, FOLK_GUARD, SLOT_BODYGUARD);
    await expect(page.getByTestId('quest-expedition-forecast')).toHaveAttribute('data-forecast-state', 'ready', {
      timeout: 30_000,
    });
    await shot(page, info, '05-party-prima-dello-swap', planner(page));

    /* ── 5. SWAP slot↔slot senza estrarre: eroe ⇄ Beppe ─────────────── */
    /* drop perso (pointerWithin): un giocatore riproverebbe una volta —
     *  lo swap è idempotente, un secondo tentativo è safe. */
    let swapped = false;
    for (let attempt = 0; attempt < 2 && !swapped; attempt++) {
      await dragSlotToken(page, SLOT_LEADER, SLOT_MEMBER_1, async () => {
        await expect(page.getByTestId('slot-token-ghost')).toBeVisible();
        /* `[data-drop-state]` qualifica il castone: `data-slot-id` da solo
         * matcha anche le righe BY MEMBER del forecast (WS-3). */
        await expect(page.locator(`[data-slot-id="${SLOT_MEMBER_1}"][data-drop-state]`).first()).toHaveAttribute('data-drop-state', 'valid');
        await shot(page, info, '06-swap-token-in-aria', planner(page), true);
      });
      swapped = await waitForAssignment(page, SLOT_LEADER, HERO).then(() => true, () => false);
    }
    await waitForAssignment(page, SLOT_LEADER, HERO);
    await waitForAssignment(page, SLOT_MEMBER_1, FOLK_FIGHTER);
    /* nessuno è uscito dal rack: il party è ancora di 4 */
    const afterSwap = await assignments(page);
    expect(Object.values(afterSwap).filter(Boolean)).toHaveLength(4);
    await shot(page, info, '07-party-dopo-lo-swap', planner(page));

    /* swap RIFIUTATO: Lisetta (precision) non può fare il capo (edge|fortitude) */
    await dragSlotToken(page, SLOT_MEMBER_2, SLOT_LEADER, async () => {
      await expect(page.locator(`[data-slot-id="${SLOT_LEADER}"][data-drop-state]`).first()).toHaveAttribute('data-drop-state', 'invalid');
    });
    await page.waitForTimeout(400);
    expect(await assignments(page)).toEqual(afterSwap);

    /* ── 6. Consumabili: bisaccia a 3 slot + Selection Tray (WS-3) ── */
    await expect(page.locator('[data-testid^="bag-slot-"]')).toHaveCount(3);
    const pickerToggle = page.getByTestId('quest-tray-toggle');
    await expect(pickerToggle).toBeVisible();
    await pickerToggle.click();
    const picker = page.getByTestId('quest-selection-tray');
    await expect(picker).toBeVisible();
    for (const itemId of LOADOUT) {
      const tile = page.getByTestId(`picker-item-${itemId}`);
      await tile.scrollIntoViewIfNeeded();
      await tile.click();
      await expect(tile).toHaveAttribute('aria-pressed', 'true');
    }
    /* borsa piena: le tessere non scelte si disabilitano (i tab del tray
     *  usano `aria-selected`, non `aria-pressed` — restano fuori). */
    await expect(picker.locator('[data-testid^="picker-item-"][aria-pressed="false"]').first()).toBeDisabled();
    /* `loadout-item-<id>` vive SOLO sul bottone dello slot pieno — un nodo
     *  per item, nessuna collisione strict-mode con le tessere del picker. */
    for (const itemId of LOADOUT) {
      await expect(page.getByTestId(`loadout-item-${itemId}`)).toHaveCount(1);
    }
    /* Escape chiude SOLO il tray e riporta il focus sul toggle. */
    await page.keyboard.press('Escape');
    await expect(picker).toHaveCount(0);
    await expect(pickerToggle).toBeFocused();
    await expect(page.getByTestId('loadout-coverage')).toBeVisible();
    await shot(page, info, '08-loadout-consumabili', planner(page));

    /* ── 7. «Invia spedizione» ──────────────────────────────────────── */
    await expect(sendButton(page)).toBeEnabled();
    await sendButton(page).scrollIntoViewIfNeeded();
    await sendButton(page).click();
    await expect(questWindow(page)).toBeVisible({ timeout: 10_000 });
    await expect(marker(page)).toHaveAttribute('data-quest-status', 'in_progress');
    const started = await read<RunShape>(page, 'getRun');
    expect(started.party.map((m) => m.id)).toEqual([HERO, FOLK_FIGHTER, FOLK_SCOUT, FOLK_GUARD]);
    /* la borsa congelata nella run = i tre consumabili scelti */
    expect(started.flags).toEqual(expect.arrayContaining(['hasBonusForza', 'hasBonusPerc', 'hasHealing']));
    await shot(page, info, '09-spedizione-partita');

    /* tempo a ×4 dal controllo HUD — le fasi in viaggio maturano da sole */
    await speed(page, 4).click();
    await expect(speed(page, 4)).toHaveAttribute('aria-checked', 'true');

    /* ── 8. La run, fase per fase ───────────────────────────────────── */
    const phases = await playRunPhaseByPhase(page, info);
    const choices = phases.filter((p) => p.kind === 'choice');
    expect(choices.length).toBeGreaterThan(0);
    const terminal = await read<RunShape>(page, 'getRun');
    expect(terminal.ended).toBe(true);
    expect(terminal.visitedNodes.length).toBeGreaterThan(1);
    info.annotations.push({
      type: 'run',
      description: `outcome=${terminal.outcome} · nodi=${terminal.visitedNodes.join('→')} · scelte=${choices
        .map((c) => `${c.nodeId}:${c.option}`)
        .join(', ')} · consumati=${(terminal.consumablesUsed ?? []).join(',') || '—'}`,
    });

    /* ── 9. Settlement → rapporto ───────────────────────────────────── */
    await page.waitForFunction(
      (pid) => {
        const exp = (window as HooksWindow).__idleVillageTestHooks?.expedition?.[pid] as
          | { getSettlement?: () => SettlementShape | null }
          | undefined;
        return exp?.getSettlement?.()?.status === 'settled';
      },
      POI,
      { timeout: 15_000 },
    );
    const settlement = await read<SettlementShape>(page, 'getSettlement');
    const report = page.getByTestId('quest-epilogue');
    await expect(report).toBeVisible();
    /* R-199: per esito `reward` l'epilogo sta nel `quest-reward-popup`
     *  esterno; per survived/wipe resta nella window — lo shot punta a
     *  quello che lo contiene davvero. */
    const rewardPopup = page.getByTestId('quest-reward-popup');
    const reportHost = (await rewardPopup.isVisible()) ? rewardPopup : questWindow(page);
    await shot(page, info, '14-rapporto-di-ritorno', reportHost);

    /* consumabili usati → riga «consumati» nel rapporto */
    if ((terminal.consumablesUsed ?? []).length > 0) {
      await expect(report.locator('[data-epilogue-section="consumed"]')).toBeVisible();
    }

    /* ── 10. XP ai PG ───────────────────────────────────────────────── */
    const xpEffects = settlement.plan.effects.filter((e) => e.kind === 'resident-xp');
    const survivors = terminal.party.filter((m) => !m.dead);
    const village = await read<VillageShape>(page, 'getVillage');
    if (terminal.outcome === 'wipe' || !(terminal.xp && terminal.xp > 0)) {
      expect(xpEffects).toHaveLength(0);
    } else {
      expect(xpEffects.map((e) => e.residentId).sort()).toEqual(survivors.map((m) => m.id).sort());
      for (const effect of xpEffects) {
        const before = villageBefore.residents.find((r) => r.id === effect.residentId)?.xp ?? 0;
        const after = village.residents.find((r) => r.id === effect.residentId)?.xp ?? 0;
        expect(after - before).toBe(effect.amount);
        /* il roster mostra lo stesso numero */
        await expect(page.locator(`[data-resident-id="${effect.residentId}"][data-resident-xp]`).first()).toHaveAttribute(
          'data-resident-xp',
          String(after),
        );
      }
      const xpSection = report.locator('[data-epilogue-section="xp"]');
      await expect(xpSection).toBeVisible();
      for (const m of survivors) await expect(xpSection).toContainText(m.name);
      /* il rapporto scorre dentro il suo host (popup o window): porta in vista la XP per lo scatto */
      await xpSection.scrollIntoViewIfNeeded();
      await shot(page, info, '14b-rapporto-xp-ai-pg', reportHost);
      /* i morti non prendono nulla */
      for (const m of terminal.party.filter((p) => p.dead)) {
        expect(village.residents.find((r) => r.id === m.id)?.xp ?? 0).toBe(
          villageBefore.residents.find((r) => r.id === m.id)?.xp ?? 0,
        );
      }
    }

    /* ── 11. Risorse nella HUD ──────────────────────────────────────── */
    const goldEffects = settlement.plan.effects
      .filter((e) => e.kind === 'village-gold')
      .reduce((sum, e) => sum + (e.amount ?? 0), 0);
    expect(village.gold - villageBefore.gold).toBe(goldEffects);
    await expect.poll(() => goldReadout(page), { timeout: 5_000 }).toBe(goldBefore + goldEffects);
    await shot(page, info, '15-hud-oro-e-roster');

    /* ── 12. Chiudi rapporto → POI ripetibile restituito ──────────────
     *  R-200 (D-1): `poi-goblin` è authored `repeatable` — il report non
     *  consuma il POI: il marker resta sulla mappa, la run è azzerata e
     *  l'offerta torna `available` (rilanciabile). */
    await dismissReport(page);
    await expect(questWindow(page)).toHaveCount(0);
    await expect(marker(page)).toBeVisible({ timeout: 10_000 });
    await expect(marker(page)).toHaveAttribute('data-quest-status', 'available');
    expect(await read<RunShape | null>(page, 'getRun')).toBeNull();
    await shot(page, info, '16-poi-ripetibile-restituito');

    /* ── 13. Reload: XP e oro sono persistiti ───────────────────────── */
    await page.waitForTimeout(1_500); // lascia passare l'autosave debounced
    await page.reload();
    await page.waitForFunction(
      (pid) => Boolean((window as HooksWindow).__idleVillageTestHooks?.expedition?.[pid]),
      POI,
      { timeout: 60_000 },
    );
    /* il salvataggio è stato davvero caricato (non un boot da config): il
     *  registro del villaggio ricorda l'esito della spedizione */
    await expect
      .poll(async () => (await read<{ type: string | null }[]>(page, 'getEventLog')).some((e) => e.type === 'quest_outcome'), {
        timeout: 15_000,
      })
      .toBe(true);
    const reloaded = await read<VillageShape>(page, 'getVillage');
    expect(reloaded.gold).toBe(village.gold);
    /* La visibilità del marker dopo reload è governata dal reveal (R-200:
     *  auto-reveal staggered, contratto in evoluzione) — qui si asserisce solo
     *  la persistenza dei dati, non il lifecycle del marker. */
    for (const effect of xpEffects) {
      expect(reloaded.residents.find((r) => r.id === effect.residentId)?.xp).toBe(
        village.residents.find((r) => r.id === effect.residentId)?.xp,
      );
    }
  });

  test('il roster segue il POI detail: si apre se era chiuso e si richiude col detail; se era aperto resta aperto', async ({ page }, info) => {
    await page.goto('/game');
    await page.waitForFunction(
      (pid) => Boolean((window as HooksWindow).__idleVillageTestHooks?.expedition?.[pid]),
      POI,
      { timeout: 60_000 },
    );
    const roster = page.getByTestId('roster-drag-handle');
    const closeDetail = page.getByTestId(`floating-panel-close-quest-expedition-${POI}`);
    await revealQuestPoiViaDirector(page, info, false);

    /* roster chiuso → il detail lo apre, e chiudendo il detail si richiude */
    await expect(roster).toHaveCount(0);
    await marker(page).click();
    await expect(planner(page)).toBeVisible();
    await expect(roster).toBeVisible();
    await expect(page.locator(`[data-worker-id="${HERO}"]`).first()).toBeVisible();
    await shot(page, info, '04b-roster-si-apre-col-detail');
    await closeDetail.click();
    await expect(planner(page)).toHaveCount(0);
    await expect(roster).toHaveCount(0);

    /* roster aperto dal giocatore → il detail lo lascia stare, anche alla chiusura */
    await page.keyboard.press('r');
    await expect(roster).toBeVisible();
    await marker(page).click();
    await expect(planner(page)).toBeVisible();
    await expect(roster).toBeVisible();
    await closeDetail.click();
    await expect(planner(page)).toHaveCount(0);
    await expect(roster).toBeVisible();
  });
});
