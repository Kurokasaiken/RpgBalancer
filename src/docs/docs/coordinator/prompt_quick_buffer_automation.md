# Prompt Quick Buffer Automation

## Overview

The Prompt Quick Buffer automation system maintains a curated list of ready-to-assign prompts by parsing the Kanban, applying policy rules, and generating a buffer file with changelog history.

## Purpose

- **Automate buffer maintenance**: Eliminate manual updates to `prompt_quick_buffer.md`
- **Enforce policy**: Ensure ≥20 ready prompts with domain diversity
- **Track history**: Maintain changelog of buffer updates
- **Enable telemetry**: Emit events for monitoring buffer health

## Architecture

### Components

1. **`scripts/coordinator/promptQuickBuffer.ts`** - Main automation script
2. **`tests/unit/coordinator/PromptQuickBuffer.test.ts`** - Test suite
3. **`src/docs/docs/coordinator/prompt_quick_buffer.md`** - Generated buffer file
4. **`src/docs/docs/coordinator/agent_assignments.md`** - Source Kanban

### Data Flow

```
agent_assignments.md (Kanban)
         ↓
   parseKanban()
         ↓
   filterPrompts() ← Buffer Policy
         ↓
   generateBufferMarkdown() ← Existing Changelog
         ↓
prompt_quick_buffer.md (Buffer)
         ↓
   Telemetry Event
```

## Buffer Policy

### Default Configuration

```typescript
{
  minPrompts: 20,              // Minimum ready prompts required
  requireDomainDiversity: true, // Require ≥3 different domains
  excludeStatuses: [           // Statuses to exclude from buffer
    'In corso',
    'Completato'
  ]
}
```

### Policy Enforcement

- **Minimum Prompts**: Warns if buffer has fewer than 20 ready prompts
- **Domain Diversity**: Checks for at least 3 different prompt domains (NP, PC, IV, ST, etc.)
- **Status Filtering**: Excludes prompts that are in progress or completed

## Usage

### Manual Execution

```bash
# Run buffer refresh
npm run buffer:refresh

# Or directly with tsx
tsx scripts/coordinator/promptQuickBuffer.ts
```

### Automated Execution

The script can be integrated into:
- CI/CD pipelines
- Git hooks (pre-commit, pre-push)
- Scheduled cron jobs
- Coordinator workflows

### Output

The script generates `prompt_quick_buffer.md` with:

1. **Header**: Last update timestamp, total ready prompts
2. **Policy Section**: Current policy configuration
3. **Ready Prompts Table**: Filtered prompts with ID, description, status, dependencies, estimate
4. **Recent Changes**: Last 10 changelog entries

### Example Output

```markdown
# Prompt Quick Buffer

**Last Updated**: 2026-01-24T12:00:00.000Z
**Total Ready Prompts**: 25

## Policy

- Minimum prompts: 20
- Domain diversity: Required
- Excluded statuses: In corso, Completato

## Ready Prompts

| Prompt ID | Description | Status | Dependencies | Estimate |
| --- | --- | --- | --- | --- |
| NP-125 | Coordinator Prompt Quick Buffer Automation | Non assegnato | KS-005 | 120 |
| PC-200 | PWA Install Timing Optimizer | Non assegnato | - | 90 |
...

## Recent Changes

| Timestamp | Action | Prompt ID | Reason |
| --- | --- | --- | --- |
| 2026-01-24T12:00:00Z | refreshed | ALL | Buffer refreshed: 25 prompts available |
```

## Telemetry

### Event: `prompt_quick_buffer_refreshed`

Emitted after each buffer refresh with:

```json
{
  "eventType": "prompt_quick_buffer_refreshed",
  "timestamp": "2026-01-24T12:00:00.000Z",
  "data": {
    "promptCount": 25,
    "domainCount": 5,
    "domains": ["NP", "PC", "IV", "ST", "KS"],
    "policyCompliant": true
  }
}
```

### Metrics

- **promptCount**: Number of ready prompts in buffer
- **domainCount**: Number of unique domains represented
- **domains**: Array of domain prefixes (NP, PC, IV, etc.)
- **policyCompliant**: Boolean indicating if policy requirements are met

## Functions

### `parseKanban(kanbanPath: string): PromptEntry[]`

Parses the Kanban markdown table and extracts prompt entries.

**Parameters:**
- `kanbanPath` - Path to `agent_assignments.md`

**Returns:**
- Array of `PromptEntry` objects

**Example:**
```typescript
const prompts = parseKanban('./agent_assignments.md');
console.log(prompts.length); // 54
```

### `filterPrompts(prompts: PromptEntry[], policy: BufferPolicy): PromptEntry[]`

Filters prompts based on buffer policy rules.

**Parameters:**
- `prompts` - Array of all prompt entries
- `policy` - Buffer policy configuration

**Returns:**
- Filtered array of ready prompts

**Example:**
```typescript
const policy = {
  minPrompts: 20,
  requireDomainDiversity: true,
  excludeStatuses: ['In corso', 'Completato']
};
const ready = filterPrompts(allPrompts, policy);
```

### `generateBufferMarkdown(prompts: PromptEntry[], changelog: ChangelogEntry[]): string`

Generates markdown content for the buffer file.

**Parameters:**
- `prompts` - Filtered prompt entries
- `changelog` - Array of changelog entries

**Returns:**
- Markdown string

**Example:**
```typescript
const markdown = generateBufferMarkdown(readyPrompts, changelog);
fs.writeFileSync('prompt_quick_buffer.md', markdown);
```

### `loadExistingChangelog(bufferPath: string): ChangelogEntry[]`

Loads existing changelog from buffer file.

**Parameters:**
- `bufferPath` - Path to `prompt_quick_buffer.md`

**Returns:**
- Array of existing changelog entries

**Example:**
```typescript
const existing = loadExistingChangelog('./prompt_quick_buffer.md');
const updated = [...existing, newEntry];
```

## Testing

### Test Coverage

- ✅ Kanban parsing with valid/empty tables
- ✅ Prompt filtering with policy enforcement
- ✅ Markdown generation with prompts and changelog
- ✅ Changelog loading and preservation
- ✅ Integration tests for full workflow

### Running Tests

```bash
# Run all coordinator tests
npm run test -- tests/unit/coordinator/

# Run buffer tests specifically
npm run test -- tests/unit/coordinator/PromptQuickBuffer.test.ts

# Run with coverage
npm run test -- tests/unit/coordinator/PromptQuickBuffer.test.ts --coverage
```

## Integration with Coordinator Mandate

The buffer automation integrates with the coordinator workflow:

1. **Step 1.3 - Dependency Audit**: Coordinator checks buffer for available prompts
2. **Prompt Selection**: Coordinator selects from buffer based on priority and parallelizability
3. **Buffer Refresh**: After prompt assignment, buffer is refreshed to reflect new state

### Workflow Integration

```
Coordinator receives request for N prompts
         ↓
   Check prompt_quick_buffer.md
         ↓
   Select N prompts from buffer
         ↓
   Assign prompts to agents
         ↓
   Run buffer refresh script
         ↓
   Updated buffer ready for next request
```

## Maintenance

### Policy Updates

To modify buffer policy, edit `DEFAULT_POLICY` in `promptQuickBuffer.ts`:

```typescript
const DEFAULT_POLICY: BufferPolicy = {
  minPrompts: 30,              // Increase minimum
  requireDomainDiversity: true,
  excludeStatuses: ['In corso', 'Completato', 'Bloccato'], // Add new status
};
```

### Changelog Retention

The system retains the last 10 changelog entries. To modify:

```typescript
// In generateBufferMarkdown()
for (const entry of changelog.slice(-20)) { // Change to 20
  // ...
}
```

## Troubleshooting

### Issue: Buffer has fewer than 20 prompts

**Cause**: Not enough "Non assegnato" prompts in Kanban

**Solution**:
1. Check Kanban for prompts stuck in "In corso"
2. Create new prompts from Strategy Task Intake
3. Review completed prompts for follow-up work

### Issue: Domain diversity warning

**Cause**: Prompts concentrated in 1-2 domains

**Solution**:
1. Review Strategy Task Intake for other domains
2. Balance prompt creation across NP, PC, IV, ST, KS
3. Consider cross-domain integration prompts

### Issue: Changelog not preserved

**Cause**: Buffer file corrupted or missing changelog section

**Solution**:
1. Check buffer file format matches expected structure
2. Ensure "## Recent Changes" header exists
3. Re-run script to regenerate with fresh changelog

## Future Enhancements

- [ ] Add `npm run buffer:refresh` script to `package.json`
- [ ] Integrate with git hooks for automatic refresh
- [ ] Add buffer health dashboard
- [ ] Implement priority scoring for prompt selection
- [ ] Add domain-specific buffer views
- [ ] Create buffer diff reports
- [ ] Add Slack/Discord notifications for buffer status

## References

- **Kanban**: `src/docs/docs/coordinator/agent_assignments.md`
- **Buffer**: `src/docs/docs/coordinator/prompt_quick_buffer.md`
- **Coordinator Mandate**: `.windsurf/skills/coordinator-mandate/`
- **KS-005 Policy**: Coordinator workflow policies
