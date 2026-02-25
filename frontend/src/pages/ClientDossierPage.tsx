import React, { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Edit, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useClientById } from '../hooks/useClients';
import InterventionList from '../components/interventions/InterventionList';
import BlacklistPanel from '../components/blacklist/BlacklistPanel';
import EditClientDialog from '../components/clients/EditClientDialog';

export default function ClientDossierPage() {
  // Use strict: false to avoid route path mismatch issues with pathless layout routes
  const { clientId } = useParams({ strict: false }) as { clientId: string };
  const navigate = useNavigate();
  const [showEdit, setShowEdit] = useState(false);

  const decodedId = clientId ? decodeURIComponent(clientId) : '';
  const { data: client, isLoading, isError, refetch } = useClientById(decodedId);

  if (!clientId) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center p-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">Identifiant client manquant</p>
        <Button variant="outline" size="sm" onClick={() => navigate({ to: '/' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux clients
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/' })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold flex-1 truncate">
          {isLoading ? 'Chargement...' : client?.info.name ?? 'Client'}
        </h1>
        {client && (
          <Button variant="outline" size="icon" onClick={() => setShowEdit(true)}>
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">Erreur lors du chargement du client</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
        </div>
      )}

      {!isLoading && !isError && client && (
        <>
          <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-foreground">{client.info.name}</h2>
              {client.isBlacklisted && (
                <Badge variant="destructive">Liste noire</Badge>
              )}
            </div>
            <Separator />
            <div className="grid grid-cols-1 gap-1 text-sm">
              <div>
                <span className="text-muted-foreground">Adresse : </span>
                <span>{client.info.address.street}, {client.info.address.city}</span>
                {client.info.address.state && <span>, {client.info.address.state}</span>}
                {client.info.address.zip && <span> {client.info.address.zip}</span>}
              </div>
              {client.info.phone && (
                <div>
                  <span className="text-muted-foreground">Téléphone : </span>
                  <span>{client.info.phone}</span>
                </div>
              )}
              {client.info.email && (
                <div>
                  <span className="text-muted-foreground">Email : </span>
                  <span>{client.info.email}</span>
                </div>
              )}
            </div>
          </div>

          <BlacklistPanel clientId={decodedId} client={client} />

          <InterventionList clientId={decodedId} />

          <EditClientDialog
            open={showEdit}
            onOpenChange={setShowEdit}
            client={client}
            clientId={decodedId}
          />
        </>
      )}
    </div>
  );
}
