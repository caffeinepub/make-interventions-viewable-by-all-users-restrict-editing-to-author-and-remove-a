import type { backendInterface } from "../backend";
import { getAll, remove } from "./outbox";

export async function syncPendingOperations(
  actor: backendInterface,
): Promise<void> {
  const operations = await getAll();

  for (const operation of operations) {
    try {
      switch (operation.type) {
        case "addIntervention": {
          const p = operation.payload as {
            clientId: string;
            comments: string;
            media: [];
            day: number;
            month: number;
            year: number;
          };
          await actor.addIntervention(
            p.clientId,
            p.comments,
            p.media,
            BigInt(p.day),
            BigInt(p.month),
            BigInt(p.year),
          );
          break;
        }
        case "createOrUpdateClient": {
          const p = operation.payload as {
            id: string;
            name: string;
            address: {
              street: string;
              city: string;
              state: string;
              zip: string;
            };
            phone: string;
            email: string;
          };
          await actor.createOrUpdateClient(
            p.id,
            p.name,
            p.address,
            p.phone,
            p.email,
          );
          break;
        }
        default:
          break;
      }

      if (operation.id !== undefined) {
        await remove(operation.id);
      }
    } catch (error: unknown) {
      const err = error as Error;
      if (
        err?.message?.includes("Non autorisé") ||
        err?.message?.includes("Unauthorized")
      ) {
        if (operation.id !== undefined) {
          await remove(operation.id);
        }
      }
    }
  }
}
