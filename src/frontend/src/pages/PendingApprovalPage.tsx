import { Button } from "@/components/ui/button";
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

  const {
    mutate: requestApproval,
    isPending: isRequesting,
    isSuccess: hasRequested,
  } = useRequestApproval();

  const { mutate: claimAdmin, isPending: isClaiming } =
    useClaimAdminIfNoneExists();

  const {
    data: isApproved,
    refetch: refetchApproval,
    isLoading: checkingApproval,
  } = useIsCallerApproved();

  const { data: hasAdminRegistered, isLoading: checkingAdmin } =
    useHasAdminRegistered();

  const [alreadyRequested, setAlreadyRequested] = useState(false);

  // If approved, redirect to main app
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

  const handleRequest = () => {
    requestApproval();
  };

  const handleRefresh = () => {
    refetchApproval();
  };

  const handleClaimAdmin = () => {
    claimAdmin(undefined, {
      onSuccess: () => {
        navigate({ to: "/" });
      },
    });
  };

  // While loading admin status, show a spinner
  const isLoadingChecks = checkingApproval || checkingAdmin;
  const noAdminYet = hasAdminRegistered === false;

  return (
    <div
      data-ocid="pending_approval.page"
      className="flex flex-col items-center justify-center min-h-screen bg-background px-6"
    >
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <img
            src="/assets/generated/vial-traite-logo.dim_400x200.png"
            alt="Vial Traite Service"
            className="w-48 h-auto"
          />
        </div>

        {/* Card */}
        <div className="w-full bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-5">
          {isLoadingChecks ? (
            /* Loading state */
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
                  Aucun administrateur enregistré
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Aucun administrateur n'est encore enregistré. Cliquez pour
                  vous définir comme administrateur.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleClaimAdmin}
                  disabled={isClaiming}
                  className="w-full"
                  size="lg"
                  data-ocid="pending_approval.primary_button"
                >
                  {isClaiming ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Activation…
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Je suis l'administrateur
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
              {/* Status icon */}
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

              {/* Message */}
              <div className="text-center flex flex-col gap-2">
                <h2 className="text-lg font-semibold text-foreground">
                  {alreadyRequested ? "Demande envoyée" : "Accès requis"}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {alreadyRequested
                    ? "Votre demande d'accès est en attente d'approbation par l'administrateur."
                    : "Vous devez demander l'accès à l'application. Un administrateur examinera votre demande."}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-3">
                {!alreadyRequested ? (
                  <Button
                    onClick={handleRequest}
                    disabled={isRequesting}
                    className="w-full"
                    size="lg"
                    data-ocid="pending_approval.primary_button"
                  >
                    {isRequesting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      "Demander l'accès"
                    )}
                  </Button>
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
