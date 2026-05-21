# Page 12: Drag PgCard to JobCard Integration

**Phase:** 6  
**Components:** PgCard + JobCard  
**Route:** `/minimal-integration-drag-job`  
**Purpose:** Test resident assignment via drag-drop to job

---

## Test Cases (16 total)

### Drag Setup (4)
- Resident card visible
- Job card visible
- Drag initiates from resident
- Drop target ready

### Drag-Drop Flow (6)
- Drag starts on resident
- Hover shows drop zone highlight
- Drop completes assignment
- Resident moves to job slot
- Job shows assigned resident
- Drag resets after drop

### Validation (4)
- Can't drag to full slot
- Can't drag incompatible residents
- Multiple residents can be assigned
- Assignment persists

### Visual Feedback (2)
- Drag ghost visible
- Drop zone highlights

---

**Total:** 16 tests
