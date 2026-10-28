export type Canal = "apresente-se" | "geral" | "avisos";

export const CANAIS: { id: Canal; nome: string; icone: string; desc: string }[] = [
  { id: "apresente-se", nome: "Apresente-se", icone: "👋", desc: "Conte quem você é e qual é o seu objetivo." },
  { id: "geral", nome: "Geral", icone: "💬", desc: "Converse com a turma e tire suas dúvidas." },
  { id: "avisos", nome: "Avisos", icone: "📢", desc: "Comunicados da equipe." },
];

export const EMOJIS = ["👍", "❤️", "🔥", "🎉", "🙌"];

export type Autor = { id: string; nome: string | null; is_admin: boolean; avatar: string | null };
export type Post = {
  id: string; user_id: string; canal: Canal; titulo: string; corpo: string; fixado: boolean;
  criado_em: string; total_respostas: number; autor: Autor | null;
  reacoes: { user_id: string; emoji: string }[];
};
export type Resposta = { id: string; user_id: string; corpo: string; criado_em: string; autor: Autor | null };
export type DadosComunidade = { posts: Post[]; respostas: Resposta[]; is_admin: boolean; total: number };
