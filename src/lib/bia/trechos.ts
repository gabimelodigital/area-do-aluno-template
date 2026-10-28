// Divide um texto longo (transcrição de aula ou texto extra) em trechos de até
// ~1400 caracteres, quebrando em fim de frase. Cada trecho vira uma linha de busca.
export function dividirEmTrechos(texto: string | null | undefined, max = 1400): string[] {
  const limpo = (texto ?? "").replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
  if (!limpo) return [];
  const frases = limpo.split(/(?<=[.!?…])\s+|\n{2,}/);
  const partes: string[] = [];
  let atual = "";
  for (const frase of frases) {
    if (atual && atual.length + frase.length + 1 > max) {
      partes.push(atual);
      atual = "";
    }
    if (frase.length > max) {
      if (atual) partes.push(atual);
      for (let i = 0; i < frase.length; i += max) partes.push(frase.slice(i, i + max));
      atual = "";
    } else {
      atual += `${atual ? " " : ""}${frase}`;
    }
  }
  if (atual) partes.push(atual);
  return partes.filter((p) => p.trim().length > 0);
}
