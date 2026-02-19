import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetClient } from '../hooks/useClients';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit } from 'lucide-react';
import { useState } from 'react';
import EditClientDialog from '../components/clients/EditClientDialog';
import InterventionList from '../components/interventions/InterventionList';
import BlacklistPanel from '../components/blacklist/BlacklistPanel';
import MobileLayout from '../components/layout/MobileLayout';

export default function ClientDossierPage() {
  const { clientId } = useParams({ from: '/clients/$clientId' });
  const navigate = useNavigate();
  const { data: client, isLoading } = useGetClient(clientId);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="text-center py-8">Chargement...</div>
      </MobileLayout>
    );
  }

  if (!client) {
    return (
      <MobileLayout>
        <div className="text-center py-8">Client non trouvé</div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: '/clients' })}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold flex-1">{client.info.name}</h1>
          {!client.isBlacklisted && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Tabs defaultValue="interventions" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="interventions">Interventions</TabsTrigger>
            <TabsTrigger value="info">Informations</TabsTrigger>
            <TabsTrigger value="blacklist">Liste noire</TabsTrigger>
          </TabsList>

          <TabsContent value="interventions" className="space-y-4">
            <InterventionList clientId={clientId} />
          </TabsContent>

          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Coordonnées</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Adresse</p>
                  <p className="font-medium">{client.info.address.street}</p>
                  <p className="font-medium">
                    {client.info.address.city}, {client.info.address.state}{' '}
                    {client.info.address.zip}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Téléphone</p>
                  <p className="font-medium">{client.info.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{client.info.email}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blacklist" className="space-y-4">
            <BlacklistPanel clientId={clientId} client={client} />
          </TabsContent>
        </Tabs>
      </div>

      <EditClientDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        clientId={clientId}
        currentClient={client}
      />
    </MobileLayout>
  );
}
