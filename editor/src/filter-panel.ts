import { ContainerNode, FilterInfo, FilterUniform } from './types';

export type FilterUniformChangeHandler = (
  nodeId: string,
  filterIndex: number,
  groupName: string,
  uniformName: string,
  value: any
) => void;

/**
 * Converts a vec3 array [r, g, b] (0-1 range) to hex color string
 */
function vec3ToHex(vec: number[]): string {
  const r = Math.round(Math.max(0, Math.min(1, vec[0])) * 255);
  const g = Math.round(Math.max(0, Math.min(1, vec[1])) * 255);
  const b = Math.round(Math.max(0, Math.min(1, vec[2])) * 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Converts a hex color string to vec3 array [r, g, b] (0-1 range)
 */
function hexToVec3(hex: string): number[] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [1, 1, 1];
  return [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255,
  ];
}

/**
 * Check if a vec3 value looks like a color (values between 0 and 1)
 */
function isColorLikeVec3(value: number[]): boolean {
  if (!Array.isArray(value) || value.length !== 3) return false;
  return value.every(v => typeof v === 'number' && v >= 0 && v <= 1);
}

/**
 * Check if uniform name suggests it's a color
 */
function isColorUniformName(name: string): boolean {
  const colorKeywords = ['color', 'Color', 'COLOR', 'tint', 'Tint', 'rgb', 'RGB'];
  return colorKeywords.some(keyword => name.includes(keyword));
}

export class FilterPanel {
  private _container: HTMLElement;
  private _noFiltersEl: HTMLElement;
  private _selectedNode: ContainerNode | null = null;
  private _onChange: FilterUniformChangeHandler | null = null;

  constructor(containerId: string, noFiltersId: string) {
    this._container = document.getElementById(containerId)!;
    this._noFiltersEl = document.getElementById(noFiltersId)!;
  }

  onChange(handler: FilterUniformChangeHandler): void {
    this._onChange = handler;
  }

  setSelectedNode(node: ContainerNode | null): void {
    this._selectedNode = node;
    this.render();
  }

  hasFilters(): boolean {
    return !!(this._selectedNode?.filters && this._selectedNode.filters.length > 0);
  }

  updateFilterUniforms(nodeId: string, filterIndex: number, uniforms: FilterUniform[]): void {
    if (this._selectedNode?.id === nodeId && this._selectedNode.filters) {
      const filter = this._selectedNode.filters.find(f => f.index === filterIndex);
      if (filter) {
        filter.uniforms = uniforms;
        // Don't re-render to avoid losing focus, just update values
      }
    }
  }

  private render(): void {
    if (!this._selectedNode || !this._selectedNode.filters || this._selectedNode.filters.length === 0) {
      this._container.style.display = 'none';
      this._noFiltersEl.style.display = 'block';
      return;
    }

    this._noFiltersEl.style.display = 'none';
    this._container.style.display = 'block';
    this._container.innerHTML = '';

    for (const filter of this._selectedNode.filters) {
      const filterSection = this.createFilterSection(filter);
      this._container.appendChild(filterSection);
    }
  }

  private createFilterSection(filter: FilterInfo): HTMLElement {
    const section = document.createElement('div');
    section.className = 'filter-section';

    // Filter header (collapsible)
    const header = document.createElement('div');
    header.className = 'filter-section-header';
    header.innerHTML = `<span class="filter-toggle">▼</span> ${filter.className}`;

    const content = document.createElement('div');
    content.className = 'filter-section-content';

    header.addEventListener('click', () => {
      const isCollapsed = content.classList.toggle('collapsed');
      header.querySelector('.filter-toggle')!.textContent = isCollapsed ? '▶' : '▼';
    });

    section.appendChild(header);

    // Group uniforms by their groupName
    const uniformsByGroup = new Map<string, FilterUniform[]>();
    for (const uniform of filter.uniforms) {
      const group = uniformsByGroup.get(uniform.groupName) || [];
      group.push(uniform);
      uniformsByGroup.set(uniform.groupName, group);
    }

    for (const [_groupName, uniforms] of uniformsByGroup) {
      for (const uniform of uniforms) {
        const row = this.createUniformRow(filter, uniform);
        content.appendChild(row);
      }
    }

    section.appendChild(content);
    return section;
  }

  private createUniformRow(filter: FilterInfo, uniform: FilterUniform): HTMLElement {
    const row = document.createElement('div');
    row.className = 'filter-row';

    const label = document.createElement('label');
    label.className = 'filter-label';
    // Remove 'u' prefix from uniform names for display (e.g., uProgress -> progress)
    const displayName = uniform.name.startsWith('u') && uniform.name.length > 1 && uniform.name[1] === uniform.name[1].toUpperCase()
      ? uniform.name.slice(1).charAt(0).toLowerCase() + uniform.name.slice(2)
      : uniform.name;
    label.textContent = displayName;
    label.title = `${uniform.name} (${uniform.type})`;

    row.appendChild(label);

    // Create appropriate control based on type
    const control = this.createUniformControl(filter, uniform);
    row.appendChild(control);

    return row;
  }

  private createUniformControl(filter: FilterInfo, uniform: FilterUniform): HTMLElement {
    const { type, value, name, groupName } = uniform;
    const nodeId = this._selectedNode!.id;
    const filterIndex = filter.index;

    const wrapper = document.createElement('div');
    wrapper.className = 'filter-control-wrapper';

    // Determine control type based on uniform type and value
    if (type === 'f32') {
      // Float - use slider + number input
      const container = document.createElement('div');
      container.className = 'filter-slider-container';

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.className = 'filter-slider';
      slider.min = '0';
      slider.max = this.inferSliderMax(name, value as number);
      slider.step = this.inferSliderStep(name, value as number);
      slider.value = String(value);

      const numInput = document.createElement('input');
      numInput.type = 'number';
      numInput.className = 'filter-number';
      numInput.step = slider.step;
      numInput.value = String(value);

      const updateValue = (newValue: number) => {
        slider.value = String(newValue);
        numInput.value = String(newValue);
        this._onChange?.(nodeId, filterIndex, groupName, name, newValue);
      };

      slider.addEventListener('input', () => updateValue(parseFloat(slider.value)));
      numInput.addEventListener('change', () => updateValue(parseFloat(numInput.value)));

      container.appendChild(slider);
      container.appendChild(numInput);
      wrapper.appendChild(container);

    } else if (type === 'vec3<f32>') {
      // Check if this looks like a color
      const vecValue = value as number[];
      if (isColorLikeVec3(vecValue) || isColorUniformName(name)) {
        // Color picker
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.className = 'filter-color';
        colorInput.value = vec3ToHex(vecValue);

        colorInput.addEventListener('input', () => {
          const newVec = hexToVec3(colorInput.value);
          this._onChange?.(nodeId, filterIndex, groupName, name, newVec);
        });

        wrapper.appendChild(colorInput);
      } else {
        // Three number inputs
        const container = this.createVectorInputs(vecValue, 3, (newValue) => {
          this._onChange?.(nodeId, filterIndex, groupName, name, newValue);
        });
        wrapper.appendChild(container);
      }

    } else if (type === 'vec2<f32>') {
      const vecValue = value as number[];
      const container = this.createVectorInputs(vecValue, 2, (newValue) => {
        this._onChange?.(nodeId, filterIndex, groupName, name, newValue);
      });
      wrapper.appendChild(container);

    } else if (type === 'vec4<f32>') {
      const vecValue = value as number[];
      // Check if this looks like a color with alpha
      if (vecValue.every(v => v >= 0 && v <= 1) && isColorUniformName(name)) {
        // Color picker + alpha slider
        const container = document.createElement('div');
        container.className = 'filter-color-alpha-container';

        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.className = 'filter-color';
        colorInput.value = vec3ToHex(vecValue.slice(0, 3));

        const alphaInput = document.createElement('input');
        alphaInput.type = 'range';
        alphaInput.className = 'filter-slider filter-alpha-slider';
        alphaInput.min = '0';
        alphaInput.max = '1';
        alphaInput.step = '0.01';
        alphaInput.value = String(vecValue[3]);

        const updateValue = () => {
          const rgb = hexToVec3(colorInput.value);
          const newVec = [...rgb, parseFloat(alphaInput.value)];
          this._onChange?.(nodeId, filterIndex, groupName, name, newVec);
        };

        colorInput.addEventListener('input', updateValue);
        alphaInput.addEventListener('input', updateValue);

        container.appendChild(colorInput);
        container.appendChild(alphaInput);
        wrapper.appendChild(container);
      } else {
        // Four number inputs
        const container = this.createVectorInputs(vecValue, 4, (newValue) => {
          this._onChange?.(nodeId, filterIndex, groupName, name, newValue);
        });
        wrapper.appendChild(container);
      }

    } else if (type === 'bool') {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'filter-checkbox';
      checkbox.checked = Boolean(value);

      checkbox.addEventListener('change', () => {
        this._onChange?.(nodeId, filterIndex, groupName, name, checkbox.checked);
      });

      wrapper.appendChild(checkbox);

    } else {
      // Unknown type - show as text
      const textInput = document.createElement('input');
      textInput.type = 'text';
      textInput.className = 'filter-text';
      textInput.value = JSON.stringify(value);
      textInput.disabled = true;
      textInput.title = `Unknown type: ${type}`;

      wrapper.appendChild(textInput);
    }

    return wrapper;
  }

  private createVectorInputs(
    value: number[],
    components: number,
    onChange: (newValue: number[]) => void
  ): HTMLElement {
    const container = document.createElement('div');
    container.className = 'filter-vector-container';

    const labels = ['x', 'y', 'z', 'w'];
    const inputs: HTMLInputElement[] = [];

    for (let i = 0; i < components; i++) {
      const inputWrapper = document.createElement('div');
      inputWrapper.className = 'filter-vector-input';

      const inputLabel = document.createElement('span');
      inputLabel.className = 'filter-vector-label';
      inputLabel.textContent = labels[i];

      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'filter-number filter-vector-number';
      input.step = '0.01';
      input.value = String(value[i] ?? 0);

      input.addEventListener('change', () => {
        const newValue = inputs.map(inp => parseFloat(inp.value));
        onChange(newValue);
      });

      inputs.push(input);
      inputWrapper.appendChild(inputLabel);
      inputWrapper.appendChild(input);
      container.appendChild(inputWrapper);
    }

    return container;
  }

  private inferSliderMax(name: string, currentValue: number): string {
    // Common patterns for uniform naming
    const lowerName = name.toLowerCase();

    if (lowerName.includes('alpha') || lowerName.includes('opacity') || lowerName.includes('progress')) {
      return '1';
    }
    if (lowerName.includes('angle')) {
      return String(Math.PI * 2);
    }
    if (lowerName.includes('intensity') || lowerName.includes('strength')) {
      return '20';
    }
    if (lowerName.includes('frequency')) {
      return '20';
    }
    if (lowerName.includes('speed')) {
      return '10';
    }

    // Default: use current value to estimate range
    if (currentValue <= 1) return '1';
    if (currentValue <= 10) return '10';
    if (currentValue <= 100) return '100';
    return String(Math.ceil(currentValue * 2));
  }

  private inferSliderStep(name: string, currentValue: number): string {
    const lowerName = name.toLowerCase();

    if (lowerName.includes('alpha') || lowerName.includes('opacity') || lowerName.includes('progress')) {
      return '0.01';
    }
    if (currentValue < 0.1) return '0.001';
    if (currentValue < 1) return '0.01';
    if (currentValue < 10) return '0.1';
    return '1';
  }
}
