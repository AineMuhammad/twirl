import { type z } from 'zod';

/**
 * Validates environment variables and fails fast with a readable list of problems.
 * Never prints values, only variable names, so secrets don't leak into logs.
 */
export function parseEnv<T extends z.ZodType>(schema: T, source: Record<string, unknown>, label: string) {
  const result = schema.safeParse(source);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid ${label} environment variables:\n${problems}\nSee .env.example.`);
  }
  return result.data as z.infer<T>;
}
