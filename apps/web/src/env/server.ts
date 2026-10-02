import 'server-only';

import { parseEnv } from './parse';
import { serverSchema } from './schema';

export const serverEnv = parseEnv(serverSchema, process.env, 'server');
