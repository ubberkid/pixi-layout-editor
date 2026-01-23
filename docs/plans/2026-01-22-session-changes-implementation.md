# Session & Changes Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign session/change tracking so originals are live game values (in-memory) and sessions store only changes (localStorage).

**Architecture:** PropertyPanel manages liveOriginals (in-memory) and sessionChanges. Main.ts captures originals on hierarchy receive, handles session switching prompts. TreeView shows change indicators by checking session vs liveOriginals.

**Tech Stack:** TypeScript, vanilla DOM, localStorage, BroadcastChannel

---

## Task 1: Clean up old localStorage keys (Migration)

**Files:**
- Modify: `editor/src/property-panel.ts:321-350`

**Step 1: Add migration on construction**

In the `PropertyPanel` constructor, before `loadFromStorage()`, add code to remove old keys:

```typescript
constructor(formId: string, noSelectionId: string) {
  this._formContainer = document.getElementById(formId)!;
  this._noSelectionEl = document.getElementById(noSelectionId)!;

  // Migration: clear old localStorage keys from previous implementation
  localStorage.removeItem('layout-editor-changes');
  localStorage.removeItem('layout-editor-originals');
  localStorage.removeItem('layout-editor-transforms');

  this.loadFromStorage();
}
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add editor/src/property-panel.ts
git commit -m "chore: migrate away from old localStorage keys"
```

---

## Task 2: Refactor PropertyPanel data model

**Files:**
- Modify: `editor/src/property-panel.ts`

**Step 1: Update storage keys and interfaces**

Replace lines 300-309:

```typescript
const SESSIONS_KEY = 'layout-editor-sessions';
const CURRENT_SESSION_KEY = 'layout-editor-current-session';

interface SessionData {
  changes: Record<string, Record<string, any>>;
}

interface LiveOriginals {
  layout: Record<string, any>;
  transform: Record<string, any>;
}
```

**Step 2: Update class properties**

Replace lines 311-319:

```typescript
export class PropertyPanel {
  private _formContainer: HTMLElement;
  private _noSelectionEl: HTMLElement;
  private _selectedNode: ContainerNode | null = null;

  // In-memory only - captured from game on hierarchy receive
  private _liveOriginals: Map<string, LiveOriginals> = new Map();

  // Current session's changes (from loaded session or user edits)
  private _sessionChanges: Map<string, Record<string, any>> = new Map();

  // Track if we have unsaved changes since last session save
  private _hasUnsavedChanges: boolean = false;

  private _onChange: PropertyChangeHandler | null = null;
  private _onCopy: CopyHandler | null = null;
```

**Step 3: Simplify loadFromStorage**

Replace the `loadFromStorage` method:

```typescript
private loadFromStorage(): void {
  // Only load current session name - actual session data loaded on demand
  // liveOriginals are NOT loaded - they come from game on connect
}
```

**Step 4: Remove saveToStorage method**

Delete the entire `saveToStorage` method (lines 352-365) - we no longer persist originals.

**Step 5: Update getPendingChanges to getSessionChanges**

```typescript
getSessionChanges(): Map<string, Record<string, any>> {
  return this._sessionChanges;
}

hasUnsavedChanges(): boolean {
  return this._hasUnsavedChanges;
}
```

**Step 6: Update clearPendingChanges to clearSessionChanges**

```typescript
clearSessionChanges(): void {
  this._sessionChanges.clear();
  this._hasUnsavedChanges = false;
  this.render();
}
```

**Step 7: Verify build passes**

Run: `npm run build`
Expected: Build fails (expected - we haven't updated all references yet)

**Step 8: Commit work in progress**

```bash
git add editor/src/property-panel.ts
git commit -m "refactor: update PropertyPanel data model for new session design"
```

---

## Task 3: Add liveOriginals capture method

**Files:**
- Modify: `editor/src/property-panel.ts`

**Step 1: Add method to capture originals from hierarchy**

Add after the constructor:

```typescript
/**
 * Capture live original values from game hierarchy.
 * Called once when hierarchy is first received after connection.
 */
captureOriginals(nodes: ContainerNode[]): void {
  this._liveOriginals.clear();

  const captureNode = (node: ContainerNode) => {
    this._liveOriginals.set(node.id, {
      layout: node.layout ? { ...node.layout } : {},
      transform: node.transform ? { ...node.transform } : {},
    });
    node.children.forEach(captureNode);
  };

  nodes.forEach(captureNode);
  console.log(`[PropertyPanel] Captured originals for ${this._liveOriginals.size} nodes`);
}

/**
 * Clear originals (called on disconnect).
 */
clearOriginals(): void {
  this._liveOriginals.clear();
}

/**
 * Check if we have captured originals (i.e., connected to game).
 */
hasOriginals(): boolean {
  return this._liveOriginals.size > 0;
}

/**
 * Get the live original value for a node's property.
 */
getOriginalValue(nodeId: string, property: string, isTransform: boolean): any {
  const originals = this._liveOriginals.get(nodeId);
  if (!originals) return undefined;
  return isTransform ? originals.transform[property] : originals.layout[property];
}
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: Build may still fail (main.ts references not updated)

**Step 3: Commit**

```bash
git add editor/src/property-panel.ts
git commit -m "feat: add liveOriginals capture methods"
```

---

## Task 4: Refactor session save/load to only store changes

**Files:**
- Modify: `editor/src/property-panel.ts`

**Step 1: Update saveSession method**

Replace the existing `saveSession` method:

```typescript
saveSession(name: string): void {
  try {
    // Build changes: only properties that differ from liveOriginals
    const changes: Record<string, Record<string, any>> = {};

    for (const [nodeId, nodeChanges] of this._sessionChanges) {
      const validChanges: Record<string, any> = {};
      const originals = this._liveOriginals.get(nodeId);

      for (const [prop, value] of Object.entries(nodeChanges)) {
        // Determine if this is a transform property
        const isTransform = ['x', 'y', 'scaleX', 'scaleY', 'rotation', 'pivotX', 'pivotY', 'anchorX', 'anchorY', 'alpha'].includes(prop);
        const originalValue = originals
          ? (isTransform ? originals.transform[prop] : originals.layout[prop])
          : undefined;

        // Only save if different from live original
        if (value !== originalValue) {
          validChanges[prop] = value;
        }
      }

      if (Object.keys(validChanges).length > 0) {
        changes[nodeId] = validChanges;
      }
    }

    const sessionData: SessionData = { changes };
    localStorage.setItem(`layout-editor-session-${name}`, JSON.stringify(sessionData));

    // Update sessions list
    const sessions = this.getSessions();
    if (!sessions.includes(name)) {
      sessions.push(name);
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    }

    // Update current session
    localStorage.setItem(CURRENT_SESSION_KEY, name);
    this._hasUnsavedChanges = false;

    console.log(`[PropertyPanel] Saved session: ${name} (${Object.keys(changes).length} nodes)`);
  } catch (e) {
    console.warn('[PropertyPanel] Failed to save session:', e);
  }
}
```

**Step 2: Update loadSession method**

Replace the existing `loadSession` method:

```typescript
loadSession(name: string): { changes: Map<string, Record<string, any>>, skipped: number } | null {
  try {
    const saved = localStorage.getItem(`layout-editor-session-${name}`);
    if (!saved) return null;

    const sessionData: SessionData = JSON.parse(saved);
    this._sessionChanges.clear();

    let skipped = 0;

    // Load changes, filtering out any that match current live originals
    for (const [nodeId, nodeChanges] of Object.entries(sessionData.changes)) {
      const validChanges: Record<string, any> = {};
      const originals = this._liveOriginals.get(nodeId);

      for (const [prop, value] of Object.entries(nodeChanges)) {
        const isTransform = ['x', 'y', 'scaleX', 'scaleY', 'rotation', 'pivotX', 'pivotY', 'anchorX', 'anchorY', 'alpha'].includes(prop);
        const originalValue = originals
          ? (isTransform ? originals.transform[prop] : originals.layout[prop])
          : undefined;

        // Only keep if different from live original
        if (value !== originalValue) {
          validChanges[prop] = value;
        } else {
          skipped++;
        }
      }

      if (Object.keys(validChanges).length > 0) {
        this._sessionChanges.set(nodeId, validChanges);
      }
    }

    localStorage.setItem(CURRENT_SESSION_KEY, name);
    this._hasUnsavedChanges = false;

    console.log(`[PropertyPanel] Loaded session: ${name} (skipped ${skipped} matching values)`);
    this.render();

    return { changes: this._sessionChanges, skipped };
  } catch (e) {
    console.warn('[PropertyPanel] Failed to load session:', e);
    return null;
  }
}
```

**Step 3: Add getCurrentSessionName method**

```typescript
getCurrentSessionName(): string | null {
  return localStorage.getItem(CURRENT_SESSION_KEY);
}

clearCurrentSession(): void {
  localStorage.removeItem(CURRENT_SESSION_KEY);
}
```

**Step 4: Verify build**

Run: `npm run build`

**Step 5: Commit**

```bash
git add editor/src/property-panel.ts
git commit -m "refactor: session save/load only stores changes"
```

---

## Task 5: Update setSelectedNode (remove original capture)

**Files:**
- Modify: `editor/src/property-panel.ts`

**Step 1: Simplify setSelectedNode**

Replace the `setSelectedNode` method:

```typescript
setSelectedNode(node: ContainerNode | null): void {
  this._selectedNode = node;
  this.render();
}
```

The original capture now happens in `captureOriginals()` called from main.ts.

**Step 2: Commit**

```bash
git add editor/src/property-panel.ts
git commit -m "refactor: remove original capture from setSelectedNode"
```

---

## Task 6: Update render method to use new data model

**Files:**
- Modify: `editor/src/property-panel.ts`

**Step 1: Update render to use liveOriginals and sessionChanges**

In the render method, update how we get original values (around line 522):

```typescript
// Render sections
const nodeOriginals = this._liveOriginals.get(this._selectedNode.id);
const originalLayout = nodeOriginals?.layout || {};
const originalTransform = nodeOriginals?.transform || {};
const nodeChanges = this._sessionChanges.get(this._selectedNode.id) || {};
```

**Step 2: Update currentValue logic to check sessionChanges first**

In the property rendering loop (around line 575-586), update to:

```typescript
// Get current and original values based on section type
let currentValue: any;
let originalValue: any;

// Check session changes first, then fall back to live node value
const sessionValue = nodeChanges[prop.key];

if (section.isTransform) {
  const transformKey = prop.key as keyof ContainerNode['transform'];
  currentValue = sessionValue !== undefined ? sessionValue : this._selectedNode.transform?.[transformKey];
  originalValue = originalTransform[prop.key];
} else {
  currentValue = sessionValue !== undefined ? sessionValue : this._selectedNode.layout?.[prop.key];
  originalValue = originalLayout[prop.key];
}
```

**Step 3: Update change tracking in input handler**

In the input change handler (around line 631-663), update to use `_sessionChanges`:

```typescript
input.addEventListener('change', () => {
  input.classList.toggle('has-value', input.value !== '');
  updateOriginalDisplay();
  let value: any = input.value;
  if (prop.type === 'number' && value !== '') {
    value = parseFloat(value);
  }
  if (value === '' && !section.isTransform) {
    value = undefined;
  }

  // Track session changes
  const nodeId = this._selectedNode!.id;
  if (!this._sessionChanges.has(nodeId)) {
    this._sessionChanges.set(nodeId, {});
  }
  const changes = this._sessionChanges.get(nodeId)!;

  // Only store if different from original
  const origVal = section.isTransform ? originalTransform[prop.key] : originalLayout[prop.key];
  if (value !== origVal) {
    changes[prop.key] = value;
    this._hasUnsavedChanges = true;
  } else {
    delete changes[prop.key];
    if (Object.keys(changes).length === 0) {
      this._sessionChanges.delete(nodeId);
    }
  }

  this._onChange?.(this._selectedNode!.id, prop.key, value);
});
```

**Step 4: Verify build**

Run: `npm run build`

**Step 5: Commit**

```bash
git add editor/src/property-panel.ts
git commit -m "refactor: render method uses liveOriginals and sessionChanges"
```

---

## Task 7: Update main.ts to capture originals on hierarchy

**Files:**
- Modify: `editor/src/main.ts`

**Step 1: Add flag to track if originals captured**

Add after line 19:

```typescript
let originalsCaptureed = false;
```

**Step 2: Update hierarchy handler to capture originals**

Replace the hierarchy handler (lines 148-151):

```typescript
// Handle hierarchy updates
connection.on('hierarchy', (msg) => {
  const nodes = msg.data as ContainerNode[];

  // Capture originals only on first hierarchy after connect
  if (!originalsCaptureed) {
    propertyPanel.captureOriginals(nodes);
    originalsCaptureed = true;

    // Auto-apply current session if one was loaded
    const currentSession = propertyPanel.getCurrentSessionName();
    if (currentSession) {
      const result = propertyPanel.loadSession(currentSession);
      if (result && result.changes.size > 0) {
        currentSessionName = currentSession;
        sessionDropdownBtn.textContent = currentSession;
        applySessionChanges(result.changes);
      }
    }
  }

  treeView.setHierarchy(nodes);
});
```

**Step 3: Add applySessionChanges helper**

Add after `applyPendingChanges` (around line 54):

```typescript
// Apply session changes to game
const applySessionChanges = (changes: Map<string, Record<string, any>>) => {
  if (changes.size > 0) {
    console.log(`[Layout Editor] Applying ${changes.size} node changes...`);
    for (const [nodeId, nodeChanges] of changes) {
      for (const [property, value] of Object.entries(nodeChanges)) {
        connection.send({ type: 'set-property', id: nodeId, property, value });
      }
    }
  }
};
```

**Step 4: Clear originals on disconnect**

Update the connection status handler (line 135-138):

```typescript
connection.onStatusChange((connected) => {
  updateConnectionDropdown(connected);
  updateSessionControls(connected);

  if (!connected) {
    originalsCaptureed = false;
    propertyPanel.clearOriginals();
  }
});
```

**Step 5: Update applyPendingChanges to use getSessionChanges**

```typescript
const applyPendingChanges = () => {
  const changes = propertyPanel.getSessionChanges();
  applySessionChanges(changes);
};
```

**Step 6: Verify build**

Run: `npm run build`

**Step 7: Commit**

```bash
git add editor/src/main.ts
git commit -m "feat: capture originals on hierarchy, auto-apply session"
```

---

## Task 8: Add session switching prompt

**Files:**
- Modify: `editor/src/main.ts`

**Step 1: Update session click handler with save prompt**

Replace the session item click handler (lines 200-207):

```typescript
item.addEventListener('click', async () => {
  // Check for unsaved changes
  if (propertyPanel.hasUnsavedChanges() && !autosaveCheckbox.checked && currentSessionName) {
    const response = confirm(`Save changes to "${currentSessionName}" before switching?`);
    if (response) {
      propertyPanel.saveSession(currentSessionName);
    }
    // If they click Cancel on confirm, we still switch (no way to cancel switch with confirm())
  } else if (autosaveCheckbox.checked && currentSessionName) {
    // Auto-save before switching
    propertyPanel.saveSession(currentSessionName);
  }

  const result = propertyPanel.loadSession(name);
  if (result) {
    currentSessionName = name;
    sessionDropdownBtn.textContent = name;
    sessionDropdown.classList.remove('open');
    applySessionChanges(result.changes);
    updateSessionList();
  }
});
```

**Step 2: Verify build**

Run: `npm run build`

**Step 3: Commit**

```bash
git add editor/src/main.ts
git commit -m "feat: add save prompt when switching sessions"
```

---

## Task 9: Add change indicator to tree view

**Files:**
- Modify: `editor/src/tree-view.ts`
- Modify: `editor/src/styles.css`

**Step 1: Add method to check if node has changes**

Add to TreeView class:

```typescript
private _changedNodeIds: Set<string> = new Set();

setChangedNodes(nodeIds: Set<string>): void {
  this._changedNodeIds = nodeIds;
  this.render();
}
```

**Step 2: Update renderNode to show change indicator**

In `renderNode`, after creating the label span (around line 86):

```typescript
const label = document.createElement('span');
label.className = 'tree-node-label';
label.textContent = node.id || `[${node.type}]`;

// Show change indicator
if (this._changedNodeIds.has(node.id)) {
  const changeDot = document.createElement('span');
  changeDot.className = 'tree-node-change-dot';
  changeDot.title = 'Has unsaved changes';
  label.appendChild(changeDot);
}
```

**Step 3: Add CSS for change dot**

Add to `styles.css`:

```css
.tree-node-change-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #e8a838;
  margin-left: 6px;
  vertical-align: middle;
}
```

**Step 4: Verify build**

Run: `npm run build`

**Step 5: Commit**

```bash
git add editor/src/tree-view.ts editor/src/styles.css
git commit -m "feat: add change indicator dot to tree nodes"
```

---

## Task 10: Wire up tree view change indicators

**Files:**
- Modify: `editor/src/property-panel.ts`
- Modify: `editor/src/main.ts`

**Step 1: Add getChangedNodeIds to PropertyPanel**

```typescript
getChangedNodeIds(): Set<string> {
  return new Set(this._sessionChanges.keys());
}
```

**Step 2: Add onChangesUpdated callback to PropertyPanel**

Add property and method:

```typescript
private _onChangesUpdated: (() => void) | null = null;

onChangesUpdated(handler: () => void): void {
  this._onChangesUpdated = handler;
}
```

**Step 3: Call callback when changes update**

In the input change handler, after modifying `_sessionChanges`, add:

```typescript
this._onChangesUpdated?.();
```

Also call it in `loadSession` after setting `_sessionChanges`, and in `clearSessionChanges`.

**Step 4: Wire up in main.ts**

Add after propertyPanel.onChange handler:

```typescript
propertyPanel.onChangesUpdated(() => {
  treeView.setChangedNodes(propertyPanel.getChangedNodeIds());
});
```

**Step 5: Update hierarchy handler to refresh tree indicators**

In the hierarchy handler, after `treeView.setHierarchy(nodes)`:

```typescript
treeView.setChangedNodes(propertyPanel.getChangedNodeIds());
```

**Step 6: Verify build**

Run: `npm run build`

**Step 7: Commit**

```bash
git add editor/src/property-panel.ts editor/src/main.ts
git commit -m "feat: wire up tree view change indicators"
```

---

## Task 11: Add Reset Node button

**Files:**
- Modify: `editor/src/property-panel.ts`
- Modify: `editor/src/styles.css`

**Step 1: Add onReset callback**

```typescript
private _onReset: ((nodeId: string, properties: Record<string, any>) => void) | null = null;

onReset(handler: (nodeId: string, properties: Record<string, any>) => void): void {
  this._onReset = handler;
}
```

**Step 2: Add Reset button in render method**

After the selected-name element (around line 500):

```typescript
// Selected name with reset button
const nameRow = document.createElement('div');
nameRow.id = 'selected-name-row';

const nameEl = document.createElement('div');
nameEl.id = 'selected-name';
nameEl.textContent = this._selectedNode.id;
nameRow.appendChild(nameEl);

// Reset button - only show if node has changes
if (this._sessionChanges.has(this._selectedNode.id)) {
  const resetBtn = document.createElement('button');
  resetBtn.id = 'reset-node-btn';
  resetBtn.textContent = 'Reset';
  resetBtn.title = 'Reset all changes for this node';
  resetBtn.addEventListener('click', () => {
    this.resetNode(this._selectedNode!.id);
  });
  nameRow.appendChild(resetBtn);
}

this._formContainer.appendChild(nameRow);
```

**Step 3: Add resetNode method**

```typescript
resetNode(nodeId: string): void {
  const originals = this._liveOriginals.get(nodeId);
  if (!originals) return;

  const changes = this._sessionChanges.get(nodeId);
  if (!changes) return;

  // Build reset values (original values for each changed property)
  const resetValues: Record<string, any> = {};
  for (const prop of Object.keys(changes)) {
    const isTransform = ['x', 'y', 'scaleX', 'scaleY', 'rotation', 'pivotX', 'pivotY', 'anchorX', 'anchorY', 'alpha'].includes(prop);
    resetValues[prop] = isTransform ? originals.transform[prop] : originals.layout[prop];
  }

  // Remove from session changes
  this._sessionChanges.delete(nodeId);
  this._hasUnsavedChanges = true;

  // Notify to send resets to game
  this._onReset?.(nodeId, resetValues);
  this._onChangesUpdated?.();

  this.render();
}
```

**Step 4: Add CSS for reset button**

```css
#selected-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #3c3c3c;
}

#reset-node-btn {
  padding: 4px 8px;
  font-size: 12px;
  background-color: #dc3545;
}

#reset-node-btn:hover {
  background-color: #e04555;
}
```

**Step 5: Wire up reset handler in main.ts**

```typescript
propertyPanel.onReset((nodeId, properties) => {
  for (const [property, value] of Object.entries(properties)) {
    connection.send({ type: 'set-property', id: nodeId, property, value });
  }
});
```

**Step 6: Verify build**

Run: `npm run build`

**Step 7: Commit**

```bash
git add editor/src/property-panel.ts editor/src/styles.css editor/src/main.ts
git commit -m "feat: add Reset Node button"
```

---

## Task 12: Add View All Changes modal

**Files:**
- Modify: `editor/src/main.ts`
- Modify: `editor/src/index.html`
- Modify: `editor/src/styles.css`

**Step 1: Add button and modal to HTML**

In index.html, add button in connection-bar after autosave-label:

```html
<button id="view-changes-btn" style="display: none;">View Changes</button>
```

Add modal before closing `</div>` of #app:

```html
<div id="changes-modal" class="modal" style="display: none;">
  <div class="modal-content">
    <div class="modal-header">
      <h3>All Changes</h3>
      <button id="close-modal-btn" class="modal-close">&times;</button>
    </div>
    <div id="changes-list" class="modal-body"></div>
    <div class="modal-footer">
      <button id="reset-all-btn">Reset All</button>
    </div>
  </div>
</div>
```

**Step 2: Add modal CSS**

```css
/* Modal */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal-content {
  background-color: #2d2d2d;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
  max-height: 80%;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #3c3c3c;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #d4d4d4;
  padding: 0;
  line-height: 1;
}

.modal-close:hover {
  color: white;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.modal-footer {
  padding: 16px;
  border-top: 1px solid #3c3c3c;
  display: flex;
  justify-content: flex-end;
}

.change-node {
  margin-bottom: 16px;
}

.change-node-header {
  font-weight: 600;
  color: #9cdcfe;
  margin-bottom: 8px;
  cursor: pointer;
}

.change-node-header:hover {
  text-decoration: underline;
}

.change-item {
  display: flex;
  font-size: 13px;
  padding: 4px 0;
  padding-left: 16px;
}

.change-prop {
  color: #ce9178;
  margin-right: 8px;
}

.change-arrow {
  color: #808080;
  margin: 0 8px;
}

.change-old {
  color: #808080;
  text-decoration: line-through;
}

.change-new {
  color: #b5cea8;
}

#reset-all-btn {
  background-color: #dc3545;
}

#reset-all-btn:hover {
  background-color: #e04555;
}
```

**Step 3: Add modal logic to main.ts**

Add DOM element references:

```typescript
const viewChangesBtn = document.getElementById('view-changes-btn')!;
const changesModal = document.getElementById('changes-modal')!;
const changesList = document.getElementById('changes-list')!;
const closeModalBtn = document.getElementById('close-modal-btn')!;
const resetAllBtn = document.getElementById('reset-all-btn')!;
```

Add handlers:

```typescript
// View Changes modal
viewChangesBtn.addEventListener('click', () => {
  renderChangesModal();
  changesModal.style.display = 'flex';
});

closeModalBtn.addEventListener('click', () => {
  changesModal.style.display = 'none';
});

changesModal.addEventListener('click', (e) => {
  if (e.target === changesModal) {
    changesModal.style.display = 'none';
  }
});

resetAllBtn.addEventListener('click', () => {
  if (confirm('Reset all changes?')) {
    const changes = propertyPanel.getSessionChanges();
    for (const [nodeId] of changes) {
      propertyPanel.resetNode(nodeId);
    }
    changesModal.style.display = 'none';
  }
});

const renderChangesModal = () => {
  changesList.innerHTML = '';
  const changes = propertyPanel.getSessionChanges();

  if (changes.size === 0) {
    changesList.innerHTML = '<p style="color: #808080;">No changes</p>';
    return;
  }

  for (const [nodeId, nodeChanges] of changes) {
    const nodeDiv = document.createElement('div');
    nodeDiv.className = 'change-node';

    const header = document.createElement('div');
    header.className = 'change-node-header';
    header.textContent = nodeId;
    header.addEventListener('click', () => {
      // Select node in tree
      const node = treeView.getNodeById(nodeId);
      if (node) {
        propertyPanel.setSelectedNode(node);
        treeView.selectNodeById(nodeId);
      }
      changesModal.style.display = 'none';
    });
    nodeDiv.appendChild(header);

    for (const [prop, value] of Object.entries(nodeChanges)) {
      const isTransform = ['x', 'y', 'scaleX', 'scaleY', 'rotation', 'pivotX', 'pivotY', 'anchorX', 'anchorY', 'alpha'].includes(prop);
      const original = propertyPanel.getOriginalValue(nodeId, prop, isTransform);

      const item = document.createElement('div');
      item.className = 'change-item';
      item.innerHTML = `
        <span class="change-prop">${prop}:</span>
        <span class="change-old">${original ?? '(not set)'}</span>
        <span class="change-arrow">→</span>
        <span class="change-new">${value ?? '(not set)'}</span>
      `;
      nodeDiv.appendChild(item);
    }

    changesList.appendChild(nodeDiv);
  }
};
```

**Step 4: Add selectNodeById to TreeView**

In tree-view.ts:

```typescript
selectNodeById(id: string): void {
  this._selectedId = id;
  this.render();
}
```

**Step 5: Show/hide view changes button based on connection**

Update `updateSessionControls`:

```typescript
const updateSessionControls = (connected: boolean) => {
  sessionDropdown.style.display = connected ? 'block' : 'none';
  saveSessionBtn.style.display = connected ? 'inline-block' : 'none';
  autosaveLabel.style.display = connected ? 'flex' : 'none';
  viewChangesBtn.style.display = connected ? 'inline-block' : 'none';
  if (connected) {
    updateSaveButton();
  }
};
```

**Step 6: Verify build**

Run: `npm run build`

**Step 7: Commit**

```bash
git add editor/src/main.ts editor/index.html editor/src/styles.css editor/src/tree-view.ts
git commit -m "feat: add View All Changes modal"
```

---

## Task 13: Final cleanup and testing

**Files:**
- All modified files

**Step 1: Remove unused code**

Remove any remaining references to old storage keys or methods.

**Step 2: Full build**

Run: `npm run build`

**Step 3: Manual testing checklist**

1. Connect to game - originals captured
2. Edit a property - shows "was: X"
3. Create session - saves changes only
4. Disconnect and reconnect - auto-applies session
5. Edit another property - shows change dot in tree
6. Switch sessions - prompts to save
7. Reset node - reverts to original
8. View all changes - shows modal with all changes
9. Reset all - reverts everything

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: cleanup and finalize session redesign"
```

**Step 5: Merge to main (after review)**

```bash
git checkout master
git merge feature/session-changes-redesign
```
