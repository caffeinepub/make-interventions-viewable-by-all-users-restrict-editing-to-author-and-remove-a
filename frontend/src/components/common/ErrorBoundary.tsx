import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Copy, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log initialization errors with extra context
    console.error('[ErrorBoundary] Erreur capturée:', error.message);
    console.error('[ErrorBoundary] Stack:', error.stack);
    console.error('[ErrorBoundary] Composant:', errorInfo.componentStack);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      copied: false,
    });
  };

  private handleToggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  private handleCopyError = async () => {
    const { error, errorInfo } = this.state;
    const text = [
      `Erreur: ${error?.message ?? 'Inconnue'}`,
      '',
      `Stack: ${error?.stack ?? 'Non disponible'}`,
      '',
      `Composant: ${errorInfo?.componentStack ?? 'Non disponible'}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    }
  };

  public render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, showDetails, copied } = this.state;

      // Check if this is an initialization/auth error
      const isAuthError =
        error?.message?.includes('AuthClient') ||
        error?.message?.includes('identity') ||
        error?.message?.includes('initialization') ||
        error?.message?.includes('InternetIdentity');

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-lg border-destructive">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-3">
                <div className="p-3 rounded-full bg-destructive/10">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-xl font-bold">
                {isAuthError ? "Erreur d'initialisation" : "Une erreur s'est produite"}
              </CardTitle>
              <CardDescription className="text-sm">
                {isAuthError
                  ? "L'application n'a pas pu s'initialiser correctement. Veuillez recharger la page."
                  : "L'application a rencontré un problème inattendu. Veuillez réessayer ou recharger la page."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {error && (
                <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-md text-sm font-mono text-destructive break-words">
                  {error.message}
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={this.handleRetry} variant="outline" className="flex-1" size="sm">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Réessayer
                </Button>
                <Button onClick={this.handleReload} className="flex-1" size="sm">
                  Recharger la page
                </Button>
              </div>

              <Button
                onClick={this.handleToggleDetails}
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground text-xs flex items-center gap-1"
              >
                {showDetails ? (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    Masquer les détails
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    Afficher les détails techniques
                  </>
                )}
              </Button>

              {showDetails && (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-end">
                    <Button
                      onClick={this.handleCopyError}
                      variant="outline"
                      size="sm"
                      className="text-xs flex items-center gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      {copied ? "Copié !" : "Copier l'erreur"}
                    </Button>
                  </div>

                  {error?.stack && (
                    <div className="flex flex-col gap-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Stack trace
                      </p>
                      <div className="p-3 bg-muted rounded-md text-xs font-mono text-muted-foreground overflow-auto max-h-48 whitespace-pre-wrap break-all">
                        {error.stack}
                      </div>
                    </div>
                  )}

                  {errorInfo?.componentStack && (
                    <div className="flex flex-col gap-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Composants
                      </p>
                      <div className="p-3 bg-muted rounded-md text-xs font-mono text-muted-foreground overflow-auto max-h-48 whitespace-pre-wrap break-all">
                        {errorInfo.componentStack}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
