import { useState } from 'react';
import { useActor } from './useActor';

export function useDataExport() {
  const { actor } = useActor();
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const exportData = async (format: 'json' | 'pdf') => {
    if (!actor) return;
    setIsExporting(true);
    setProgress(0);

    try {
      setProgress(10);
      const clients = await actor.getClients();
      setProgress(30);

      const interventionsMap: Record<string, unknown[]> = {};
      for (let i = 0; i < clients.length; i++) {
        const client = clients[i];
        const clientId = `${client.info.name.toLowerCase().replace(/\s+/g, '-')}-${i}`;
        try {
          const interventions = await actor.getClientInterventions(clientId);
          interventionsMap[clientId] = interventions.map((inv) => ({
            id: inv.id,
            clientId: inv.clientId,
            comments: inv.comments,
            date: {
              day: Number(inv.date.day),
              month: Number(inv.date.month),
              year: Number(inv.date.year),
            },
            employee: inv.employee.toString(),
          }));
        } catch {
          interventionsMap[clientId] = [];
        }
        setProgress(30 + Math.floor((i / clients.length) * 40));
      }

      setProgress(70);
      const technicalFiles = await actor.listTechnicalFiles();
      setProgress(90);

      const exportPayload = {
        exportedAt: new Date().toISOString(),
        clients: clients.map((c, i) => ({
          id: `${c.info.name.toLowerCase().replace(/\s+/g, '-')}-${i}`,
          name: c.info.name,
          address: c.info.address,
          phone: c.info.phone,
          email: c.info.email,
          isBlacklisted: c.isBlacklisted,
          blacklistComments: c.blacklistComments,
        })),
        interventions: interventionsMap,
        technicalFiles: technicalFiles.map(([path]) => path),
      };

      const content =
        format === 'json'
          ? JSON.stringify(exportPayload, null, 2)
          : formatAsText(exportPayload);

      const mimeType = format === 'json' ? 'application/json' : 'text/plain';
      const extension = format === 'json' ? 'json' : 'txt';
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vial-traite-export-${new Date().toISOString().split('T')[0]}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setProgress(100);
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  };

  return { exportData, isExporting, progress };
}

function formatAsText(data: {
  exportedAt: string;
  clients: Array<{
    id: string;
    name: string;
    address: { street: string; city: string; state: string; zip: string };
    phone: string;
    email: string;
    isBlacklisted: boolean;
    blacklistComments: string;
  }>;
  interventions: Record<string, unknown[]>;
  technicalFiles: string[];
}): string {
  const lines: string[] = [
    'VIAL TRAITE SERVICE - EXPORT DES DONNÉES',
    `Date d'export: ${data.exportedAt}`,
    '',
    '=== CLIENTS ===',
  ];

  for (const client of data.clients) {
    lines.push(`\nClient: ${client.name}`);
    lines.push(`  Adresse: ${client.address.street}, ${client.address.city} ${client.address.zip}`);
    if (client.phone) lines.push(`  Téléphone: ${client.phone}`);
    if (client.email) lines.push(`  Email: ${client.email}`);
    if (client.isBlacklisted) {
      lines.push(`  ⚠ LISTE NOIRE: ${client.blacklistComments}`);
    }

    const interventions = data.interventions[client.id] as Array<{
      id: string;
      comments: string;
      date: { day: number; month: number; year: number };
    }> | undefined;

    if (interventions && interventions.length > 0) {
      lines.push(`  Interventions (${interventions.length}):`);
      for (const inv of interventions) {
        const d = inv.date;
        lines.push(
          `    - ${String(d.day).padStart(2, '0')}/${String(d.month).padStart(2, '0')}/${d.year}: ${inv.comments || '(sans commentaire)'}`
        );
      }
    }
  }

  lines.push('', '=== FICHIERS TECHNIQUES ===');
  for (const file of data.technicalFiles) {
    lines.push(`  - ${file}`);
  }

  return lines.join('\n');
}
