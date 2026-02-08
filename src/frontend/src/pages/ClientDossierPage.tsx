import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetClient } from '../hooks/useClients';
import { useGetClientInterventions } from '../hooks/useInterventions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit, AlertCircle } from 'lucide-react';
import InterventionList from '../components/interventions/InterventionList';
import AddInterventionDialog from '../components/interventions/AddInterventionDialog';
import EditClientDialog from '../components/clients/EditClientDialog';
import BlacklistPanel from '../components/blacklist/BlacklistPanel';
import AuthenticatedOnly from '../components/guards/AuthenticatedOnly';
import { Skeleton } from '@/components/ui/skeleton';

function ClientDossierPageContent() {
  const { clientId } = useParams({ from: '/clients/$clientId' });
  const navigate = useNavigate();
  const [showAddIntervention, setShowAddIntervention] = useState(false);
  const [showEditClient, setShowEditClient] = useState(false);

  const { data: client, isLoading: loadingClient } = useGetClient(clientId);
  const { data: interventions, isLoading: loadingInterventions } = useGetClientInterventions(clientId);

  if (loadingClient) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!client) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Client not found</p>
          <Button onClick={() => navigate({ to: '/clients' })} className="mt-4">
            Back to Clients
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-20">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/clients' })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold flex-1 truncate">{client.info.name}</h1>
        <Button variant="outline" size="icon" onClick={() => setShowEditClient(true)}>
          <Edit className="h-4 w-4" />
        </Button>
      </div>

      {client.isBlacklisted && (
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">Blacklisted Client</CardTitle>
            </div>
          </CardHeader>
        </Card>
      )}

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="interventions">Interventions</TabsTrigger>
          <TabsTrigger value="blacklist">Blacklist</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <p>
                  {client.info.address.street}
                  <br />
                  {client.info.address.zip} {client.info.address.city}
                  <br />
                  {client.info.address.state}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p>{client.info.phone}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p>{client.info.email}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interventions" className="space-y-4">
          <Button onClick={() => setShowAddIntervention(true)} className="w-full">
            Add Intervention
          </Button>
          <InterventionList clientId={clientId} interventions={interventions} isLoading={loadingInterventions} />
        </TabsContent>

        <TabsContent value="blacklist">
          <BlacklistPanel client={client} clientId={clientId} />
        </TabsContent>
      </Tabs>

      <AddInterventionDialog
        clientId={clientId}
        open={showAddIntervention}
        onOpenChange={setShowAddIntervention}
      />
      <EditClientDialog client={client} clientId={clientId} open={showEditClient} onOpenChange={setShowEditClient} />
    </div>
  );
}

export default function ClientDossierPage() {
  return (
    <AuthenticatedOnly>
      <ClientDossierPageContent />
    </AuthenticatedOnly>
  );
}
