# Coordinator Conversation Log – 2026-01-04 (Part 1)

Fix Village Sandbox Crash
FB

Shared by Fausto Boni on January 4, 2026
Updating plan and next steps

Procedo con questi step:

Stabilizzare il feedback nel controller (useSandboxDragController / startSlotActivity): aggiungo un flag o un “pending message” così setAssignmentFeedback resta impostato almeno finché l’attività non cambia stato (evitando che la stessa startSlotActivity o altri handler lo sovrascrivano immediatamente).

Rivalutare l’handler del job card (handleJobDropzoneDrop in VillageSandbox.tsx): se il controller ora garantisce il messaggio, questo duplicato può diventare superfluo o addirittura conflittuale; lo adeguerò dopo aver toccato il controller.

Rerun Playwright (tests/punch-club-loop.spec.ts + villageSandbox-drag-assign.spec.ts) per confermare che [data-testid="roster-feedback"] appaia e che il drag agganci uno slot reale.

Inizio dal punto 1; ti aggiorno appena ho la patch pronta.

...

(adesso esegui)
