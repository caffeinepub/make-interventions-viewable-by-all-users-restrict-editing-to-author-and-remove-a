import { getOfflineOperations, removeOfflineOperation } from './outbox';
import type { backendInterface } from '../backend';

export async function syncOfflineOperations(actor: backendInterface): Promise<void> {
  const operations = await getOfflineOperations();

  for (const op of operations) {
    try {
      switch (op.type) {
        case 'createOrUpdateClient':
          await actor.createOrUpdateClient(
            op.data.id,
            op.data.name,
            op.data.address,
            op.data.phone,
            op.data.email
          );
          break;

        case 'addIntervention':
          await actor.addIntervention(
            op.data.clientId,
            op.data.comments,
            op.data.media,
            op.data.day,
            op.data.month,
            op.data.year
          );
          break;

        case 'updateIntervention':
          await actor.updateIntervention(
            op.data.interventionId,
            op.data.clientId,
            op.data.comments,
            op.data.media,
            op.data.day,
            op.data.month,
            op.data.year
          );
          break;

        case 'deleteIntervention':
          await actor.deleteIntervention(
            op.data.interventionId,
            op.data.clientId
          );
          break;

        case 'markAsBlacklisted':
          await actor.markAsBlacklisted(
            op.data.clientId,
            op.data.comments,
            op.data.media
          );
          break;

        case 'unmarkAsBlacklisted':
          await actor.unmarkAsBlacklisted(op.data.clientId);
          break;

        default:
          console.warn('Type d\'opération inconnu:', op.type);
      }

      if (op.id !== undefined) {
        await removeOfflineOperation(op.id);
        console.log(`Opération ${op.type} synchronisée avec succès`);
      }
    } catch (error: any) {
      console.error(`Échec de la synchronisation de l'opération ${op.type}:`, error);

      // Remove unauthorized operations from queue
      if (
        error.message?.includes('Non autorisé') &&
        (op.type === 'updateIntervention' || op.type === 'deleteIntervention')
      ) {
        console.log('Suppression de l\'opération non autorisée de la file d\'attente');
        if (op.id !== undefined) {
          await removeOfflineOperation(op.id);
        }
      }
      
      // Don't throw - continue with next operation
    }
  }
}
