import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Search,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import type { Client } from "../backend";
import CreateClientDialog from "../components/clients/CreateClientDialog";
import { useGetClients, useSearchClients } from "../hooks/useClients";

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const {
    data: allClients,
    isLoading: allLoading,
    error: allError,
    refetch: refetchAll,
  } = useGetClients();

  const { data: searchResults, isLoading: searchLoading } =
    useSearchClients(searchQuery);

  const isSearching = searchQuery.trim().length > 0;
  const clients = isSearching ? searchResults : allClients;
  const isLoading = isSearching ? searchLoading : allLoading;
  const error = allError;

  const handleClientClick = (client: Client, index: number) => {
    navigate({
      to: `/clients/${encodeURIComponent(`${client.info.name}-${index}`)}`,
    });
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">
            Erreur de chargement
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {(error as Error).message}
          </p>
        </div>
        <Button
          onClick={() => refetchAll()}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="sticky top-0 bg-background z-10 px-4 py-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un client..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Client list */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !clients || clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 px-6">
            <p className="text-muted-foreground text-center">
              {isSearching
                ? "Aucun client trouvé pour cette recherche"
                : "Aucun client enregistré"}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {clients.map((client, index) => (
              <li key={client.info.name}>
                <button
                  type="button"
                  onClick={() => handleClientClick(client, index)}
                  className="w-full flex items-center justify-between px-4 py-4 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground truncate">
                        {client.info.name}
                      </span>
                      {client.isBlacklisted && (
                        <Badge
                          variant="destructive"
                          className="shrink-0 text-xs"
                        >
                          Liste noire
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground truncate">
                      {client.info.address.city}
                      {client.info.phone && ` • ${client.info.phone}`}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* FAB */}
      <div className="fixed bottom-20 right-4 z-30">
        <CreateClientDialog
          trigger={
            <Button size="icon" className="w-14 h-14 rounded-full shadow-lg">
              <UserPlus className="w-6 h-6" />
            </Button>
          }
        />
      </div>
    </div>
  );
}
