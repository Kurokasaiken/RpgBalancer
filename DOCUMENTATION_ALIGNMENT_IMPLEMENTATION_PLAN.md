# Documentation Alignment Implementation Plan

**Purpose:** Align new documentation files with project policies, philosophy, and governance structure
**Created:** 2026-05-20
**Status:** Draft
**Owner:** Documentation Strategist

---

## Executive Summary

This plan defines the steps to integrate 9 newly created documentation files into the existing RPG project documentation structure, ensuring compliance with:
- Project philosophy (weight-based creator pattern, config-first architecture)
- Documentation governance (single source of truth, separation of concerns)
- MASTER_PLAN.md governance rules (plans vs tasks separation)
- RPG_PROJECT_CONTEXT.md semantic constraints

---

## 1. File Classification

### 1.1 Permanent Documentation (Keep and Integrate)

| File | Type | Purpose | Target Location |
|------|------|---------|-----------------|
| `idle-village-card-system-description.md` | Technical spec | Complete card system architecture | `src/docs/docs/idle_village/card_system_description.md` |
| `idle-village-documentation-governance-pack.md` | Governance policy | Single source of truth rules for docs | `src/docs/docs/DOCUMENTATION_GOVERNANCE.md` |
| `context/VERTICAL_SLICE_REFERENCE.md` | Governance reference | Versioning and governance for vertical slice | Keep in `context/` (already correct) |
| `context/VERTICAL_SLICE_ENTITIES_FULL.md` | Reference inventory | Complete entity inventory for vertical slice | Keep in `context/` (already correct) |
| `VERTICAL_SLICE_IMPLEMENTATION_PLAN.md` | Implementation plan | 6-phase incremental build plan | Move to `src/docs/docs/plans/vertical_slice_implementation_plan.md` |
| `VERTICAL_SLICE_START_HERE.md` | Entry point | Vertical slice navigation guide | Move to `src/docs/docs/minimal_slice/START_HERE.md` |

### 1.2 Temporary Documentation (Archive)

| File | Type | Purpose | Action |
|------|------|---------|--------|
| `FILES_CREATED_THIS_SESSION.md` | Session inventory | File inventory for current session | Move to `archive/session_inventories/FILES_CREATED_THIS_SESSION.md` |
| `INDEX_START_HERE.md` | Session navigation | Temporary index for current session | Move to `archive/session_navigation/INDEX_START_HERE.md` |
| `idle_village_conversation_context_handoff.md` | Session handoff | Conversation context for continuation | Move to `archive/session_handoffs/idle_village_conversation_context_handoff.md` |

---

## 2. Alignment Tasks

### Phase 1: File Reorganization (2 hours)

#### Task 1.1: Move Permanent Files
- [ ] Move `idle-village-card-system-description.md` → `src/docs/docs/idle_village/card_system_description.md`
- [ ] Move `idle-village-documentation-governance-pack.md` → `src/docs/docs/DOCUMENTATION_GOVERNANCE.md`
- [ ] Move `VERTICAL_SLICE_IMPLEMENTATION_PLAN.md` → `src/docs/docs/plans/vertical_slice_implementation_plan.md`
- [ ] Move `VERTICAL_SLICE_START_HERE.md` → `src/docs/docs/minimal_slice/START_HERE.md`

#### Task 1.2: Archive Temporary Files
- [ ] Create directories: `archive/session_inventories/`, `archive/session_navigation/`, `archive/session_handoffs/`
- [ ] Move `FILES_CREATED_THIS_SESSION.md` → `archive/session_inventories/`
- [ ] Move `INDEX_START_HERE.md` → `archive/session_navigation/`
- [ ] Move `idle_village_conversation_context_handoff.md` → `archive/session_handoffs/`

#### Task 1.3: Verify Context Files
- [ ] Confirm `context/VERTICAL_SLICE_REFERENCE.md` is in correct location
- [ ] Confirm `context/VERTICAL_SLICE_ENTITIES_FULL.md` is in correct location
- [ ] Confirm `context/RPG_PROJECT_CONTEXT.md` is in correct location

---

### Phase 2: Content Alignment (4 hours)

#### Task 2.1: Align `DOCUMENTATION_GOVERNANCE.md` with Project Philosophy

**Required Changes:**
- [ ] Add reference to `PROJECT_PHILOSOPHY.md` weight-based creator pattern
- [ ] Add reference to `MASTER_PLAN.md` separation of concerns (plans vs tasks)
- [ ] Add reference to `DEVELOPMENT_GUIDELINES.md` config-first rules
- [ ] Update "Single Source of Truth" section to align with MASTER_PLAN.md governance
- [ ] Add "Trusted Component Registry" reference from MASTER_PLAN.md §96
- [ ] Add "Freeze Governance" section aligning with RPG_PROJECT_CONTEXT.md §3.1
- [ ] Add "Documentation Update Workflow" aligning with MASTER_PLAN.md §52-67

**Validation:**
- [ ] No contradictions with existing governance documents
- [ ] All references link to correct files
- [ ] Naming conventions match project standards

#### Task 2.2: Align `card_system_description.md` with Config-First Philosophy

**Required Changes:**
- [ ] Add reference to `DEVELOPMENT_GUIDELINES.md` §2 (Config-First rules)
- [ ] Add reference to `PROJECT_PHILOSOPHY.md` §186 (Config-Driven Architecture)
- [ ] Update all examples to use config-driven patterns (no hardcoded values)
- [ ] Add "Configuration Schema" section with Zod validation references
- [ ] Add "Persistence" section referencing `PersistenceService` from DEVELOPMENT_GUIDELINES.md §2.1
- [ ] Update "Testing" section to align with RPG_PROJECT_CONTEXT.md §5

**Validation:**
- [ ] All code examples follow config-first pattern
- [ ] No hardcoded values in examples
- [ ] All imports reference config modules
- [ ] Test strategy aligns with Playwright standards

#### Task 2.3: Align `vertical_slice_implementation_plan.md` with Semantic Constraints

**Required Changes:**
- [ ] Add reference to `RPG_PROJECT_CONTEXT.md` §3 (Core Semantic Constraints)
- [ ] Update freezing semantics table to match RPG_PROJECT_CONTEXT.md §3.1
- [ ] Add "Guard Layers" section referencing G1-G6 from RPG_PROJECT_CONTEXT.md
- [ ] Update "Test Categories" to match RPG_PROJECT_CONTEXT.md §5.2
- [ ] Add "Documentation Standards" section referencing RPG_PROJECT_CONTEXT.md §4
- [ ] Update "File Structure" to match RPG_PROJECT_CONTEXT.md §6

**Validation:**
- [ ] Freezing rules match exactly
- [ ] Guard layers documented
- [ ] Test categories exhaustive
- [ ] File structure matches actual project layout

#### Task 2.4: Align `START_HERE.md` with Navigation Structure

**Required Changes:**
- [ ] Add reference to `MASTER_PLAN.md` as top-level governance
- [ ] Add reference to `IMPLEMENTATION_PLANS_INDEX.md` for plan navigation
- [ ] Add reference to `minimal_slice/00_README.md` as phase index
- [ ] Add "Related Documentation" section linking to:
  - `src/docs/docs/idle_village/card_system_description.md`
  - `context/VERTICAL_SLICE_ENTITIES_FULL.md`
  - `src/docs/docs/DOCUMENTATION_GOVERNANCE.md`
- [ ] Update "Key Concepts" to align with RPG_PROJECT_CONTEXT.md glossary

**Validation:**
- [ ] All links resolve correctly
- [ ] No circular references
- [ ] Navigation hierarchy clear

---

### Phase 3: Integration with Existing Documents (2 hours)

#### Task 3.1: Update MASTER_PLAN.md

**Add Section: "Vertical Slice Documentation Governance"**
- [ ] Link to `src/docs/docs/DOCUMENTATION_GOVERNANCE.md`
- [ ] Link to `context/VERTICAL_SLICE_REFERENCE.md`
- [ ] Define vertical slice docs as sub-system with own rules
- [ ] Add to "Documentation Governance" section
- [ ] Update "Trusted Component Registry" to include vertical slice components

**Add Section: "Phase 12: Vertical Slice Documentation"**
- [ ] Link to `src/docs/docs/plans/vertical_slice_implementation_plan.md`
- [ ] Link to `src/docs/docs/idle_village/card_system_description.md`
- [ ] Link to `context/VERTICAL_SLICE_ENTITIES_FULL.md`
- [ ] Define relationship to existing Phase 12 plans

#### Task 3.2: Update IMPLEMENTATION_PLANS_INDEX.md

**Add Entry: "Vertical Slice Implementation Plan"**
- [ ] Title: Vertical Slice Implementation Plan
- [ ] Status: Active
- [ ] Link to `src/docs/docs/plans/vertical_slice_implementation_plan.md`
- [ ] Link to `src/docs/docs/minimal_slice/START_HERE.md`
- [ ] Link to `context/VERTICAL_SLICE_ENTITIES_FULL.md`
- [ ] Define relationship to Phase 12 plans

#### Task 3.3: Update minimal_slice/00_README.md

**Add Section: "Related Documentation"**
- [ ] Link to `src/docs/docs/idle_village/card_system_description.md`
- [ ] Link to `context/VERTICAL_SLICE_ENTITIES_FULL.md`
- [ ] Link to `src/docs/docs/DOCUMENTATION_GOVERNANCE.md`
- [ ] Link to `context/RPG_PROJECT_CONTEXT.md`

#### Task 3.4: Update DEVELOPMENT_GUIDELINES.md

**Add Section: "Vertical Slice Development Rules"**
- [ ] Link to `src/docs/docs/DOCUMENTATION_GOVERNANCE.md`
- [ ] Define when to use vertical slice docs vs general docs
- [ ] Add reference to RPG_PROJECT_CONTEXT.md for semantic constraints
- [ ] Add "Documentation Update Checklist" for vertical slice changes

---

### Phase 4: Update RPG_PROJECT_CONTEXT.md (2 hours)

#### Task 4.1: Add New References to Appendix

**Update §10 "Appendix: Key Files Reference"**
- [ ] Add entry for `src/docs/docs/DOCUMENTATION_GOVERNANCE.md` (governance policies)
- [ ] Add entry for `src/docs/docs/idle_village/card_system_description.md` (card system)
- [ ] Add entry for `src/docs/docs/plans/vertical_slice_implementation_plan.md` (implementation plan)
- [ ] Add entry for `context/VERTICAL_SLICE_REFERENCE.md` (versioning)
- [ ] Add entry for `context/VERTICAL_SLICE_ENTITIES_FULL.md` (entity inventory)

#### Task 4.2: Update §4 "Documentation Standards"

**Add Subsection: "4.4 Documentation Governance Pack"**
- [ ] Link to `src/docs/docs/DOCUMENTATION_GOVERNANCE.md`
- [ ] Summarize single source of truth rules
- [ ] Summarize freeze governance
- [ ] Summarize documentation update workflow

#### Task 4.3: Update §6 "File Organization"

**Update Project Root Structure**
- [ ] Add `src/docs/docs/DOCUMENTATION_GOVERNANCE.md` to structure
- [ ] Add `src/docs/docs/idle_village/card_system_description.md` to structure
- [ ] Add `src/docs/docs/plans/vertical_slice_implementation_plan.md` to structure
- [ ] Add `archive/` directory to structure (for temporary files)

#### Task 4.4: Update §9 "Glossary"

**Add Terms:**
- [ ] Add "Action Card" (from card_system_description.md)
- [ ] Add "Verb Card" (from card_system_description.md)
- [ ] Add "Vertical Slice" (from vertical_slice_implementation_plan.md)
- [ ] Add "Freezing Semantics" (already exists, ensure consistent)

#### Task 4.5: Update §11.9 "Integration Phase Complete"

**Add Documentation Created**
- [ ] List all new permanent documentation files
- [ ] Link to each file
- [ ] Note alignment with project governance

---

### Phase 5: Validation & Testing (1 hour)

#### Task 5.1: Link Validation
- [ ] Verify all internal links resolve
- [ ] Verify all cross-file links resolve
- [ ] Check for broken references
- [ ] Check for circular references

#### Task 5.2: Content Validation
- [ ] Verify no contradictions between documents
- [ ] Verify single source of principle respected
- [ ] Verify governance rules consistent
- [ ] Verify semantic constraints consistent

#### Task 5.3: Structure Validation
- [ ] Verify file locations match MASTER_PLAN.md structure
- [ ] Verify naming conventions match project standards
- [ ] Verify no duplicates
- [ ] Verify hierarchy clear

#### Task 5.4: Claude Context Validation
- [ ] Verify RPG_PROJECT_CONTEXT.md includes all new references
- [ ] Verify Claude can find all governance documents
- [ ] Verify semantic constraints are accessible
- [ ] Verify file structure is clear

---

## 3. Success Criteria

### 3.1 Documentation Structure
- [ ] All permanent files in correct locations
- [ ] All temporary files archived
- [ ] No duplicates in documentation
- [ ] Clear hierarchy established

### 3.2 Content Alignment
- [ ] All documents reference project philosophy
- [ ] All documents follow config-first principles
- [ ] All documents respect single source of truth
- [ ] All documents align with semantic constraints

### 3.3 Governance Compliance
- [ ] MASTER_PLAN.md governance respected
- [ ] DEVELOPMENT_GUIDELINES.md rules followed
- [ ] RPG_PROJECT_CONTEXT.md constraints honored
- [ ] Documentation governance pack integrated

### 3.4 Claude Context
- [ ] RPG_PROJECT_CONTEXT.md includes all new references
- [ ] All governance documents accessible
- [ ] Semantic constraints clearly documented
- [ ] File structure unambiguous

---

## 4. Risk Mitigation

### Risk 1: Breaking Existing Links
**Mitigation:** Run link validation before and after changes
**Fallback:** Keep backup of original file locations

### Risk 2: Contradictions Between Documents
**Mitigation:** Content validation phase with checklist
**Fallback:** Document contradictions in DECISION_LOG.md for resolution

### Risk 3: Claude Context Becomes Outdated
**Mitigation:** Update RPG_PROJECT_CONTEXT.md in Phase 4
**Fallback:** Test Claude with sample prompts to verify context access

### Risk 4: File Move Breaks Imports
**Mitigation:** Check for any code imports to documentation files
**Fallback:** Update imports if found (unlikely for .md files)

---

## 5. Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: File Reorganization | 2 hours | None |
| Phase 2: Content Alignment | 4 hours | Phase 1 complete |
| Phase 3: Integration with Existing Docs | 2 hours | Phase 2 complete |
| Phase 4: Update RPG_PROJECT_CONTEXT.md | 2 hours | Phase 3 complete |
| Phase 5: Validation & Testing | 1 hour | Phase 4 complete |

**Total Duration:** 11 hours

---

## 6. Next Steps After Completion

1. Run full documentation audit
2. Update DECISION_LOG.md with alignment decisions
3. Create visual map of documentation hierarchy
4. Document any deviations from this plan
5. Share updated structure with team (if applicable)

---

**Last Updated:** 2026-05-20
**Status:** Draft - Ready for Review
**Approver:** Fausto Boni
