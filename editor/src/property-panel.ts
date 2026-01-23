import { ContainerNode } from './types';

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

const STORAGE_KEY = 'layout-editor-changes';
const ORIGINALS_KEY = 'layout-editor-originals';
const TRANSFORMS_KEY = 'layout-editor-transforms';
const SESSIONS_KEY = 'layout-editor-sessions';

interface SessionData {
  changes: Record<string, Record<string, any>>;
  originals: Record<string, Record<string, any>>;
  transforms: Record<string, Record<string, any>>;
}

export class PropertyPanel {
  private _formContainer: HTMLElement;
  private _noSelectionEl: HTMLElement;
  private _selectedNode: ContainerNode | null = null;
  private _originalLayouts: Map<string, Record<string, any>> = new Map();
  private _originalTransforms: Map<string, Record<string, any>> = new Map();
  private _pendingChanges: Map<string, Record<string, any>> = new Map();
  private _onChange: PropertyChangeHandler | null = null;
  private _onCopy: CopyHandler | null = null;

  constructor(formId: string, noSelectionId: string) {
    this._formContainer = document.getElementById(formId)!;
    this._noSelectionEl = document.getElementById(noSelectionId)!;

    // Migration: clear old localStorage keys from previous implementation
    localStorage.removeItem('layout-editor-changes');
    localStorage.removeItem('layout-editor-originals');
    localStorage.removeItem('layout-editor-transforms');

    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        this._pendingChanges = new Map(Object.entries(data));
        console.log(`[PropertyPanel] Loaded ${this._pendingChanges.size} nodes with pending changes`);
      }

      const originals = localStorage.getItem(ORIGINALS_KEY);
      if (originals) {
        const data = JSON.parse(originals);
        this._originalLayouts = new Map(Object.entries(data));
      }

      const transforms = localStorage.getItem(TRANSFORMS_KEY);
      if (transforms) {
        const data = JSON.parse(transforms);
        this._originalTransforms = new Map(Object.entries(data));
      }
    } catch (e) {
      console.warn('[PropertyPanel] Failed to load from storage:', e);
    }
  }

  private saveToStorage(): void {
    try {
      const data = Object.fromEntries(this._pendingChanges);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      const originals = Object.fromEntries(this._originalLayouts);
      localStorage.setItem(ORIGINALS_KEY, JSON.stringify(originals));

      const transforms = Object.fromEntries(this._originalTransforms);
      localStorage.setItem(TRANSFORMS_KEY, JSON.stringify(transforms));
    } catch (e) {
      console.warn('[PropertyPanel] Failed to save to storage:', e);
    }
  }

  getPendingChanges(): Map<string, Record<string, any>> {
    return this._pendingChanges;
  }

  hasPendingChanges(): boolean {
    return this._pendingChanges.size > 0;
  }

  clearPendingChanges(): void {
    this._pendingChanges.clear();
    this._originalLayouts.clear();
    this._originalTransforms.clear();
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ORIGINALS_KEY);
    localStorage.removeItem(TRANSFORMS_KEY);
    this.render();
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
      // Save current state to session
      const sessionData: SessionData = {
        changes: Object.fromEntries(this._pendingChanges),
        originals: Object.fromEntries(this._originalLayouts),
        transforms: Object.fromEntries(this._originalTransforms),
      };
      localStorage.setItem(`layout-editor-session-${name}`, JSON.stringify(sessionData));

      // Add to sessions list if not already there
      const sessions = this.getSessions();
      if (!sessions.includes(name)) {
        sessions.push(name);
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
      }

      console.log(`[PropertyPanel] Saved session: ${name}`);
    } catch (e) {
      console.warn('[PropertyPanel] Failed to save session:', e);
    }
  }

  loadSession(name: string): boolean {
    try {
      const saved = localStorage.getItem(`layout-editor-session-${name}`);
      if (!saved) return false;

      const sessionData: SessionData = JSON.parse(saved);
      this._pendingChanges = new Map(Object.entries(sessionData.changes));
      this._originalLayouts = new Map(Object.entries(sessionData.originals));
      this._originalTransforms = new Map(Object.entries(sessionData.transforms || {}));

      // Also save as current working state
      this.saveToStorage();

      console.log(`[PropertyPanel] Loaded session: ${name}`);
      this.render();
      return true;
    } catch (e) {
      console.warn('[PropertyPanel] Failed to load session:', e);
      return false;
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

  onChange(handler: PropertyChangeHandler): void {
    this._onChange = handler;
  }

  onCopy(handler: CopyHandler): void {
    this._onCopy = handler;
  }

  setSelectedNode(node: ContainerNode | null): void {
    this._selectedNode = node;
    // Store original values only the first time we see this node
    if (node) {
      if (!this._originalLayouts.has(node.id)) {
        this._originalLayouts.set(node.id, node.layout ? { ...node.layout } : {});
      }
      if (!this._originalTransforms.has(node.id)) {
        this._originalTransforms.set(node.id, node.transform ? { ...node.transform } : {});
      }
      this.saveToStorage();
    }
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

    // Selected name
    const nameEl = document.createElement('div');
    nameEl.id = 'selected-name';
    nameEl.textContent = this._selectedNode.id;
    this._formContainer.appendChild(nameEl);

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
    const originalLayout = this._originalLayouts.get(this._selectedNode.id) || {};
    const originalTransform = this._originalTransforms.get(this._selectedNode.id) || {};

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

        if (section.isTransform) {
          const transformKey = prop.key as keyof ContainerNode['transform'];
          currentValue = this._selectedNode.transform?.[transformKey];
          originalValue = originalTransform[prop.key];
        } else {
          currentValue = this._selectedNode.layout?.[prop.key];
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

          // Track pending changes
          const nodeId = this._selectedNode!.id;
          if (!this._pendingChanges.has(nodeId)) {
            this._pendingChanges.set(nodeId, {});
          }
          const nodeChanges = this._pendingChanges.get(nodeId)!;

          // Only store if different from original
          const origStore = section.isTransform ? originalTransform : originalLayout;
          const origVal = origStore[prop.key];
          if (value !== origVal) {
            nodeChanges[prop.key] = value;
          } else {
            delete nodeChanges[prop.key];
            if (Object.keys(nodeChanges).length === 0) {
              this._pendingChanges.delete(nodeId);
            }
          }
          this.saveToStorage();

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
