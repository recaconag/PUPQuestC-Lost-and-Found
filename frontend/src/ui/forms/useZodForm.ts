import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type FieldValues, type UseFormProps } from "react-hook-form";
import type { ZodTypeAny } from "zod";

export function useZodForm<TSchema extends ZodTypeAny, TValues extends FieldValues = any>(
  schema: TSchema,
  options?: Omit<UseFormProps<TValues>, "resolver">
) {
  return useForm<TValues>({
    mode: "onBlur",
    ...options,
    resolver: zodResolver(schema) as any,
  });
}

