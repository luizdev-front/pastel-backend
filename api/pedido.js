import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const pedido = req.body;

  // Conta pedidos para gerar número global
  const { count } = await supabase
    .from("pedidos")
    .select("*", { count: "exact", head: true });

  const numeroPedido = count + 1;

  const { error } = await supabase.from("pedidos").insert([
    {
      numero: numeroPedido,
      ...pedido,
      data: new Date().toISOString(),
    },
  ]);

  if (error) return res.status(500).json({ erro: error.message });

  res.status(200).json({ status: "ok", numero: numeroPedido });
}
