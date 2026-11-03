import { zodResolver } from '@hookform/resolvers/zod'

import {
  useForm,
  type FieldValues,
  type UseFormProps,
  type UseFormReturn,
} from 'react-hook-form'
import type { z } from 'zod'

/**
 * useForm + zodResolver with the correct generics for transformed schemas.
 * Schemas that coerce or transform values (e.g. z.coerce.number()) have
 * different input and output types; this keeps call sites to a single
 * schema argument while handleSubmit still delivers the output type.
 */
export function useZodForm<Output, Input extends FieldValues>(
  schema: z.ZodType<Output, Input>,
  props?: Omit<UseFormProps<Input, unknown, Output>, 'resolver'>,
): UseFormReturn<Input, unknown, Output> {
  return useForm<Input, unknown, Output>({
    ...props,
    resolver: zodResolver(schema),
  })
}
