import React, { Component, ErrorInfo, ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Wrapper component to use hooks inside class component
function ErrorContent({ error, resetError }: { error: Error | null; resetError: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center min-h-[50vh] p-6">
      <div className="w-full max-w-md">
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>{t("errorBoundary.title")}</AlertTitle>
          <AlertDescription>
            {t("errorBoundary.description")}
            {error && (
              <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono overflow-auto">
                {error.message}
              </div>
            )}
          </AlertDescription>
        </Alert>
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => window.location.href = "/"}>
            {t("errorBoundary.goHome")}
          </Button>
          <Button onClick={resetError}>
            {t("errorBoundary.tryAgain")}
          </Button>
        </div>
      </div>
    </div>
  );
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return <ErrorContent error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;