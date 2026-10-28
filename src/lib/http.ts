// Limita o corpo real, inclusive requisições chunked sem Content-Length.
export async function lerJsonLimitado(request: Request, maximo: number): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new Error("corpo_invalido");
  if (!request.body) throw new Error("corpo_invalido");
  const leitor = request.body.getReader();
  const partes: Uint8Array[] = [];
  let tamanho = 0;
  try {
    while (true) {
      const { value, done } = await leitor.read();
      if (done) break;
      tamanho += value.byteLength;
      if (tamanho > maximo) { await leitor.cancel(); throw new Error("corpo_invalido"); }
      partes.push(value);
    }
    const corpo: unknown = JSON.parse(Buffer.concat(partes).toString("utf8"));
    if (!corpo || typeof corpo !== "object" || Array.isArray(corpo)) throw new Error("corpo_invalido");
    return corpo as Record<string, unknown>;
  } finally { leitor.releaseLock(); }
}
