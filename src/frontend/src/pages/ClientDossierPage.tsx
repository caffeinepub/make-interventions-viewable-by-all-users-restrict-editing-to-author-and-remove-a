import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Edit, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EditClientDialog from '@/components/clients/EditClientDialog';
import InterventionList from '@/components/interventions/InterventionList';
import BlacklistPanel from '@/components/blacklist/BlacklistPanel';
import { useGetClient } from '@/hooks/useClients';

export default function ClientDossierPage() {
  const navigate = useNavigate();
  const { clientId } = useParams({ from: '/clients/$clientId' });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const {
    data: client,
    isLoading: clientLoading,
    error: clientError,
    refetch: refetchClient,
  } = useGetClient(clientId);

  if (clientLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (clientError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            Erreur de chargement du client
          </h2>
          <p className="text-sm text-muted-foreground max-w-md">
            {clientError instanceof Error
              ? clientError.message
              : 'Une erreur est survenue'}
          </p>
          <p className="text-xs text-muted-foreground">
            Client ID: {clientId}
          </p>
          <p className="text-xs text-muted-foreground">
            Vérifiez la console pour plus de détails (Référence:
            ClientDossierPage - Client)
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetchClient()} variant="outline">
            Réessayer
          </Button>
          <Button onClick={() => navigate({ to: '/clients' })} variant="ghost">
            Retour aux clients
          </Button>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            Client introuvable
          </h2>
          <p className="text-sm text-muted-foreground">
            Le client avec l'ID "{clientId}" n'existe pas.
          </p>
        </div>
        <Button onClick={() => navigate({ to: '/clients' })} variant="outline">
          Retour aux clients
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 pb-20">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: '/clients' })}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground flex-1">
          {client.info.name}
        </h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditDialogOpen(true)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Modifier
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coordonnées</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Adresse</p>
            <p className="text-foreground">{client.info.address.street}</p>
            <p className="text-foreground">
              {client.info.address.city}, {client.info.address.state}{' '}
              {client.info.address.zip}
            </p>
          </div>
          {client.info.phone && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Téléphone
              </p>
              <p className="text-foreground">{client.info.phone}</p>
            </div>
          )}
          {client.info.email && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-foreground">{client.info.email}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <BlacklistPanel client={client} clientId={clientId} />

      <InterventionList clientId={clientId} />

      <EditClientDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        currentClient={client}
        clientId={clientId}
      />
    </div>
  );
}
