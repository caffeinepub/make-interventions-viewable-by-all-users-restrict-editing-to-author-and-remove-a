import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Principal } from "@icp-sdk/core/principal";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  ShieldCheck,
  User,
  Users,
  XCircle,
} from "lucide-react";
import { useActor } from "../hooks/useActor";
import {
  type ApprovalEntry,
  useListApprovals,
  useSetApproval,
} from "../hooks/useUserApproval";

function truncatePrincipal(principal: Principal): string {
  const str = principal.toString();
  if (str.length <= 16) return str;
  return `${str.slice(0, 8)}...${str.slice(-6)}`;
}

function useProfileNames(principals: Principal[]) {
  const { actor, isFetching } = useActor();
  const key = principals.map((p) => p.toString()).join(",");

  return useQuery<Map<string, string>>({
    queryKey: ["profileNames", key],
    queryFn: async () => {
      const map = new Map<string, string>();
      if (!actor || principals.length === 0) return map;
      try {
        const results = await (actor as any).getUserProfilesByPrincipals(
          principals,
        );
        for (const [p, profile] of results as Array<
          [Principal, { name: string }]
        >) {
          map.set(p.toString(), profile.name);
        }
      } catch (err) {
        console.warn("getUserProfilesByPrincipals failed:", err);
      }
      return map;
    },
    enabled: !!actor && !isFetching && principals.length > 0,
    staleTime: 1000 * 60,
  });
}

interface UserRowProps {
  entry: ApprovalEntry;
  index: number;
  displayName: string;
  onApprove?: () => void;
  onReject?: () => void;
  onRevoke?: () => void;
  isPending: boolean;
}

function UserRow({
  entry,
  index,
  displayName,
  onApprove,
  onReject,
  onRevoke,
  isPending,
}: UserRowProps) {
  return (
    <div
      data-ocid={`admin_access.item.${index}`}
      className="flex flex-col gap-3 bg-card border border-border rounded-xl p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {displayName}
            </p>
            <p className="text-xs font-mono text-muted-foreground truncate">
              {truncatePrincipal(entry.principal)}
            </p>
          </div>
        </div>
        {entry.status === "approved" && (
          <Badge
            variant="secondary"
            className="shrink-0 text-xs bg-[#99CC33]/15 text-[#99CC33] border-[#99CC33]/30"
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Approuvé
          </Badge>
        )}
        {entry.status === "pending" && (
          <Badge
            variant="secondary"
            className="shrink-0 text-xs bg-[#FF9933]/15 text-[#FF9933] border-[#FF9933]/30"
          >
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </Badge>
        )}
        {entry.status === "rejected" && (
          <Badge
            variant="secondary"
            className="shrink-0 text-xs bg-destructive/15 text-destructive border-destructive/30"
          >
            <XCircle className="w-3 h-3 mr-1" />
            Supprimé
          </Badge>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {entry.status === "pending" && (
          <>
            <Button
              size="sm"
              onClick={onApprove}
              disabled={isPending}
              className="flex-1 min-w-0 bg-[#99CC33] hover:bg-[#99CC33]/90 text-white"
              data-ocid={`admin_access.approve_button.${index}`}
            >
              {isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3 h-3 mr-1" />
              )}
              Approuver
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={onReject}
              disabled={isPending}
              className="flex-1 min-w-0"
              data-ocid={`admin_access.delete_button.${index}`}
            >
              {isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <XCircle className="w-3 h-3 mr-1" />
              )}
              Supprimer
            </Button>
          </>
        )}
        {entry.status === "approved" && (
          <Button
            size="sm"
            variant="destructive"
            onClick={onRevoke}
            disabled={isPending}
            className="flex-1 min-w-0"
            data-ocid={`admin_access.delete_button.${index}`}
          >
            {isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <XCircle className="w-3 h-3 mr-1" />
            )}
            Révoquer l'accès
          </Button>
        )}
        {entry.status === "rejected" && (
          <Button
            size="sm"
            variant="outline"
            onClick={onApprove}
            disabled={isPending}
            className="flex-1 min-w-0"
            data-ocid={`admin_access.approve_button.${index}`}
          >
            {isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3 h-3 mr-1" />
            )}
            Approuver quand même
          </Button>
        )}
      </div>
    </div>
  );
}

export default function AdminAccessPage() {
  const navigate = useNavigate();
  const { data: approvals, isLoading, error, refetch } = useListApprovals();
  const { mutate: setApproval, isPending: isSettingApproval } =
    useSetApproval();

  const principals = approvals?.map((a) => a.principal) ?? [];
  const { data: profileNames } = useProfileNames(principals);

  const pending = approvals?.filter((a) => a.status === "pending") ?? [];
  const approved = approvals?.filter((a) => a.status === "approved") ?? [];
  const rejected = approvals?.filter((a) => a.status === "rejected") ?? [];

  const allEntriesIndexed =
    approvals?.map((entry, i) => ({ entry, displayIndex: i + 1 })) ?? [];

  const getDisplayName = (principal: Principal) =>
    profileNames?.get(principal.toString()) || truncatePrincipal(principal);

  const handleApprove = (principal: Principal) =>
    setApproval({ user: principal, status: "approved" });
  const handleReject = (principal: Principal) =>
    setApproval({ user: principal, status: "rejected" });
  const handleRevoke = (principal: Principal) =>
    setApproval({ user: principal, status: "pending" });

  return (
    <div
      data-ocid="admin_access.page"
      className="flex flex-col gap-6 px-4 py-4"
    >
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold text-foreground">Gestion des accès</h1>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate({ to: "/dashboard" })}
        className="self-start"
        data-ocid="admin_access.secondary_button"
      >
        ← Retour au tableau de bord
      </Button>

      {isLoading && (
        <div
          className="flex items-center justify-center py-12"
          data-ocid="admin_access.loading_state"
        >
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Chargement des accès...
            </p>
          </div>
        </div>
      )}

      {error && (
        <div
          className="flex flex-col items-center gap-3 py-6"
          data-ocid="admin_access.error_state"
        >
          <AlertTriangle className="w-8 h-8 text-destructive" />
          <p className="text-sm text-muted-foreground text-center">
            {(error as Error).message}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </Button>
        </div>
      )}

      {!isLoading && !error && approvals !== undefined && (
        <>
          {approvals.length === 0 && (
            <div
              className="flex flex-col items-center gap-3 py-12"
              data-ocid="admin_access.empty_state"
            >
              <Users className="w-10 h-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                Aucune demande d'accès pour le moment
              </p>
            </div>
          )}

          {pending.length > 0 && (
            <section className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" style={{ color: "#FF9933" }} />
                <h2 className="font-semibold text-foreground">
                  En attente ({pending.length})
                </h2>
              </div>
              <div className="flex flex-col gap-2">
                {pending.map((entry) => {
                  const idx =
                    allEntriesIndexed.find((a) => a.entry === entry)
                      ?.displayIndex ?? 1;
                  return (
                    <UserRow
                      key={entry.principal.toString()}
                      entry={entry}
                      index={idx}
                      displayName={getDisplayName(entry.principal)}
                      onApprove={() => handleApprove(entry.principal)}
                      onReject={() => handleReject(entry.principal)}
                      isPending={isSettingApproval}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {approved.length > 0 && (
            <section className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className="w-4 h-4"
                  style={{ color: "#99CC33" }}
                />
                <h2 className="font-semibold text-foreground">
                  Approuvés ({approved.length})
                </h2>
              </div>
              <div className="flex flex-col gap-2">
                {approved.map((entry) => {
                  const idx =
                    allEntriesIndexed.find((a) => a.entry === entry)
                      ?.displayIndex ?? 1;
                  return (
                    <UserRow
                      key={entry.principal.toString()}
                      entry={entry}
                      index={idx}
                      displayName={getDisplayName(entry.principal)}
                      onRevoke={() => handleRevoke(entry.principal)}
                      isPending={isSettingApproval}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {rejected.length > 0 && (
            <section className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-destructive" />
                <h2 className="font-semibold text-foreground">
                  Supprimés ({rejected.length})
                </h2>
              </div>
              <div className="flex flex-col gap-2">
                {rejected.map((entry) => {
                  const idx =
                    allEntriesIndexed.find((a) => a.entry === entry)
                      ?.displayIndex ?? 1;
                  return (
                    <UserRow
                      key={entry.principal.toString()}
                      entry={entry}
                      index={idx}
                      displayName={getDisplayName(entry.principal)}
                      onApprove={() => handleApprove(entry.principal)}
                      isPending={isSettingApproval}
                    />
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
