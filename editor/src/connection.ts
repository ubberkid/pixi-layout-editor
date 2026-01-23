export type MessageHandler = (data: any) => void;

export class Connection {
  private _channel: BroadcastChannel | null = null;
  private _handlers: Map<string, MessageHandler[]> = new Map();
  private _onStatusChange: ((connected: boolean) => void) | null = null;
  private _connected = false;

  get isConnected(): boolean {
    return this._connected;
  }

  onStatusChange(callback: (connected: boolean) => void): void {
    this._onStatusChange = callback;
  }

  on(type: string, handler: MessageHandler): void {
    if (!this._handlers.has(type)) {
      this._handlers.set(type, []);
    }
    this._handlers.get(type)!.push(handler);
  }

  connect(): void {
    if (this._channel) {
      this._channel.close();
    }

    this._channel = new BroadcastChannel('layout-editor');

    this._channel.onmessage = (event) => {
      // First message means we're connected
      if (!this._connected) {
        this._connected = true;
        this._onStatusChange?.(true);
      }

      const message = event.data;
      const handlers = this._handlers.get(message.type);
      if (handlers) {
        handlers.forEach((h) => h(message));
      }
    };

    // Request hierarchy to establish connection
    this.send({ type: 'get-hierarchy' });

    // Check connection after delay
    setTimeout(() => {
      if (!this._connected) {
        console.log('No response from game - make sure you are in the BingoGameScene');
      }
    }, 1000);
  }

  disconnect(): void {
    this._channel?.close();
    this._channel = null;
    this._connected = false;
    this._onStatusChange?.(false);
  }

  send(message: object): void {
    this._channel?.postMessage(message);
  }
}

export const connection = new Connection();
