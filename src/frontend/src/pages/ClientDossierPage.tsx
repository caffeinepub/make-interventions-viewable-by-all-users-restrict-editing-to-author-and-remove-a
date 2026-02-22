import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { useGetClient } from '../hooks/useClients';
import { useGetClientInterventions } from '../hooks/useInterventions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Plus, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import EditClientDialog from '../components/clients/EditClientDialog';
import AddInterventionDialog from '../components/interventions/AddInterventionDialog';
import InterventionList from '../components/interventions/InterventionList';
import BlacklistPanel from '../components/blacklist/BlacklistPanel';
import MobileLayout from '../components/layout/MobileLayout';
import AppBadge from '../components/common/AppBadge';
import { useQueryClient } from '@tanstack/react-query';

export default function ClientDossierPage() {
  const { clientId } = useParams({ from: '/clients/$clientId' });
  const { data: client, isLoading: clientLoading, isError: clientError, error: clientErrorObj, refetch: refetchClient } = useGetClient(clientId);
  const { data: interventions = [], isLoading: interventionsLoading, isError: interventionsError, error: interventionsErrorObj, refetch: refetchInterventions } = useGetClientInterventions(clientId);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddInterventionOpen, setIsAddInterventionOpen] = useState(false);
  const queryClient = useQueryClient();

  console.log('[ClientDossierPage] Rendering for clientId:', clientId);
  console.log('[ClientDossierPage] Client loading:', clientLoading, 'error:', clientError);
  console.log('[ClientDossierPage] Interventions loading:', interventionsLoading, 'error:', interventionsError);
  console.log('[ClientDossierPage] Client data:', client ? { name: client.info.name, isBlacklisted: client.isBlacklisted } : 'null');
  console.log('[ClientDossierPage] Interventions count:', interventions.length);

  const handleRetryClient = () => {
    console.log('[ClientDossierPage] Retrying client data fetch');
    queryClient.invalidateQueries({ queryKey: ['client', clientId] });
    refetchClient();
  };

  const handleRetryInterventions = () => {
    console.log('[ClientDossierPage] Retrying interventions data fetch');
    queryClient.invalidateQueries({ queryKey: ['interventions', clientId] });
    refetchInterventions();
  };

  if (clientLoading) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement du dossier client...</p>
        </div>
      </MobileLayout>
    );
  }

  if (clientError || !client) {
    return (
      <MobileLayout>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="p-3 rounded-full bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  Impossible de charger le client
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {clientErrorObj instanceof Error 
                    ? clientErrorObj.message.includes('Non autorisé')
                      ? 'Accès refusé - Veuillez vous reconnecter'
                      : clientErrorObj.message
                    : 'Une erreur est survenue lors du chargement des données'}
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Vérifiez la console du navigateur (F12) pour plus de détails
                </p>
                <Button onClick={handleRetryClient} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réessayer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle>{client.info.name}</CardTitle>
                {client.isBlacklisted && (
                  <AppBadge variant="destructive">Liste noire</AppBadge>
                )}
              </div>
              {!client.isBlacklisted && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Adresse:</span>
                <p className="text-muted-foreground">{client.info.address.street}</p>
                <p className="text-muted-foreground">
                  {client.info.address.city}, {client.info.address.state}{' '}
                  {client.info.address.zip}
                </p>
              </div>
              <div>
                <span className="font-medium">Téléphone:</span>
                <p className="text-muted-foreground">{client.info.phone}</p>
              </div>
              <div>
                <span className="font-medium">Email:</span>
                <p className="text-muted-foreground">{client.info.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <BlacklistPanel clientId={clientId} client={client} />

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Interventions</CardTitle>
              <Button size="sm" onClick={() => setIsAddInterventionOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {interventionsLoading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Chargement des interventions...</p>
              </div>
            ) : interventionsError ? (
              <div className="flex flex-col items-center gap-4 text-center py-8">
                <div className="p-3 rounded-full bg-destructive/10">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">
                    Impossible de charger les interventions
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {interventionsErrorObj instanceof Error 
                      ? interventionsErrorObj.message.includes('Non autorisé')
                        ? 'Accès refusé - Veuillez vous reconnecter'
                        : interventionsErrorObj.message
                      : 'Une erreur est survenue'}
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Vérifiez la console du navigateur (F12) pour plus de détails
                  </p>
                  <Button onClick={handleRetryInterventions} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Réessayer
                  </Button>
                </div>
              </div>
            ) : (
              <InterventionList clientId={clientId} />
            )}
          </CardContent>
        </Card>
      </div>

      {client && (
        <EditClientDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          currentClient={client}
          clientId={clientId}
        />
      )}

      <AddInterventionDialog
        open={isAddInterventionOpen}
        onOpenChange={setIsAddInterventionOpen}
        clientId={clientId}
      />
    </MobileLayout>
  );
}
