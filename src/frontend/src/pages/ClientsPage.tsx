import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Plus, Search, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppBadge from '@/components/common/AppBadge';
import CreateClientDialog from '@/components/clients/CreateClientDialog';
import { useGetClients } from '@/hooks/useClients';

export default function ClientsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: clients = [], isLoading, error, refetch } = useGetClients();

  const filteredClients = clients.filter((client) =>
    client.info.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            Erreur de chargement des clients
          </h2>
          <p className="text-sm text-muted-foreground max-w-md">
            {error instanceof Error ? error.message : 'Une erreur est survenue'}
          </p>
          <p className="text-xs text-muted-foreground">
            Vérifiez la console pour plus de détails (Référence: ClientsPage)
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Clients</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Client
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher un client..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery
              ? 'Aucun client trouvé pour cette recherche'
              : 'Aucun client enregistré'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <Card
              key={client.info.name}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => {
                navigate({
                  to: '/clients/$clientId',
                  params: { clientId: client.info.name },
                });
              }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{client.info.name}</CardTitle>
                  {client.isBlacklisted && (
                    <AppBadge variant="destructive">Liste noire</AppBadge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>{client.info.address.street}</p>
                  <p>
                    {client.info.address.city}, {client.info.address.state}{' '}
                    {client.info.address.zip}
                  </p>
                  {client.info.phone && <p>📞 {client.info.phone}</p>}
                  {client.info.email && <p>✉️ {client.info.email}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateClientDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
