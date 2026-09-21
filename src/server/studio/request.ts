import { StudioError } from './config';

/** Enforce the limit while reading, including chunked or dishonest requests. */
export async function readBody(request: Request, limit = 80000): Promise<Record<string, unknown>> {
  if (Number(request.headers.get('content-length')) > limit) throw new StudioError('Request exceeds the upload limit.', 413);
  const reader = request.body?.getReader();
  if (!reader) throw new StudioError('A JSON request is required.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new StudioError('Request exceeds the upload limit.', 413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  try {
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!body || Array.isArray(body) || typeof body !== 'object') throw Error();
    return body;
  } catch { throw new StudioError('A valid JSON object is required.'); }
}
