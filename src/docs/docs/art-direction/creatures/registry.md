---
type: creature-registry
status: canonical
version: "1.0.0"
---

# Creature Registry

All entries follow the Creature IP Development System lifecycle:

- **draft** → exploration
- **candidate** → validated
- **canonical** → approved world truth
- **deprecated** → rejected or replaced

## Families

| Family | Pillar | Status | Version | Authority |
| --- | --- | --- | --- | --- |
| [Forest Parasites](families/forest-parasites/family-dna.md) | wilderness | canonical | 1.0.0 | family |
| [Ancient Constructs](families/ancient-constructs/family-dna.md) | empire | canonical | 1.0.0 | family |
| [Mythic Beasts](families/mythic-beasts/family-dna.md) | wilderness | canonical | 1.0.0 | family |
| [Beasts](families/beasts/family-dna.md) | empire | canonical | 1.0.0 | family |

## Creatures

| Creature | Family | Type | Tier | Status | Version | Authority |
| --- | --- | --- | --- | --- | --- | --- |
| [Gnarled Nightmare](creatures/gnarled-nightmare/identity.md) | Forest Parasites | Parasite | Early/Mid — Rare | canonical | 1.0.0 | creature |
| [Bronze Relic Guardian](creatures/bronze-relic-guardian/identity.md) | Ancient Constructs | Relic Guardian | Mid — Rare | canonical | 1.0.0 | creature |
| [Emerald Scale Serpent](creatures/emerald-scale-serpent/identity.md) | Mythic Beasts | Mythic Serpent | Mid/Late — Epic | canonical | 1.0.0 | creature |
| [Momentum Bruiser](creatures/momentum-bruiser/identity.md) | Beasts | Bruiser | Early/Mid — Common | canonical | 1.0.0 | creature |

## Versioning Rules

- **MAJOR** — identity or family DNA change; world truth affected
- **MINOR** — visual refinement, prompt tuning, or decision added
- **PATCH** — typo, link fix, or reference update

## Authority Levels

| Level | What it controls |
| --- | --- |
| **world** | global tone, color rules, kill list |
| **art** | art stack, rendering rules, material grammar |
| **family** | family DNA, rejected directions, evolution grammar |
| **creature** | identity card, prompt, reference card, decision log |
| **detail** | single image variant, pose, color tweak |

Any change must be approved at the matching authority level or higher.
