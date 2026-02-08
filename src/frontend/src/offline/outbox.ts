import { addToOutbox, type OfflineOperation } from './db';

export async function enqueueOfflineOperation(operation: Omit<OfflineOperation, 'id'>) {
  await addToOutbox(operation as OfflineOperation);
}
