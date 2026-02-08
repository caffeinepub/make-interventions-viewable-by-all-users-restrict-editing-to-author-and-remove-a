import { getAllFromOutbox, removeFromOutbox } from './db';
import { createActorWithConfig } from '../config';
import { ExternalBlob } from '../backend';

export async function getPendingOperationsCount(): Promise<number> {
  const operations = await getAllFromOutbox();
  return operations.length;
}

export async function syncAllOperations() {
  const operations = await getAllFromOutbox();
  if (operations.length === 0) return;

  const actor = await createActorWithConfig();

  for (const operation of operations) {
    try {
      switch (operation.type) {
        case 'createOrUpdateClient':
          await actor.createOrUpdateClient(
            operation.data.id,
            operation.data.name,
            operation.data.address,
            operation.data.phone,
            operation.data.email
          );
          break;

        case 'addIntervention':
          await actor.addIntervention(
            operation.data.clientId,
            operation.data.comments,
            operation.data.media,
            BigInt(operation.data.day),
            BigInt(operation.data.month),
            BigInt(operation.data.year)
          );
          break;

        case 'updateIntervention':
          await actor.updateIntervention(
            operation.data.interventionId,
            operation.data.clientId,
            operation.data.comments,
            operation.data.media,
            BigInt(operation.data.day),
            BigInt(operation.data.month),
            BigInt(operation.data.year)
          );
          break;

        case 'markAsBlacklisted':
          await actor.markAsBlacklisted(operation.data.clientId, operation.data.comments, operation.data.media);
          break;

        case 'unmarkAsBlacklisted':
          await actor.unmarkAsBlacklisted(operation.data.clientId);
          break;
      }

      if (operation.id) {
        await removeFromOutbox(operation.id);
      }
    } catch (error) {
      console.error('Sync error for operation:', operation, error);
    }
  }
}
