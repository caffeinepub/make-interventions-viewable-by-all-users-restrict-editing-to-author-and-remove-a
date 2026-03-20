import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  CheckCircle2,
  Clock,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useActor } from "../hooks/useActor";
import { useSaveCallerUserProfile } from "../hooks/useCurrentUser";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useClaimAdminIfNoneExists,
  useHasAdminRegistered,
  useIsCallerApproved,
  useRecoverAdminAccess,
  useRequestApproval,
} from "../hooks/useUserApproval";

export default function PendingApprovalPage() {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { actor, isFetching: actorFetching } = useActor();

  const [name, setName] = useState("");
  const [mode, setMode] = useState<"choose" | "admin" | "request">("choose");

  const {
    mutate: requestApproval,
    isPending: isRequesting,
    isSuccess: hasRequested,
  } = useRequestApproval();

  const { mutate: claimAdmin, isPending: isClaiming } =
    useClaimAdminIfNoneExists();

  const { mutate: saveProfile, isPending: isSavingProfile } =
    useSaveCallerUserProfile();

  const { mutate: recoverAdmin, isPending: isRecovering } =
    useRecoverAdminAccess();

  const {
    data: isApproved,
    refetch: refetchApproval,
    isLoading: checkingApproval,
  } = useIsCallerApproved();

  const {
    data: hasAdminRegistered,
    isLoading: checkingAdmin,
    isError: adminCheckError,
    refetch: refetchAdminCheck,
  } = useHasAdminRegistered();

  const [alreadyRequested, setAlreadyRequested] = useState(false);

  useEffect(() => {
    if (isApproved) {
      queryClient.invalidateQueries({ queryKey: ["isCallerApproved"] });
      navigate({ to: "/" });
    }
  }, [isApproved, navigate, queryClient]);

  useEffect(() => {
    if (hasRequested) setAlreadyRequested(true);
  }, [hasRequested]);

  // If no admin registered yet, go directly to admin claim mode
  useEffect(() => {
    if (!checkingAdmin && !adminCheckError && hasAdminRegistered === false) {
      setMode("admin");
    }
  }, [hasAdminRegistered, checkingAdmin, adminCheckError]);

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    navigate({ to: "/login" });
  };

  const handleClaimAdmin = () => {
    if (!name.trim()) return;
    saveProfile(
      { name: name.trim() },
      {
        onSuccess: () => {
          claimAdmin(undefined, {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ["isCallerAdmin"] });
              queryClient.invalidateQueries({ queryKey: ["isCallerApproved"] });
              queryClient.invalidateQueries({
                queryKey: ["hasAdminRegistered"],
              });
              navigate({ to: "/" });
            },
          });
        },
      },
    );
  };

  const handleRecoverAdmin = () => {
    recoverAdmin(undefined, {
      onSuccess: (isAdmin) => {
        if (isAdmin) {
          queryClient.invalidateQueries({ queryKey: ["isCallerAdmin"] });
          navigate({ to: "/" });
        }
      },
    });
  };

  const handleRequest = () => {
    if (!name.trim()) return;
    saveProfile(
      { name: name.trim() },
      {
        onSuccess: () => {
          requestApproval();
        },
      },
    );
  };

  const isLoadingChecks = actorFetching || !actor || checkingApproval;
  const isSubmitting = isSavingProfile || isClaiming || isRequesting;

  return (
    <div
      data-ocid="pending_approval.page"
      className="flex flex-col items-center justify-center min-h-screen bg-background px-6 py-8"
    >
      <div className="w-full max-w-sm flex flex-col items-center gap-6">
        <img
          src="/assets/generated/vial-traite-logo-transparent.dim_400x200.png"
          alt="Vial Traite Service"
          className="w-48 h-auto"
        />

        <div className="w-full bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          {isLoadingChecks ? (
            <div className="flex flex-col items-center gap-4 py-10 px-6">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Vérification…</p>
            </div>
          ) : checkingAdmin ? (
            <div className="flex flex-col items-center gap-4 py-10 px-6">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Vérification du statut administrateur…
              </p>
            </div>
          ) : adminCheckError ? (
            <ServerErrorState
              name={name}
              setName={setName}
              isSubmitting={isSubmitting}
              isRecovering={isRecovering}
              onClaimAdmin={handleClaimAdmin}
              onRecoverAdmin={handleRecoverAdmin}
              onRetry={refetchAdminCheck}
              onLogout={handleLogout}
            />
          ) : mode === "admin" ? (
            <AdminClaimState
              name={name}
              setName={setName}
              isSubmitting={isSubmitting}
              isRecovering={isRecovering}
              hasAdminRegistered={hasAdminRegistered ?? false}
              onClaimAdmin={handleClaimAdmin}
              onRecoverAdmin={handleRecoverAdmin}
              onSwitchToRequest={() => setMode("request")}
              onLogout={handleLogout}
            />
          ) : mode === "request" ? (
            <RequestAccessState
              name={name}
              setName={setName}
              isSubmitting={isSubmitting}
              alreadyRequested={alreadyRequested}
              checkingApproval={checkingApproval}
              onRequest={handleRequest}
              onRefresh={refetchApproval}
              onSwitchToAdmin={() => setMode("admin")}
              onLogout={handleLogout}
            />
          ) : (
            <ChooseRoleState
              onChooseAdmin={() => setMode("admin")}
              onChooseEmployee={() => setMode("request")}
              onLogout={handleLogout}
            />
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center px-4">
          Contactez votre administrateur si votre demande tarde à être traitée
        </p>
      </div>
    </div>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-5 p-6">{children}</div>;
}

function ChooseRoleState({
  onChooseAdmin,
  onChooseEmployee,
  onLogout,
}: {
  onChooseAdmin: () => void;
  onChooseEmployee: () => void;
  onLogout: () => void;
}) {
  return (
    <Section>
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Bienvenue</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Qui êtes-vous ?
        </p>
      </div>

      <Button
        onClick={onChooseAdmin}
        size="lg"
        className="w-full"
        data-ocid="pending_approval.primary_button"
      >
        <ShieldCheck className="w-4 h-4 mr-2" />
        Je suis l&apos;administrateur
      </Button>

      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-border" />
        <span className="text-xs text-muted-foreground">ou</span>
        <div className="flex-1 border-t border-border" />
      </div>

      <Button
        onClick={onChooseEmployee}
        variant="outline"
        className="w-full"
        data-ocid="pending_approval.secondary_button"
      >
        <CheckCircle2 className="w-4 h-4 mr-2" />
        Je suis un salarié — Demander l&apos;accès
      </Button>

      <Button
        onClick={onLogout}
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        data-ocid="pending_approval.button"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Se déconnecter
      </Button>
    </Section>
  );
}

function AdminClaimState({
  name,
  setName,
  isSubmitting,
  isRecovering,
  hasAdminRegistered,
  onClaimAdmin,
  onRecoverAdmin,
  onSwitchToRequest,
  onLogout,
}: {
  name: string;
  setName: (v: string) => void;
  isSubmitting: boolean;
  isRecovering: boolean;
  hasAdminRegistered: boolean;
  onClaimAdmin: () => void;
  onRecoverAdmin: () => void;
  onSwitchToRequest: () => void;
  onLogout: () => void;
}) {
  return (
    <Section>
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          Accès administrateur
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {hasAdminRegistered
            ? "Entrez votre nom et cliquez sur le bouton pour accéder à votre espace administrateur."
            : "Première connexion : entrez votre nom pour créer le compte administrateur."}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="admin-name">Votre prénom et nom</Label>
        <Input
          id="admin-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Jean Dupont"
          autoFocus
          data-ocid="pending_approval.input"
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim() && !isSubmitting)
              onClaimAdmin();
          }}
        />
      </div>

      <Button
        onClick={onClaimAdmin}
        disabled={isSubmitting || !name.trim()}
        size="lg"
        className="w-full"
        data-ocid="pending_approval.primary_button"
      >
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <ShieldCheck className="w-4 h-4 mr-2" />
        )}
        Je suis l&apos;administrateur
      </Button>

      {hasAdminRegistered && (
        <Button
          onClick={onRecoverAdmin}
          disabled={isRecovering}
          variant="outline"
          className="w-full"
          data-ocid="pending_approval.confirm_button"
        >
          {isRecovering ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Récupérer mon accès administrateur
        </Button>
      )}

      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-border" />
        <span className="text-xs text-muted-foreground">ou</span>
        <div className="flex-1 border-t border-border" />
      </div>

      <Button
        onClick={onSwitchToRequest}
        variant="ghost"
        size="sm"
        className="w-full text-muted-foreground"
        data-ocid="pending_approval.secondary_button"
      >
        Je suis un salarié — Demander l&apos;accès
      </Button>

      <Button
        onClick={onLogout}
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        data-ocid="pending_approval.button"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Se déconnecter
      </Button>
    </Section>
  );
}

function ServerErrorState({
  name,
  setName,
  isSubmitting,
  isRecovering,
  onClaimAdmin,
  onRecoverAdmin,
  onRetry,
  onLogout,
}: {
  name: string;
  setName: (v: string) => void;
  isSubmitting: boolean;
  isRecovering: boolean;
  onClaimAdmin: () => void;
  onRecoverAdmin: () => void;
  onRetry: () => void;
  onLogout: () => void;
}) {
  return (
    <Section>
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          Serveur en démarrage
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Le serveur démarre. Réessayez ou définissez-vous comme administrateur.
        </p>
      </div>

      <Button
        onClick={onRetry}
        variant="outline"
        className="w-full"
        data-ocid="pending_approval.secondary_button"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Réessayer
      </Button>

      <Button
        onClick={onRecoverAdmin}
        disabled={isRecovering}
        variant="outline"
        className="w-full"
        data-ocid="pending_approval.confirm_button"
      >
        {isRecovering ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <RefreshCw className="w-4 h-4 mr-2" />
        )}
        Récupérer mon accès administrateur
      </Button>

      <div className="border-t border-border pt-2 flex flex-col gap-3">
        <Label htmlFor="admin-name-err">Votre prénom et nom</Label>
        <Input
          id="admin-name-err"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Jean Dupont"
          data-ocid="pending_approval.input"
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim() && !isSubmitting)
              onClaimAdmin();
          }}
        />
        <Button
          onClick={onClaimAdmin}
          disabled={isSubmitting || !name.trim()}
          className="w-full"
          data-ocid="pending_approval.primary_button"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <ShieldCheck className="w-4 h-4 mr-2" />
          )}
          Je suis l&apos;administrateur
        </Button>
      </div>

      <Button
        onClick={onLogout}
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        data-ocid="pending_approval.button"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Se déconnecter
      </Button>
    </Section>
  );
}

function RequestAccessState({
  name,
  setName,
  isSubmitting,
  alreadyRequested,
  checkingApproval,
  onRequest,
  onRefresh,
  onSwitchToAdmin,
  onLogout,
}: {
  name: string;
  setName: (v: string) => void;
  isSubmitting: boolean;
  alreadyRequested: boolean;
  checkingApproval: boolean;
  onRequest: () => void;
  onRefresh: () => void;
  onSwitchToAdmin: () => void;
  onLogout: () => void;
}) {
  return (
    <Section>
      <div className="flex flex-col items-center gap-3 text-center">
        {alreadyRequested ? (
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
            <Clock className="w-7 h-7 text-amber-500" />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-primary" />
          </div>
        )}
        <h2 className="text-lg font-semibold text-foreground">
          {alreadyRequested ? "Demande envoyée" : "Accès salarié"}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {alreadyRequested
            ? "Votre demande est en attente d'approbation par l'administrateur."
            : "Entrez votre nom et soumettez une demande d'accès."}
        </p>
      </div>

      {!alreadyRequested ? (
        <>
          <div className="flex flex-col gap-2">
            <Label htmlFor="user-name">Votre prénom et nom</Label>
            <Input
              id="user-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Jean Dupont"
              autoFocus
              data-ocid="pending_approval.input"
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim() && !isSubmitting)
                  onRequest();
              }}
            />
          </div>
          <Button
            onClick={onRequest}
            disabled={isSubmitting || !name.trim()}
            size="lg"
            className="w-full"
            data-ocid="pending_approval.primary_button"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Demander l&apos;accès
          </Button>
        </>
      ) : (
        <Button
          onClick={onRefresh}
          disabled={checkingApproval}
          variant="outline"
          size="lg"
          className="w-full"
          data-ocid="pending_approval.secondary_button"
        >
          {checkingApproval ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Vérifier l&apos;approbation
        </Button>
      )}

      <button
        type="button"
        onClick={onSwitchToAdmin}
        className="text-xs text-muted-foreground hover:text-primary transition-colors text-center"
      >
        Vous êtes l&apos;administrateur ? Cliquez ici
      </button>

      <Button
        onClick={onLogout}
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        data-ocid="pending_approval.button"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Se déconnecter
      </Button>
    </Section>
  );
}
