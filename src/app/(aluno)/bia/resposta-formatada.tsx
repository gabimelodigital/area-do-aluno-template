import type { ReactNode } from "react";

// Markdown mínimo das respostas da BIA, renderizado como elementos React (sem HTML cru).
// Cobre o que o modelo usa: títulos, listas, citação, negrito, itálico e código.

function inline(texto: string, chave: string): ReactNode[] {
  const partes = texto.split(/(\*\*[^*]+\*\*|__[^_]+__|\*[^*\s][^*]*\*|_[^_\s][^_]*_|`[^`]+`)/g);
  return partes.filter(Boolean).map((p, i) => {
    const k = `${chave}-${i}`;
    if (/^(\*\*|__).+\1$/.test(p)) return <strong key={k} className="font-semibold text-foreground">{p.slice(2, -2)}</strong>;
    if (/^([*_]).+\1$/.test(p)) return <em key={k}>{p.slice(1, -1)}</em>;
    if (/^`.+`$/.test(p)) return <code key={k} className="rounded bg-muted px-1 py-0.5 text-[0.85em]">{p.slice(1, -1)}</code>;
    return p;
  });
}

export function RespostaFormatada({ texto }: { texto: string }) {
  const blocos: ReactNode[] = [];
  let lista: { ordenada: boolean; itens: string[] } | null = null;
  let paragrafo: string[] = [];

  const fecharParagrafo = () => {
    if (!paragrafo.length) return;
    const k = `p${blocos.length}`;
    blocos.push(<p key={k}>{inline(paragrafo.join(" "), k)}</p>);
    paragrafo = [];
  };
  const fecharLista = () => {
    if (!lista) return;
    const k = `l${blocos.length}`;
    const itens = lista.itens.map((item, i) => <li key={i} className="pl-1">{inline(item, `${k}-${i}`)}</li>);
    blocos.push(lista.ordenada
      ? <ol key={k} className="list-decimal space-y-1 pl-5 marker:font-semibold marker:text-muted-foreground">{itens}</ol>
      : <ul key={k} className="list-disc space-y-1 pl-5 marker:text-primary">{itens}</ul>);
    lista = null;
  };

  for (const bruta of texto.replace(/\r\n/g, "\n").split("\n")) {
    const linha = bruta.trim();
    const titulo = linha.match(/^#{1,6}\s+(.*)$/);
    const item = linha.match(/^([-*•]|\d+[.)])\s+(.*)$/);
    const citacao = linha.match(/^>\s?(.*)$/);
    if (!linha || /^(-{3,}|\*{3,}|_{3,})$/.test(linha)) { fecharParagrafo(); fecharLista(); continue; }
    if (titulo) {
      fecharParagrafo(); fecharLista();
      const k = `h${blocos.length}`;
      blocos.push(<p key={k} className="pt-1 font-semibold text-foreground">{inline(titulo[1].replace(/^(\*\*|__)(.*)\1$/, "$2"), k)}</p>);
    } else if (item) {
      fecharParagrafo();
      const ordenada = /^\d/.test(item[1]);
      if (lista && lista.ordenada !== ordenada) fecharLista();
      lista ??= { ordenada, itens: [] };
      lista.itens.push(item[2]);
    } else if (citacao) {
      fecharParagrafo(); fecharLista();
      const k = `c${blocos.length}`;
      blocos.push(<p key={k} className="rounded-lg border-l-4 border-brand/40 bg-brand/5 px-3 py-2">{inline(citacao[1], k)}</p>);
    } else {
      fecharLista();
      paragrafo.push(linha);
    }
  }
  fecharParagrafo(); fecharLista();

  return <div className="space-y-3 text-sm leading-relaxed text-foreground/90">{blocos}</div>;
}
