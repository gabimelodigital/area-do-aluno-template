export type Material = { label: string; url: string };

export type Modulo = { id: string; titulo: string; descricao: string | null; ordem: number; publicado: boolean };

export type Aula = {
  id: string;
  modulo_id: string;
  titulo: string;
  descricao: string | null;
  video_url: string | null;
  materiais: Material[];
  transcricao: string | null;
  ordem: number;
  publicado: boolean;
};

export const urlAula = (moduloId: string, aulaId: string) => `/metodo/${moduloId}/aula/${aulaId}`;

// Materiais vêm do admin como JSON; aqui só passam links http(s) válidos.
export function lerMateriais(valor: unknown): Material[] {
  if (!Array.isArray(valor)) return [];
  return valor.flatMap((m) => {
    const label = typeof m?.label === "string" ? m.label.trim() : "";
    const url = typeof m?.url === "string" ? m.url.trim() : "";
    return label && /^https?:\/\//i.test(url) ? [{ label, url }] : [];
  });
}
