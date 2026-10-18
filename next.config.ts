import type { NextConfig } from 'next';
const config: NextConfig = {
  outputFileTracingIncludes: {
    '/api/arrays/run': ['./workers/python/runner.py'],
  },
};
export default config;
