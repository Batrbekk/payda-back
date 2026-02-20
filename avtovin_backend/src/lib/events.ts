// In-memory SSE connection store for real-time events
// Each userId can have multiple active connections (multiple devices/tabs)

type SendFn = (event: string, data: unknown) => void;

class EventStore {
  private connections = new Map<string, Set<SendFn>>();

  addConnection(userId: string, send: SendFn) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId)!.add(send);
  }

  removeConnection(userId: string, send: SendFn) {
    const conns = this.connections.get(userId);
    if (conns) {
      conns.delete(send);
      if (conns.size === 0) {
        this.connections.delete(userId);
      }
    }
  }

  emit(userId: string, event: string, data: unknown) {
    const conns = this.connections.get(userId);
    if (conns) {
      for (const send of conns) {
        try {
          send(event, data);
        } catch {
          // Connection might be closed
        }
      }
    }
  }

  hasConnection(userId: string): boolean {
    return (this.connections.get(userId)?.size ?? 0) > 0;
  }
}

// Singleton - persists across requests in the same Node.js process
const globalForEvents = globalThis as unknown as { eventStore: EventStore };
export const eventStore = globalForEvents.eventStore ?? new EventStore();
globalForEvents.eventStore = eventStore;
