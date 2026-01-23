import { ContainerNode } from './types';

const TRANSFORM_PROPERTIES = ['x', 'y', 'scaleX', 'scaleY', 'rotation', 'pivotX', 'pivotY', 'anchorX', 'anchorY', 'alpha'] as const;

export function isTransformProperty(prop: string): boolean {
  return (TRANSFORM_PROPERTIES as readonly string[]).includes(prop);
}

export type PropertyChangeHandler = (
  nodeId: string,
  property: string,
  value: any
) => void;
export type CopyHandler = (nodeId: string) => void;

interface PropertyDef {
  key: string;
  type: 'text' | 'number' | 'select';
  label: string;
  desc: string;
  options?: string[];
  step?: number;
}

interface PropertySection {
  title: string;
  properties: PropertyDef[];
  isTransform?: boolean;
}

const PROPERTY_SECTIONS: PropertySection[] = [
  {
    title: 'Transform',
    isTransform: true,
    properties: [
      {
        key: 'x',
        type: 'number',
        label: 'x',
        desc: 'Horizontal position in pixels relative to parent.\nExamples: 0, 100, -50',
      },
      {
        key: 'y',
        type: 'number',
        label: 'y',
        desc: 'Vertical position in pixels relative to parent.\nExamples: 0, 100, -50',
      },
      {
        key: 'scaleX',
        type: 'number',
        label: 'scale.x',
        step: 0.1,
        desc: 'Horizontal scale multiplier. 1 = normal size.\nExamples: 1, 0.5 (half), 2 (double), -1 (flip)',
      },
      {
        key: 'scaleY',
        type: 'number',
        label: 'scale.y',
        step: 0.1,
        desc: 'Vertical scale multiplier. 1 = normal size.\nExamples: 1, 0.5 (half), 2 (double), -1 (flip)',
      },
      {
        key: 'rotation',
        type: 'number',
        label: 'rotation',
        step: 0.1,
        desc: 'Rotation in radians around the pivot point.\nExamples: 0, 1.57 (90°), 3.14 (180°), 6.28 (360°)',
      },
      {
        key: 'pivotX',
        type: 'number',
        label: 'pivot.x',
        desc: 'X origin for rotation/scale in local pixels.\nExamples: 0 (left), width/2 (center)',
      },
      {
        key: 'pivotY',
        type: 'number',
        label: 'pivot.y',
        desc: 'Y origin for rotation/scale in local pixels.\nExamples: 0 (top), height/2 (center)',
      },
      {
        key: 'anchorX',
        type: 'number',
        label: 'anchor.x',
        step: 0.1,
        desc: 'X anchor as fraction of texture (Sprites only).\nExamples: 0 (left), 0.5 (center), 1 (right)',
      },
      {
        key: 'anchorY',
        type: 'number',
        label: 'anchor.y',
        step: 0.1,
        desc: 'Y anchor as fraction of texture (Sprites only).\nExamples: 0 (top), 0.5 (center), 1 (bottom)',
      },
      {
        key: 'alpha',
        type: 'number',
        label: 'alpha',
        step: 0.1,
        desc: 'Opacity from 0 (invisible) to 1 (fully visible).\nExamples: 1, 0.5 (semi-transparent), 0',
      },
    ],
  },
  {
    title: 'Size',
    properties: [
      {
        key: 'width',
        type: 'text',
        label: 'width',
        desc: 'Container width. Accepts pixels or percentage.\nExamples: 100, "50%", "auto"',
      },
      {
        key: 'height',
        type: 'text',
        label: 'height',
        desc: 'Container height. Accepts pixels or percentage.\nExamples: 100, "50%", "auto"',
      },
      {
        key: 'minWidth',
        type: 'number',
        label: 'minWidth',
        desc: 'Minimum width constraint in pixels.\nExamples: 100, 200',
      },
      {
        key: 'maxWidth',
        type: 'number',
        label: 'maxWidth',
        desc: 'Maximum width constraint in pixels.\nExamples: 500, 1000',
      },
      {
        key: 'minHeight',
        type: 'number',
        label: 'minHeight',
        desc: 'Minimum height constraint in pixels.\nExamples: 100, 200',
      },
      {
        key: 'maxHeight',
        type: 'number',
        label: 'maxHeight',
        desc: 'Maximum height constraint in pixels.\nExamples: 500, 1000',
      },
    ],
  },
  {
    title: 'Flexbox Container',
    properties: [
      {
        key: 'flexDirection',
        type: 'select',
        label: 'flexDirection',
        desc: 'Main axis direction for laying out children.\n• row: left to right\n• column: top to bottom\n• row-reverse: right to left\n• column-reverse: bottom to top',
        options: ['row', 'column', 'row-reverse', 'column-reverse'],
      },
      {
        key: 'flexWrap',
        type: 'select',
        label: 'flexWrap',
        desc: 'Whether children wrap to new lines.\n• nowrap: single line, may overflow\n• wrap: wrap to next line\n• wrap-reverse: wrap upward/leftward',
        options: ['nowrap', 'wrap', 'wrap-reverse'],
      },
      {
        key: 'justifyContent',
        type: 'select',
        label: 'justifyContent',
        desc: 'Align children along the main axis.\n• flex-start: pack at start\n• flex-end: pack at end\n• center: center items\n• space-between: equal space between\n• space-around: equal space around\n• space-evenly: equal space everywhere',
        options: ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'],
      },
      {
        key: 'alignItems',
        type: 'select',
        label: 'alignItems',
        desc: 'Align children along the cross axis.\n• flex-start: align to start\n• flex-end: align to end\n• center: center items\n• stretch: stretch to fill\n• baseline: align text baselines',
        options: ['flex-start', 'flex-end', 'center', 'stretch', 'baseline'],
      },
      {
        key: 'alignContent',
        type: 'select',
        label: 'alignContent',
        desc: 'Align wrapped lines (only with flexWrap).\n• flex-start: pack lines at start\n• flex-end: pack lines at end\n• center: center lines\n• stretch: stretch lines to fill\n• space-between: equal space between lines\n• space-around: equal space around lines',
        options: ['flex-start', 'flex-end', 'center', 'stretch', 'space-between', 'space-around'],
      },
      {
        key: 'gap',
        type: 'number',
        label: 'gap',
        desc: 'Space between all children in pixels.\nExamples: 0, 10, 20',
      },
      {
        key: 'rowGap',
        type: 'number',
        label: 'rowGap',
        desc: 'Space between rows in pixels (overrides gap for rows).\nExamples: 0, 10, 20',
      },
      {
        key: 'columnGap',
        type: 'number',
        label: 'columnGap',
        desc: 'Space between columns in pixels (overrides gap for columns).\nExamples: 0, 10, 20',
      },
    ],
  },
  {
    title: 'Flexbox Item',
    properties: [
      {
        key: 'flex',
        type: 'number',
        label: 'flex',
        desc: 'Shorthand for flex-grow. How much this item grows relative to siblings.\nExamples: 0 (don\'t grow), 1 (grow equally), 2 (grow 2x)',
      },
      {
        key: 'flexGrow',
        type: 'number',
        label: 'flexGrow',
        desc: 'How much this item grows to fill extra space.\nExamples: 0 (don\'t grow), 1 (grow equally), 2 (grow 2x)',
      },
      {
        key: 'flexShrink',
        type: 'number',
        label: 'flexShrink',
        desc: 'How much this item shrinks when space is tight.\nExamples: 0 (don\'t shrink), 1 (shrink equally)',
      },
      {
        key: 'flexBasis',
        type: 'number',
        label: 'flexBasis',
        desc: 'Initial size before growing/shrinking, in pixels.\nExamples: 0, 100, 200',
      },
      {
        key: 'alignSelf',
        type: 'select',
        label: 'alignSelf',
        desc: 'Override parent\'s alignItems for this item.\n• auto: use parent\'s alignItems\n• flex-start/end/center/stretch/baseline: same as alignItems',
        options: ['auto', 'flex-start', 'flex-end', 'center', 'stretch', 'baseline'],
      },
    ],
  },
  {
    title: 'Spacing',
    properties: [
      {
        key: 'padding',
        type: 'number',
        label: 'padding',
        desc: 'Inner spacing on all sides in pixels.\nExamples: 0, 10, 20',
      },
      {
        key: 'paddingTop',
        type: 'number',
        label: 'paddingTop',
        desc: 'Inner spacing at top in pixels.\nExamples: 0, 10, 20',
      },
      {
        key: 'paddingRight',
        type: 'number',
        label: 'paddingRight',
        desc: 'Inner spacing at right in pixels.\nExamples: 0, 10, 20',
      },
      {
        key: 'paddingBottom',
        type: 'number',
        label: 'paddingBottom',
        desc: 'Inner spacing at bottom in pixels.\nExamples: 0, 10, 20',
      },
      {
        key: 'paddingLeft',
        type: 'number',
        label: 'paddingLeft',
        desc: 'Inner spacing at left in pixels.\nExamples: 0, 10, 20',
      },
      {
        key: 'margin',
        type: 'number',
        label: 'margin',
        desc: 'Outer spacing on all sides in pixels.\nExamples: 0, 10, 20',
      },
      {
        key: 'marginTop',
        type: 'number',
        label: 'marginTop',
        desc: 'Outer spacing at top in pixels.\nExamples: 0, 10, 20',
      },
      {
        key: 'marginRight',
        type: 'number',
        label: 'marginRight',
        desc: 'Outer spacing at right in pixels.\nExamples: 0, 10, 20',
      },
      {
        key: 'marginBottom',
        type: 'number',
        label: 'marginBottom',
        desc: 'Outer spacing at bottom in pixels.\nExamples: 0, 10, 20',
      },
      {
        key: 'marginLeft',
        type: 'number',
        label: 'marginLeft',
        desc: 'Outer spacing at left in pixels.\nExamples: 0, 10, 20',
      },
    ],
  },
];

const SESSIONS_KEY = 'layout-editor-sessions';
const CURRENT_SESSION_KEY = 'layout-editor-current-session';

interface SessionData {
  changes: Record<string, Record<string, any>>;
}

interface LiveOriginals {
  layout: Record<string, any>;
  transform: Record<string, any>;
}

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
  private _onChangesUpdated: (() => void) | null = null;
  private _onReset: ((nodeId: string, properties: Record<string, any>) => void) | null = null;

  constructor(formId: string, noSelectionId: string) {
    this._formContainer = document.getElementById(formId)!;
    this._noSelectionEl = document.getElementById(noSelectionId)!;

    // Migration: clear old localStorage keys from previous implementation
    localStorage.removeItem('layout-editor-changes');
    localStorage.removeItem('layout-editor-originals');
    localStorage.removeItem('layout-editor-transforms');
  }

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
   * Get the live original value for a node's property.
   */
  getOriginalValue(nodeId: string, property: string, isTransform: boolean): any {
    const originals = this._liveOriginals.get(nodeId);
    if (!originals) return undefined;
    return isTransform ? originals.transform[property] : originals.layout[property];
  }

  getSessionChanges(): Map<string, Record<string, any>> {
    return this._sessionChanges;
  }

  hasUnsavedChanges(): boolean {
    return this._hasUnsavedChanges;
  }

  hasOriginals(): boolean {
    return this._liveOriginals.size > 0;
  }

  clearCurrentSession(): void {
    localStorage.removeItem(CURRENT_SESSION_KEY);
  }

  // Session management
  getSessions(): string[] {
    try {
      const saved = localStorage.getItem(SESSIONS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  saveSession(name: string): void {
    try {
      // Build changes: only properties that differ from liveOriginals
      const changes: Record<string, Record<string, any>> = {};

      for (const [nodeId, nodeChanges] of this._sessionChanges) {
        const validChanges: Record<string, any> = {};
        const originals = this._liveOriginals.get(nodeId);

        for (const [prop, value] of Object.entries(nodeChanges)) {
          // Determine if this is a transform property
          const isTransform = isTransformProperty(prop);
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
          const isTransform = isTransformProperty(prop);
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
      this._onChangesUpdated?.();
      this.render();

      return { changes: this._sessionChanges, skipped };
    } catch (e) {
      console.warn('[PropertyPanel] Failed to load session:', e);
      return null;
    }
  }

  deleteSession(name: string): void {
    try {
      localStorage.removeItem(`layout-editor-session-${name}`);

      const sessions = this.getSessions().filter((s) => s !== name);
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));

      console.log(`[PropertyPanel] Deleted session: ${name}`);
    } catch (e) {
      console.warn('[PropertyPanel] Failed to delete session:', e);
    }
  }

  getCurrentSessionName(): string | null {
    return localStorage.getItem(CURRENT_SESSION_KEY);
  }

  onChange(handler: PropertyChangeHandler): void {
    this._onChange = handler;
  }

  onCopy(handler: CopyHandler): void {
    this._onCopy = handler;
  }

  onChangesUpdated(handler: () => void): void {
    this._onChangesUpdated = handler;
  }

  onReset(handler: (nodeId: string, properties: Record<string, any>) => void): void {
    this._onReset = handler;
  }

  resetNode(nodeId: string): void {
    const originals = this._liveOriginals.get(nodeId);
    if (!originals) return;

    const changes = this._sessionChanges.get(nodeId);
    if (!changes) return;

    // Build reset values (original values for each changed property)
    const resetValues: Record<string, any> = {};
    for (const prop of Object.keys(changes)) {
      const isTransform = isTransformProperty(prop);
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

  getChangedNodeIds(): Set<string> {
    return new Set(this._sessionChanges.keys());
  }

  setSelectedNode(node: ContainerNode | null): void {
    this._selectedNode = node;
    this.render();
  }

  updateNodeLayout(nodeId: string, layout: Record<string, any>, transform?: Record<string, any>): void {
    if (this._selectedNode?.id === nodeId) {
      this._selectedNode.layout = layout;
      if (transform) {
        this._selectedNode.transform = transform as ContainerNode['transform'];
      }
      // Don't re-render to avoid losing focus, just update values
    }
  }

  private render(): void {
    if (!this._selectedNode) {
      this._formContainer.style.display = 'none';
      this._noSelectionEl.style.display = 'block';
      return;
    }

    this._noSelectionEl.style.display = 'none';
    this._formContainer.style.display = 'block';
    this._formContainer.innerHTML = '';

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

    // Layout enabled toggle
    const toggleRow = document.createElement('div');
    toggleRow.className = 'property-row toggle-row';

    const toggleLabel = document.createElement('label');
    toggleLabel.textContent = 'Layout Enabled';

    const toggleCheckbox = document.createElement('input');
    toggleCheckbox.type = 'checkbox';
    toggleCheckbox.checked = this._selectedNode.layoutEnabled;
    toggleCheckbox.addEventListener('change', () => {
      this._onChange?.(this._selectedNode!.id, '_layoutEnabled', toggleCheckbox.checked);
    });

    toggleRow.appendChild(toggleLabel);
    toggleRow.appendChild(toggleCheckbox);
    this._formContainer.appendChild(toggleRow);

    // Render sections
    const nodeOriginals = this._liveOriginals.get(this._selectedNode.id);
    const originalLayout = nodeOriginals?.layout || {};
    const originalTransform = nodeOriginals?.transform || {};
    const nodeChanges = this._sessionChanges.get(this._selectedNode.id) || {};

    for (const section of PROPERTY_SECTIONS) {
      const sectionEl = document.createElement('div');
      sectionEl.className = 'property-section';

      const titleEl = document.createElement('div');
      titleEl.className = 'property-section-title';
      titleEl.textContent = section.title;
      sectionEl.appendChild(titleEl);

      for (const prop of section.properties) {
        // Skip anchor properties if node doesn't have anchors
        if ((prop.key === 'anchorX' || prop.key === 'anchorY') && !this._selectedNode.transform?.hasAnchor) {
          continue;
        }

        const row = document.createElement('div');
        row.className = 'property-row';

        const label = document.createElement('label');
        label.className = 'property-label';
        label.textContent = prop.label;
        label.title = prop.desc;

        let input: HTMLInputElement | HTMLSelectElement;

        if (prop.type === 'select') {
          input = document.createElement('select');
          input.className = 'property-input';

          // Add empty option
          const emptyOpt = document.createElement('option');
          emptyOpt.value = '';
          emptyOpt.textContent = '(not set)';
          input.appendChild(emptyOpt);

          prop.options!.forEach((opt) => {
            const option = document.createElement('option');
            option.value = opt;
            option.textContent = opt;
            input.appendChild(option);
          });
        } else {
          input = document.createElement('input');
          input.className = 'property-input';
          input.type = prop.type === 'number' ? 'number' : 'text';
          if (prop.step !== undefined) {
            (input as HTMLInputElement).step = String(prop.step);
          }
        }

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

        if (currentValue !== undefined) {
          input.value = String(currentValue);
          input.classList.add('has-value');
        }

        if (input instanceof HTMLInputElement) {
          input.placeholder = '(not set)';
        }

        // Show original value indicator
        const originalSpan = document.createElement('span');
        originalSpan.className = 'property-original';
        const updateOriginalDisplay = () => {
          const currentVal = input.value === '' ? undefined : input.value;
          const origVal = originalValue !== undefined ? String(originalValue) : undefined;
          const hasChanged = currentVal !== origVal;

          if (hasChanged && originalValue !== undefined) {
            originalSpan.textContent = `was: ${originalValue}`;
            originalSpan.style.display = 'inline';
            originalSpan.title = 'Click to reset';
          } else if (hasChanged && originalValue === undefined) {
            originalSpan.textContent = 'new';
            originalSpan.style.display = 'inline';
            originalSpan.title = 'Click to clear';
          } else {
            originalSpan.style.display = 'none';
          }
        };
        updateOriginalDisplay();

        // Click original to reset
        originalSpan.setAttribute('role', 'button');
        originalSpan.setAttribute('tabindex', '0');
        originalSpan.addEventListener('click', () => {
          if (originalValue !== undefined) {
            input.value = String(originalValue);
          } else {
            input.value = '';
          }
          input.classList.toggle('has-value', input.value !== '');
          updateOriginalDisplay();
          this._onChange?.(this._selectedNode!.id, prop.key, originalValue);
        });
        originalSpan.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            // Same logic as click handler
            if (originalValue !== undefined) {
              input.value = String(originalValue);
            } else {
              input.value = '';
            }
            input.classList.toggle('has-value', input.value !== '');
            updateOriginalDisplay();
            this._onChange?.(this._selectedNode!.id, prop.key, originalValue);
          }
        });

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

          this._onChangesUpdated?.();
          this._onChange?.(this._selectedNode!.id, prop.key, value);
        });

        row.appendChild(label);
        row.appendChild(input);
        row.appendChild(originalSpan);
        sectionEl.appendChild(row);
      }

      this._formContainer.appendChild(sectionEl);
    }

    // Copy button
    const copyBtn = document.createElement('button');
    copyBtn.id = 'copy-btn';
    copyBtn.textContent = 'Copy Layout';
    copyBtn.addEventListener('click', () => {
      this._onCopy?.(this._selectedNode!.id);
    });
    this._formContainer.appendChild(copyBtn);
  }
}
