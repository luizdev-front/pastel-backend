let numeroGlobal = 0; // contador de pedidos em memória

const bairrosTaxas = [
  { bairro: "MARE MANSA", taxa: 4 },
  { bairro: "VILA RA", taxa: 6 },
  { bairro: "AREIAO", taxa: 6 },
  { bairro: "PENINSULA", taxa: 6 },
  { bairro: "PEDREIRA", taxa: 8 },
];

const CHAVE_PIX = "13996039919"; // chave PIX segura

const normalizar = (s) =>
  s.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { carrinho, cliente, pagamento } = req.body;

  if (!carrinho || !cliente || !pagamento)
    return res.status(400).json({ erro: "Dados incompletos" });

  const bairroFormatado = normalizar(cliente.bairro);
  const dadosBairro = bairrosTaxas.find((b) => b.bairro === bairroFormatado);

  if (!dadosBairro)
    return res.status(400).json({ erro: "Bairro não atendido" });

  numeroGlobal++; // incrementa pedido
  const numeroPedido = numeroGlobal;

  const taxa = dadosBairro.taxa;
  const total = carrinho.reduce((sum, item) => sum + (item.preco || 0), 0);
  const totalFinal = total + taxa;

  // Monta mensagem para WhatsApp
  let msg = `📦 *Novo Pedido*\n\n`;
  carrinho.forEach((item) => {
    const adicionais = item.adicionais?.length ? ` (${item.adicionais.join(", ")})` : "";
    msg += `• ${item.nome}${adicionais} – R$ ${item.preco.toFixed(2)}\n`;
  });

  msg += `
🚚 Entrega: R$ ${taxa.toFixed(2)}
💰 Total: R$ ${totalFinal.toFixed(2)}

👤 Nome: ${cliente.nome}
🏙️ Bairro: ${cliente.bairro}
📍 Rua: ${cliente.rua}
🏠 Número: ${cliente.numero}
📝 Observações: ${cliente.obs || "Nenhuma"}

💳 Pagamento: ${pagamento.toUpperCase()}
${pagamento === "pix" ? `💸 Chave PIX: ${CHAVE_PIX}\n` : ""}
🔖 Pedido Nº ${numeroPedido}

📄 Envie o comprovante após o pagamento.
`;

  res.status(200).json({ mensagem: msg, totalFinal, numeroPedido });
}
