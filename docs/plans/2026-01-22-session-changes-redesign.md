# Session & Changes Tracking Redesign

## Problem

The current implementation conflates "original values" with session data. Originals are stored in localStorage and saved/loaded with sessions, which causes incorrect change indicators when loading sessions across different game states.

## Goals

1. Originals = live game values at connection time (in-memory only)
2. Sessions = only the changes (localStorage)
3. Change indicators compare session values vs live originals
4. If a saved value matches live, it's not considered a change

## Data Model

### In-memory (per connection)

```typescript
// Captured when hierarchy is received from game
liveOriginals: Map<nodeId, { layout: Record<string, any>, transform: Record<string, any> }>
```

### localStorage (persisted)

```typescript
// Session list
'layout-editor-sessions': string[]

// Per session - ONLY the changes, not originals
'layout-editor-session-{name}': {
  changes: Record<nodeId, Record<property, value>>
}

// Currently loaded session name (for auto-apply on reconnect)
'layout-editor-current-session': string | null
```

### Derived at runtime

- "Is changed?" = session has value AND it differs from liveOriginals
- "Display value" = session value if exists, else liveOriginals value

## Connection & Hierarchy Flow

### When game connects and sends hierarchy

1. Parse all nodes from hierarchy message
2. Build `liveOriginals` map - snapshot every node's layout + transform
3. Check for `currentSession` in localStorage
4. If exists, load session's changes and auto-apply to game
5. Render tree view with change indicators

### When hierarchy updates

- Do NOT overwrite `liveOriginals` - keep initial connection snapshot
- Update node data for display only

### When disconnected

- `liveOriginals` clears (in-memory)
- `currentSession` persists in localStorage

## Session Management

### Loading a session

1. If unsaved changes AND auto-save OFF → prompt "Save changes to {current}?"
2. Load session's changes from localStorage
3. For each change:
   - If value matches liveOriginals → skip
   - If value differs → apply to game, show as changed
4. Set `currentSession` in localStorage
5. Re-render UI

### Saving a session

1. Collect properties where current value ≠ liveOriginals
2. Store only those deltas
3. Update session list if new

### Switching sessions

```
Has unsaved changes? AND auto-save OFF?
  → Yes: prompt "Save changes to {current}?" [Save / Don't Save / Cancel]
  → No: just switch
Load new session
```

## Nice-to-Haves

### 1. Change indicator in tree view

- Small colored dot next to nodes with changes
- Compares session changes against liveOriginals
- Updates on: session load, property change, node reset

### 2. Reset node button

- In property panel header, next to node name
- Only visible when node has changes
- Reverts all properties to liveOriginals
- Removes node from session changes

### 3. View all changes summary

- Button in toolbar area
- Modal showing all changes across all nodes:
  ```
  Node: "GameBoard"
    gap: 10 → 20
    padding: 0 → 15
  ```
- Each row clickable → selects node
- "Reset All" button to revert everything

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Connect with no session | Show live values, no changes |
| Connect with session, game changed | Apply changes; matching values skipped |
| Property set back to original | Remove from session changes |
| Hierarchy update mid-session | Keep liveOriginals unchanged |
| Delete current session | Clear currentSession; changes stay in memory |

## Migration

Old localStorage keys to clear on first load:
- `layout-editor-originals`
- `layout-editor-transforms`
- `layout-editor-changes`

Existing sessions will lose stored originals (now derived from live values).

## Files to Modify

1. `editor/src/property-panel.ts` - Core data model changes
2. `editor/src/main.ts` - Capture liveOriginals, session switching prompt
3. `editor/src/tree-view.ts` - Change indicator dots
4. `editor/src/styles.css` - Styling for new UI elements
