import { addToOutbox, getOutboxItems, removeFromOutbox } from './db';

export interface OutboxOperation {
  id?: number;
  type: string;
  payload: Record<string, unknown>;
  timestamp?: number;
}

export async function enqueue(operation: Omit<OutboxOperation, 'id' | 'timestamp'>): Promise<void> {
  await addToOutbox(operation as Record<string, unknown>);
}

export async function getAll(): Promise<OutboxOperation[]> {
  const items = await getOutboxItems();
  return items.map((item) => ({
    id: item.id,
    type: (item.type as string) || '',
    payload: (item.payload as Record<string, unknown>) || {},
    timestamp: item.timestamp as number | undefined,
  }));
}

export async function remove(id: number): Promise<void> {
  await removeFromOutbox(id);
}
