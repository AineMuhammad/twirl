import { parseEnv } from './parse';
import { clientSchema } from './schema';

export const clientEnv = parseEnv(
  clientSchema,
  { NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL },
  'client',
);
