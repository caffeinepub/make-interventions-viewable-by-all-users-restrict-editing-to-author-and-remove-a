import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Principal } from "@icp-sdk/core/principal";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
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

interface UserRowProps {
  entry: ApprovalEntry;
  index: number;
  onApprove?: () => void;
  onReject?: () => void;
  onRevoke?: () => void;
  isPending: boolean;
}

function UserRow({
  entry,
  index,
  onApprove,
  onReject,
  onRevoke,
  isPending,
}: UserRowProps) {
  const ocidBase = `admin_access.item.${index}`;

  return (
    <div
      data-ocid={ocidBase}
      className="flex flex-col gap-3 bg-card border border-border rounded-xl p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-mono text-muted-foreground truncate">
            {truncatePrincipal(entry.principal)}
          </span>
        </div>
        {entry.status === "approved" && (
          <Badge
            variant="secondary"
            className="bg-success/15 text-success-foreground border-success/30 shrink-0 text-xs"
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Approuvé
          </Badge>
        )}
        {entry.status === "pending" && (
          <Badge
            variant="secondary"
            className="bg-accent/15 text-accent-foreground border-accent/30 shrink-0 text-xs"
          >
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </Badge>
        )}
        {entry.status === "rejected" && (
          <Badge
            variant="secondary"
            className="bg-destructive/15 text-destructive border-destructive/30 shrink-0 text-xs"
          >
            <XCircle className="w-3 h-3 mr-1" />
            Rejeté
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
              className="flex-1 min-w-0 bg-success hover:bg-success/90 text-success-foreground"
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
              data-ocid={`admin_access.reject_button.${index}`}
            >
              {isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <XCircle className="w-3 h-3 mr-1" />
              )}
              Rejeter
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
            data-ocid={`admin_access.revoke_button.${index}`}
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

  const pending = approvals?.filter((a) => a.status === "pending") ?? [];
  const approved = approvals?.filter((a) => a.status === "approved") ?? [];
  const rejected = approvals?.filter((a) => a.status === "rejected") ?? [];

  // Flat list with original index for deterministic data-ocid
  const allEntriesIndexed =
    approvals?.map((entry, i) => ({ entry, displayIndex: i + 1 })) ?? [];

  const handleApprove = (principal: Principal) => {
    setApproval({ user: principal, status: "approved" });
  };

  const handleReject = (principal: Principal) => {
    setApproval({ user: principal, status: "rejected" });
  };

  const handleRevoke = (principal: Principal) => {
    setApproval({ user: principal, status: "pending" });
  };

  return (
    <div
      data-ocid="admin_access.page"
      className="flex flex-col gap-6 px-4 py-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold text-foreground">Gestion des accès</h1>
      </div>

      {/* Back button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate({ to: "/dashboard" })}
        className="self-start"
        data-ocid="admin_access.secondary_button"
      >
        ← Retour au tableau de bord
      </Button>

      {/* Loading */}
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

      {/* Error */}
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

      {/* Content */}
      {!isLoading && !error && approvals !== undefined && (
        <>
          {/* Empty state */}
          {approvals.length === 0 && (
            <div
              className="flex flex-col items-center gap-3 py-12"
              data-ocid="admin_access.empty_state"
            >
              <Users className="w-10 h-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                Aucun utilisateur en attente d'accès
              </p>
            </div>
          )}

          {/* Pending section */}
          {pending.length > 0 && (
            <section className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent" />
                <h2 className="font-semibold text-foreground">
                  En attente ({pending.length})
                </h2>
              </div>
              <div className="flex flex-col gap-2">
                {pending.map((entry) => {
                  const indexed = allEntriesIndexed.find(
                    (a) => a.entry === entry,
                  );
                  return (
                    <UserRow
                      key={entry.principal.toString()}
                      entry={entry}
                      index={indexed?.displayIndex ?? 1}
                      onApprove={() => handleApprove(entry.principal)}
                      onReject={() => handleReject(entry.principal)}
                      isPending={isSettingApproval}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* Approved section */}
          {approved.length > 0 && (
            <section className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <h2 className="font-semibold text-foreground">
                  Approuvés ({approved.length})
                </h2>
              </div>
              <div className="flex flex-col gap-2">
                {approved.map((entry) => {
                  const indexed = allEntriesIndexed.find(
                    (a) => a.entry === entry,
                  );
                  return (
                    <UserRow
                      key={entry.principal.toString()}
                      entry={entry}
                      index={indexed?.displayIndex ?? 1}
                      onRevoke={() => handleRevoke(entry.principal)}
                      isPending={isSettingApproval}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* Rejected section */}
          {rejected.length > 0 && (
            <section className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-destructive" />
                <h2 className="font-semibold text-foreground">
                  Refusés ({rejected.length})
                </h2>
              </div>
              <div className="flex flex-col gap-2">
                {rejected.map((entry) => {
                  const indexed = allEntriesIndexed.find(
                    (a) => a.entry === entry,
                  );
                  return (
                    <UserRow
                      key={entry.principal.toString()}
                      entry={entry}
                      index={indexed?.displayIndex ?? 1}
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
