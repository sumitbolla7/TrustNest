export async function boundedBody(request, maximum) {
  const declared = request.headers.get('content-length');
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > maximum)) {
    return { status: 413 };
  }
  if (!request.body) return { status: 400 };
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximum) {
        await reader.cancel().catch(() => {});
        return { status: 413 };
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return { bytes };
  } catch {
    return { status: 400 };
  } finally {
    reader.releaseLock();
  }
}

export async function readJsonObject(request, maximum, fields) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') ?? '')) return { status: 415 };
  const read = await boundedBody(request, maximum);
  if (read.status) return read;
  try {
    const data = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(read.bytes));
    const allowed = Array.isArray(fields) ? fields : data && typeof data.action === 'string' && Object.hasOwn(fields, data.action) ? fields[data.action] : null;
    if (!data || typeof data !== 'object' || Array.isArray(data) || !allowed || Object.keys(data).some(key => !allowed.includes(key))) {
      return { status: 400 };
    }
    return { data };
  } catch {
    return { status: 400 };
  }
}

export async function readRentalForm(request, maximum = 4 * 1024 * 1024) {
  const type = request.headers.get('content-type') ?? '';
  const multipart = /^multipart\/form-data\s*;/i.test(type);
  const encoded = /^application\/x-www-form-urlencoded(?:\s*;|$)/i.test(type);
  if (!multipart && !encoded) return { status: 415 };
  const read = await boundedBody(request, maximum);
  if (read.status) return read;
  try {
    const data = await new Response(read.bytes, { headers: { 'Content-Type': type } }).formData();
    return { data };
  } catch {
    return { status: 400 };
  }
}
