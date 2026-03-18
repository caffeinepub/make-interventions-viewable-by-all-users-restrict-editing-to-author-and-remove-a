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
  useRequestApproval,
} from "../hooks/useUserApproval";

export default function PendingApprovalPage() {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { actor, isFetching: actorFetching } = useActor();

  const [name, setName] = useState("");

  const {
    mutate: requestApproval,
    isPending: isRequesting,
    isSuccess: hasRequested,
  } = useRequestApproval();

  const { mutate: claimAdmin, isPending: isClaiming } =
    useClaimAdminIfNoneExists();

  const { mutate: saveProfile, isPending: isSavingProfile } =
    useSaveCallerUserProfile();

  const {
    data: isApproved,
    refetch: refetchApproval,
    isLoading: checkingApproval,
  } = useIsCallerApproved();

  const { data: hasAdminRegistered, isLoading: checkingAdmin } =
    useHasAdminRegistered();

  const [alreadyRequested, setAlreadyRequested] = useState(false);

  useEffect(() => {
    if (isApproved) {
      queryClient.invalidateQueries({ queryKey: ["isCallerApproved"] });
      navigate({ to: "/" });
    }
  }, [isApproved, navigate, queryClient]);

  useEffect(() => {
    if (hasRequested) {
      setAlreadyRequested(true);
    }
  }, [hasRequested]);

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
              navigate({ to: "/" });
            },
          });
        },
      },
    );
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

  const handleRefresh = () => {
    refetchApproval();
  };

  const isLoadingChecks =
    actorFetching || !actor || checkingApproval || checkingAdmin;
  const noAdminYet = hasAdminRegistered === false;
  const isSubmitting = isSavingProfile || isClaiming || isRequesting;

  return (
    <div
      data-ocid="pending_approval.page"
      className="flex flex-col items-center justify-center min-h-screen bg-background px-6"
    >
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <img
            src="/assets/generated/vial-traite-logo-transparent.dim_400x200.png"
            alt="Vial Traite Service"
            className="w-52 h-auto"
          />
        </div>

        {/* Card */}
        <div className="w-full bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-5">
          {isLoadingChecks ? (
            <div
              data-ocid="pending_approval.loading_state"
              className="flex flex-col items-center gap-4 py-4"
            >
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Vérification en cours…
              </p>
            </div>
          ) : noAdminYet ? (
            /* No admin registered yet — show "claim admin" flow */
            <>
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
              </div>

              <div className="text-center flex flex-col gap-2">
                <h2 className="text-lg font-semibold text-foreground">
                  Première connexion
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Entrez votre nom puis définissez-vous comme administrateur
                  pour accéder à l'application.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="admin-name">Votre prénom et nom</Label>
                  <Input
                    id="admin-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Jean Dupont"
                    data-ocid="pending_approval.input"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && name.trim() && !isSubmitting)
                        handleClaimAdmin();
                    }}
                  />
                </div>

                <Button
                  onClick={handleClaimAdmin}
                  disabled={isSubmitting || !name.trim()}
                  className="w-full"
                  size="lg"
                  data-ocid="pending_approval.primary_button"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Activation…
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Je suis l&apos;administrateur
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="w-full text-muted-foreground hover:text-destructive"
                  size="sm"
                  data-ocid="pending_approval.button"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Se déconnecter
                </Button>
              </div>
            </>
          ) : (
            /* Admin already registered — normal "request access" flow */
            <>
              <div className="flex justify-center">
                {alreadyRequested ? (
                  <div className="w-16 h-16 rounded-full bg-accent/15 flex items-center justify-center">
                    <Clock className="w-8 h-8 text-accent" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-primary" />
                  </div>
                )}
              </div>

              <div className="text-center flex flex-col gap-2">
                <h2 className="text-lg font-semibold text-foreground">
                  {alreadyRequested ? "Demande envoyée" : "Accès requis"}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {alreadyRequested
                    ? "Votre demande d'accès est en attente d'approbation par l'administrateur."
                    : "Entrez votre nom et demandez l'accès à l'administrateur."}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {!alreadyRequested ? (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="user-name">Votre prénom et nom</Label>
                      <Input
                        id="user-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Jean Dupont"
                        data-ocid="pending_approval.input"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && name.trim() && !isSubmitting)
                            handleRequest();
                        }}
                      />
                    </div>

                    <Button
                      onClick={handleRequest}
                      disabled={isSubmitting || !name.trim()}
                      className="w-full"
                      size="lg"
                      data-ocid="pending_approval.primary_button"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Envoi en cours...
                        </>
                      ) : (
                        "Demander l'accès"
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleRefresh}
                    disabled={checkingApproval}
                    variant="outline"
                    className="w-full"
                    size="lg"
                    data-ocid="pending_approval.secondary_button"
                  >
                    {checkingApproval ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Vérification...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Vérifier l&apos;approbation
                      </>
                    )}
                  </Button>
                )}

                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="w-full text-muted-foreground hover:text-destructive"
                  size="sm"
                  data-ocid="pending_approval.button"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Se déconnecter
                </Button>
              </div>
            </>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Contactez votre administrateur si votre demande tarde à être traitée
        </p>
      </div>
    </div>
  );
}
