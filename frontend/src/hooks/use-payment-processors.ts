import { useQuery } from "@tanstack/react-query";
import { fetchPaymentProcessors } from "@/services/payment-processors.api";
import type { IPaymentProcessor } from "@shared/interfaces/payment-processors.interface";
import { EPaymentProcessorType } from "@shared/enums";

/** Options for select/radio (value, label) */
export type TPaymentProcessorOption = { value: string; label: string };

export function usePaymentProcessors(params?: { limit?: number; page?: number }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["payment-processors", params?.limit ?? 50, params?.page ?? 1],
    queryFn: () => fetchPaymentProcessors({ limit: params?.limit ?? 50, page: params?.page ?? 1 }),
  });

  const processors: IPaymentProcessor[] = (data?.data ?? []).filter(
    (p) =>
      p.enabled
  );

  const options: TPaymentProcessorOption[] = processors.map((p) => ({
    value: p.id,
    label: p.type.charAt(0).toUpperCase() + p.type.slice(1),
  }));

  return { processors, options, isLoading, error };
}
