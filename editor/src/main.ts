import { connection } from './connection';
import { TreeView } from './tree-view';
import { PropertyPanel } from './property-panel';
import { ContainerNode } from './types';

// DOM elements
const connectionDropdown = document.getElementById('connection-dropdown')!;
const connectionDropdownBtn = document.getElementById('connection-dropdown-btn')!;
const connectionDropdownMenu = document.getElementById('connection-dropdown-menu')!;
const sessionDropdown = document.getElementById('session-dropdown')!;
const sessionDropdownBtn = document.getElementById('session-dropdown-btn')! as HTMLButtonElement;
const sessionList = document.getElementById('session-list')!;
const sessionCreate = document.getElementById('session-create')!;
const saveSessionBtn = document.getElementById('save-session-btn')! as HTMLButtonElement;
const autosaveLabel = document.getElementById('autosave-label')!;
const autosaveCheckbox = document.getElementById('autosave-checkbox')! as HTMLInputElement;
const viewChangesBtn = document.getElementById('view-changes-btn')!;
const changesModal = document.getElementById('changes-modal')!;
const changesList = document.getElementById('changes-list')!;
const closeModalBtn = document.getElementById('close-modal-btn')!;
const resetAllBtn = document.getElementById('reset-all-btn')!;

// Track current session
let currentSessionName: string | null = null;
let originalsCaptured = false;

// Load autosave preference
const AUTOSAVE_KEY = 'layout-editor-autosave';
autosaveCheckbox.checked = localStorage.getItem(AUTOSAVE_KEY) === 'true';

const updateSaveButton = () => {
  saveSessionBtn.disabled = !connection.isConnected || autosaveCheckbox.checked;
};

autosaveCheckbox.addEventListener('change', () => {
  localStorage.setItem(AUTOSAVE_KEY, String(autosaveCheckbox.checked));
  updateSaveButton();
});

// Initial state
updateSaveButton();

// Tree view
const treeView = new TreeView('tree-view');

// Property panel
const propertyPanel = new PropertyPanel('property-form', 'no-selection');

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

// Update session controls based on connection state
const updateSessionControls = (connected: boolean) => {
  sessionDropdown.style.display = connected ? 'block' : 'none';
  saveSessionBtn.style.display = connected ? 'inline-block' : 'none';
  autosaveLabel.style.display = connected ? 'flex' : 'none';
  viewChangesBtn.style.display = connected ? 'inline-block' : 'none';
  if (connected) {
    updateSaveButton();
  }
};

// Tree view handlers
treeView.onSelect((node) => {
  propertyPanel.setSelectedNode(node);
  // Also highlight selected node in game
  connection.send({ type: 'highlight', id: node?.id || null });
});

treeView.onHover((nodeId) => {
  // When not hovering, default to highlighting the selected node
  const highlightId = nodeId ?? treeView.getSelectedId();
  connection.send({ type: 'highlight', id: highlightId });
});

// Property panel handlers
propertyPanel.onChange((nodeId, property, value) => {
  connection.send({ type: 'set-property', id: nodeId, property, value });

  // Auto-save to current session if enabled
  if (autosaveCheckbox.checked && currentSessionName) {
    propertyPanel.saveSession(currentSessionName);
  }
});

propertyPanel.onChangesUpdated(() => {
  treeView.setChangedNodes(propertyPanel.getChangedNodeIds());
});

propertyPanel.onCopy((nodeId) => {
  connection.send({ type: 'get-layout', id: nodeId });
});

propertyPanel.onReset((nodeId, properties) => {
  for (const [property, value] of Object.entries(properties)) {
    connection.send({ type: 'set-property', id: nodeId, property, value });
  }
});

// View Changes modal
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

// Connection dropdown
const updateConnectionDropdown = (connected: boolean) => {
  connectionDropdownBtn.textContent = connected ? 'Connected' : 'Disconnected';
  connectionDropdownBtn.classList.toggle('connected', connected);
  connectionDropdownBtn.classList.toggle('disconnected', !connected);

  connectionDropdownMenu.innerHTML = '';

  if (connected) {
    const refreshItem = document.createElement('div');
    refreshItem.className = 'dropdown-item';
    refreshItem.textContent = 'Refresh';
    refreshItem.addEventListener('click', () => {
      connection.send({ type: 'get-hierarchy' });
      connectionDropdown.classList.remove('open');
    });

    const disconnectItem = document.createElement('div');
    disconnectItem.className = 'dropdown-item';
    disconnectItem.textContent = 'Disconnect';
    disconnectItem.addEventListener('click', () => {
      connection.disconnect();
      connectionDropdown.classList.remove('open');
    });

    connectionDropdownMenu.appendChild(refreshItem);
    connectionDropdownMenu.appendChild(disconnectItem);
  } else {
    const connectItem = document.createElement('div');
    connectItem.className = 'dropdown-item';
    connectItem.textContent = 'Connect';
    connectItem.addEventListener('click', () => {
      connection.connect();
      connectionDropdown.classList.remove('open');
    });

    connectionDropdownMenu.appendChild(connectItem);
  }
};

// Connection status
connection.onStatusChange((connected) => {
  updateConnectionDropdown(connected);
  updateSessionControls(connected);

  if (!connected) {
    originalsCaptured = false;
    propertyPanel.clearOriginals();
  }
});

// Toggle connection dropdown
connectionDropdownBtn.addEventListener('click', () => {
  connectionDropdown.classList.toggle('open');
});

// Initial state
updateConnectionDropdown(false);

// Handle hierarchy updates
connection.on('hierarchy', (msg) => {
  const nodes = msg.data as ContainerNode[];

  // Capture originals only on first hierarchy after connect
  if (!originalsCaptured) {
    propertyPanel.captureOriginals(nodes);
    originalsCaptured = true;

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
  treeView.setChangedNodes(propertyPanel.getChangedNodeIds());
});

// Handle property updates
connection.on('updated', (msg) => {
  propertyPanel.updateNodeLayout(msg.id, msg.layout, msg.transform);
});

// Handle layout config (for copy)
connection.on('layout-config', (msg) => {
  const configStr = JSON.stringify(msg.config, null, 2);
  navigator.clipboard.writeText(configStr).then(() => {
    alert('Layout copied to clipboard!');
  });
});

// Session dropdown management
const updateSessionList = () => {
  const sessions = propertyPanel.getSessions();
  sessionList.innerHTML = '';

  sessions.forEach((name) => {
    const item = document.createElement('div');
    item.className = 'dropdown-item';
    if (name === currentSessionName) {
      item.classList.add('selected');
    }

    const nameSpan = document.createElement('span');
    nameSpan.className = 'session-name';
    nameSpan.textContent = name;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Delete session "${name}"?`)) {
        propertyPanel.deleteSession(name);
        if (currentSessionName === name) {
          currentSessionName = null;
          sessionDropdownBtn.textContent = 'Select Session';
        }
        updateSessionList();
      }
    });

    item.appendChild(nameSpan);
    item.appendChild(deleteBtn);

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

    sessionList.appendChild(item);
  });
};

// Toggle dropdown
sessionDropdownBtn.addEventListener('click', () => {
  if (!sessionDropdownBtn.disabled) {
    sessionDropdown.classList.toggle('open');
  }
});

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
  if (!sessionDropdown.contains(e.target as Node)) {
    sessionDropdown.classList.remove('open');
  }
  if (!connectionDropdown.contains(e.target as Node)) {
    connectionDropdown.classList.remove('open');
  }
});

// Create new session
sessionCreate.addEventListener('click', () => {
  const name = prompt('New session name:');
  if (name && name.trim()) {
    propertyPanel.saveSession(name.trim());
    currentSessionName = name.trim();
    sessionDropdownBtn.textContent = name.trim();
    sessionDropdown.classList.remove('open');
    updateSessionList();
  }
});

saveSessionBtn.addEventListener('click', () => {
  if (currentSessionName) {
    propertyPanel.saveSession(currentSessionName);
    console.log(`[Layout Editor] Saved to session: ${currentSessionName}`);
  } else {
    const name = prompt('No session loaded. Create new session:');
    if (name && name.trim()) {
      propertyPanel.saveSession(name.trim());
      currentSessionName = name.trim();
      sessionDropdownBtn.textContent = name.trim();
      updateSessionList();
    }
  }
});

// Initial display updates
updateSessionControls(false);
updateSessionList();

console.log('Layout Editor loaded');
