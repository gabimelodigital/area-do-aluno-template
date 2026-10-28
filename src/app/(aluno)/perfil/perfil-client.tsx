"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { FotoPerfil } from "@/components/foto-perfil";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { iniciais } from "@/lib/format";
import { salvarFoto, salvarNome } from "./actions";

// Recorta no centro, reduz para 512x512 e converte em JPEG antes de enviar.
async function prepararFoto(arquivo: File): Promise<Blob> {
  const bitmap = await createImageBitmap(arquivo);
  const lado = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, 512, 512);
  ctx.drawImage(bitmap, (bitmap.width - lado) / 2, (bitmap.height - lado) / 2, lado, lado, 0, 0, 512, 512);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Imagem inválida"))), "image/jpeg", 0.88));
}

export function PerfilClient({ nomeInicial, email, foto }: { nomeInicial: string; email: string; foto: string | null }) {
  const router = useRouter();
  const [nome, setNome] = useState(nomeInicial);
  const [urlFoto, setUrlFoto] = useState(foto);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [pendente, iniciar] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  function trocarFoto(arquivo: File | undefined) {
    if (!arquivo) return;
    iniciar(async () => {
      try {
        const form = new FormData();
        form.append("foto", new File([await prepararFoto(arquivo)], "foto.jpg", { type: "image/jpeg" }));
        const r = await salvarFoto(form);
        if (!r.ok) return setMsg({ ok: false, texto: r.error });
        setUrlFoto(r.url);
        setMsg({ ok: true, texto: "Foto atualizada." });
        router.refresh();
      } catch {
        setMsg({ ok: false, texto: "Não consegui ler essa imagem. Tente outra (JPG ou PNG)." });
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="relative flex size-20 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
          <FotoPerfil url={urlFoto} iniciais={iniciais(nome || email)} />
          <button type="button" disabled={pendente} onClick={() => input.current?.click()} aria-label="Trocar foto" className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full border border-border bg-card text-foreground shadow hover:bg-muted">
            <Camera className="size-4" />
          </button>
          <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => trocarFoto(e.target.files?.[0])} />
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium">{nome || "Sem nome"}</p>
          <p className="truncate text-sm text-muted-foreground">{email}</p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          iniciar(async () => {
            const r = await salvarNome(nome);
            setMsg(r.ok ? { ok: true, texto: "Nome salvo." } : { ok: false, texto: r.error });
            if (r.ok) router.refresh();
          });
        }}
        className="space-y-3"
      >
        <div>
          <label htmlFor="nome" className="rotulo">Como você quer ser chamado(a)</label>
          <input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={120} className="inp w-full py-2" />
        </div>
        <Button type="submit" disabled={pendente || nome.trim().length < 2}>Salvar nome</Button>
      </form>
      {msg && <Alert variant={msg.ok ? "ok" : "err"}>{msg.texto}</Alert>}
    </div>
  );
}
