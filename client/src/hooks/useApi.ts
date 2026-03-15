import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

/**
 * useApi Hook - Centralized API error handling and notification
 */
export const useApi = () => {
  const { toast } = useToast();

  const handleError = useCallback(
    (error: any) => {
      const message = error?.message || "An error occurred";
      const code = error?.code || "ERROR";

      console.error(`[${code}] ${message}`, error?.details);

      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
    [toast]
  );

  const handleSuccess = useCallback(
    (message: string) => {
      toast({
        title: "Success",
        description: message,
      });
    },
    [toast]
  );

  return { handleError, handleSuccess };
};
