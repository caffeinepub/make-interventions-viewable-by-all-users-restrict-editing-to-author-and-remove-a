import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGetClients } from '../hooks/useClients';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Search, FolderOpen, Loader2, RefreshCw, Download } from 'lucide-react';
import CreateClientDialog from '../components/clients/CreateClientDialog';
import MobileLayout from '../components/layout/MobileLayout';
import AppBadge from '../components/common/AppBadge';
import ExportDataDialog from '../components/export/ExportDataDialog';
import { useQueryClient } from '@tanstack/react-query';

export default function ClientsPage() {
  const { data: clients = [], isLoading, isError, error } = useGetClients();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const filteredClients = clients.filter((client) =>
    client.info.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['clients'] });
  };

  return (
    <MobileLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Clients</h1>
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsExportDialogOpen(true)} 
              size="sm"
              variant="outline"
              title="Exporter les données"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </div>

        <Card
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => navigate({ to: '/technical-folder' })}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FolderOpen className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Dossier Technique</CardTitle>
            </div>
          </CardHeader>
        </Card>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            disabled={isLoading}
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Chargement des clients...</p>
          </div>
        ) : isError ? (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="p-3 rounded-full bg-destructive/10">
                  <RefreshCw className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Impossible de charger les clients
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {error instanceof Error 
                      ? error.message.includes('Non autorisé')
                        ? 'Accès refusé - Veuillez vous reconnecter'
                        : 'Erreur de connexion - Vérifiez votre connexion Internet'
                      : 'Une erreur est survenue lors du chargement des données'}
                  </p>
                  <Button onClick={handleRetry} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Réessayer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? 'Aucun client trouvé' : 'Aucun client'}
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredClients.map((client) => (
              <Card
                key={client.info.name}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() =>
                  navigate({
                    to: '/clients/$clientId',
                    params: { clientId: client.info.name },
                  })
                }
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-tight">
                      {client.info.name}
                    </CardTitle>
                    {client.isBlacklisted && (
                      <AppBadge variant="destructive" className="shrink-0 text-xs">
                        Liste noire
                      </AppBadge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-0.5">
                  <p className="truncate">{client.info.address.street}</p>
                  <p className="truncate">
                    {client.info.address.city}, {client.info.address.state}{' '}
                    {client.info.address.zip}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CreateClientDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      <ExportDataDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
      />
    </MobileLayout>
  );
}
