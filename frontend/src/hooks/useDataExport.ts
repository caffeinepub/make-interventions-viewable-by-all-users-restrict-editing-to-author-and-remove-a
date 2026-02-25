import { useState } from 'react';
import { useActor } from './useActor';
import { toast } from 'sonner';
import type { Intervention } from '../backend';

export function useDataExport() {
  const { actor } = useActor();
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const exportData = async (format: 'json' | 'pdf') => {
    if (!actor) {
      toast.error('Acteur non disponible');
      return;
    }

    setIsExporting(true);
    setProgress(0);

    try {
      // Fetch all data
      setProgress(10);
      const clients = await actor.getClients();
      
      setProgress(30);
      const technicalFiles = await actor.listTechnicalFiles();
      
      setProgress(50);
      // Fetch interventions for all clients
      const allInterventions: Intervention[] = [];
      for (let i = 0; i < clients.length; i++) {
        const interventions = await actor.getClientInterventions(clients[i].info.name);
        allInterventions.push(...interventions);
        setProgress(50 + Math.floor((i / clients.length) * 30));
      }

      setProgress(80);

      const data = {
        exportDate: new Date().toISOString(),
        clients: clients.map(c => ({
          name: c.info.name,
          address: c.info.address,
          phone: c.info.phone,
          email: c.info.email,
          isBlacklisted: c.isBlacklisted,
          blacklistComments: c.blacklistComments,
        })),
        interventions: allInterventions.map(i => ({
          id: i.id,
          clientId: i.clientId,
          date: `${i.date.day}/${i.date.month}/${i.date.year}`,
          comments: i.comments,
          mediaCount: i.media.length,
        })),
        technicalFiles: technicalFiles.map(([path]) => path),
      };

      setProgress(90);

      if (format === 'json') {
        // Export as JSON
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vial-traite-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Export as PDF (simple text-based PDF)
        const pdfContent = generatePDFContent(data);
        const blob = new Blob([pdfContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vial-traite-backup-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setProgress(100);
      toast.success('Export terminé avec succès');
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(`Erreur d'export: ${error.message || 'Échec de l\'export des données'}`);
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  };

  return {
    exportData,
    isExporting,
    progress,
  };
}

function generatePDFContent(data: any): string {
  let content = `VIAL TRAITE SERVICE - RAPPORT D'EXPORT\n`;
  content += `Date d'export: ${new Date(data.exportDate).toLocaleString('fr-FR')}\n`;
  content += `\n${'='.repeat(80)}\n\n`;

  content += `CLIENTS (${data.clients.length})\n`;
  content += `${'='.repeat(80)}\n\n`;
  data.clients.forEach((client: any, index: number) => {
    content += `${index + 1}. ${client.name}\n`;
    content += `   Adresse: ${client.address.street}, ${client.address.city}, ${client.address.state} ${client.address.zip}\n`;
    content += `   Téléphone: ${client.phone}\n`;
    content += `   Email: ${client.email}\n`;
    if (client.isBlacklisted) {
      content += `   ⚠️ LISTE NOIRE: ${client.blacklistComments}\n`;
    }
    content += `\n`;
  });

  content += `\n${'='.repeat(80)}\n\n`;
  content += `INTERVENTIONS (${data.interventions.length})\n`;
  content += `${'='.repeat(80)}\n\n`;
  data.interventions.forEach((intervention: any, index: number) => {
    content += `${index + 1}. Client: ${intervention.clientId}\n`;
    content += `   Date: ${intervention.date}\n`;
    content += `   Commentaires: ${intervention.comments || 'Aucun'}\n`;
    content += `   Fichiers joints: ${intervention.mediaCount}\n`;
    content += `\n`;
  });

  content += `\n${'='.repeat(80)}\n\n`;
  content += `DOSSIER TECHNIQUE (${data.technicalFiles.length} fichiers)\n`;
  content += `${'='.repeat(80)}\n\n`;
  data.technicalFiles.forEach((path: string, index: number) => {
    content += `${index + 1}. ${path}\n`;
  });

  return content;
}
