import { z } from 'zod';
import { normalizeEmail } from './policy';
export const waitlistSchema=z.object({
  email:z.string().trim().email().max(254).transform(normalizeEmail),
  consent:z.literal(true),
  website:z.string().max(200).optional().default(''),
});
