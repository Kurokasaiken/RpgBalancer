# Page 13: Full Quest Flow Integration

**Phase:** 6  
**Components:** QuestCard + SkillCheckPanel + OutcomeModal  
**Route:** `/minimal-integration-quest-flow`  
**Purpose:** Complete quest flow from assignment to outcome

---

## Test Cases (20 total)

### Quest Assignment (4)
- Quest card visible
- Resident assigned to quest
- Assignment shows in card
- Ready for quest start

### Skill Check (6)
- Check panel appears after assignment
- Roll input visible and functional
- Check resolution works
- Success/failure calculated
- Margin displayed
- Result shows immediately

### Outcome Display (6)
- Outcome modal appears after check
- Shows success/failure styling
- Displays rewards correctly
- Shows consequences (if failure)
- Close button works
- State persists correctly

### State Management (4)
- Quest assignment persists
- Check result saved
- Outcome shown once
- Flow completes successfully

---

**Total:** 20 tests
