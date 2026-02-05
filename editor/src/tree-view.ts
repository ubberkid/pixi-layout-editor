import { ContainerNode } from './types';

export type SelectHandler = (node: ContainerNode | null) => void;
export type HoverHandler = (nodeId: string | null) => void;

export class TreeView {
  private _container: HTMLElement;
  private _hierarchy: ContainerNode[] = [];
  private _selectedId: string | null = null;
  private _expandedIds: Set<string> = new Set();
  private _changedNodeIds: Set<string> = new Set();
  private _onSelect: SelectHandler | null = null;
  private _onHover: HoverHandler | null = null;

  constructor(containerId: string) {
    this._container = document.getElementById(containerId)!;
  }

  onSelect(handler: SelectHandler): void {
    this._onSelect = handler;
  }

  onHover(handler: HoverHandler): void {
    this._onHover = handler;
  }

  setChangedNodes(nodeIds: Set<string>): void {
    this._changedNodeIds = nodeIds;
    this.render();
  }

  getSelectedId(): string | null {
    return this._selectedId;
  }

  setHierarchy(hierarchy: ContainerNode[]): void {
    this._hierarchy = hierarchy;
    // Auto-expand root nodes
    hierarchy.forEach((node) => this._expandedIds.add(node.id));
    this.render();
  }

  getNodeById(id: string): ContainerNode | null {
    const findNode = (nodes: ContainerNode[]): ContainerNode | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        const found = findNode(node.children);
        if (found) return found;
      }
      return null;
    };
    return findNode(this._hierarchy);
  }

  updateNode(id: string, updates: Partial<ContainerNode>): void {
    const node = this.getNodeById(id);
    if (node) {
      Object.assign(node, updates);
      this.render();
    }
  }

  selectNodeById(id: string): void {
    this._selectedId = id;
    this.render();
  }

  private render(): void {
    this._container.innerHTML = '';
    this._hierarchy.forEach((node) => {
      this._container.appendChild(this.renderNode(node));
    });
  }

  private renderNode(node: ContainerNode): HTMLElement {
    const div = document.createElement('div');
    div.className = 'tree-node';

    const hasLayoutProps = node.layout && Object.keys(node.layout).length > 0;
    const layoutEnabled = node.layoutEnabled !== false;

    const header = document.createElement('div');
    header.className = 'tree-node-header';
    if (node.id === this._selectedId) {
      header.classList.add('selected');
    }

    const toggle = document.createElement('span');
    toggle.className = 'tree-node-toggle';
    if (node.children.length > 0) {
      toggle.textContent = this._expandedIds.has(node.id) ? '▼' : '▶';
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleExpand(node.id);
      });
    }

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

    // Show indicator for layout participation
    if (hasLayoutProps && layoutEnabled) {
      const badge = document.createElement('span');
      badge.className = 'tree-node-badge';
      badge.textContent = 'L';
      badge.title = 'Has layout properties';
      label.appendChild(badge);
    }

    // Show indicator for filters/shaders
    const hasFilters = node.filters && node.filters.length > 0;
    if (hasFilters) {
      const filterBadge = document.createElement('span');
      filterBadge.className = 'tree-node-badge shader';
      filterBadge.textContent = 'S';
      filterBadge.title = `Has ${node.filters!.length} filter(s)`;
      label.appendChild(filterBadge);
    }

    header.appendChild(toggle);
    header.appendChild(label);

    header.addEventListener('click', () => {
      this.selectNode(node.id);
    });

    header.addEventListener('mouseenter', () => {
      this._onHover?.(node.id);
    });

    header.addEventListener('mouseleave', () => {
      this._onHover?.(null);
    });

    div.appendChild(header);

    if (node.children.length > 0) {
      const children = document.createElement('div');
      children.className = 'tree-node-children';
      if (!this._expandedIds.has(node.id)) {
        children.classList.add('collapsed');
      }
      node.children.forEach((child) => {
        children.appendChild(this.renderNode(child));
      });
      div.appendChild(children);
    }

    return div;
  }

  private toggleExpand(id: string): void {
    if (this._expandedIds.has(id)) {
      this._expandedIds.delete(id);
    } else {
      this._expandedIds.add(id);
    }
    this.render();
  }

  private selectNode(id: string): void {
    this._selectedId = id;
    this.render();
    const node = this.getNodeById(id);
    this._onSelect?.(node);
  }
}
