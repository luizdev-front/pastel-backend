function normalizar(s) {
  return s.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Novo gerador de código com data + 3 números aleatórios
function gerarCodigoPedido() {
  const hoje = new Date();
  const dia = hoje.getDate().toString().padStart(2, "0");
  const mes = (hoje.getMonth() + 1).toString().padStart(2, "0");
  const numeros = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `${dia}${mes}-${numeros}`;
}

// Função para pegar horário de Brasília (UTC-3)
function pegarHorario() {
  const agora = new Date();
  const utc = agora.getTime() + agora.getTimezoneOffset() * 60000;
  const brasil = new Date(utc - 3 * 3600000); // Ajuste para UTC-3
  const horas = brasil.getHours().toString().padStart(2, "0");
  const minutos = brasil.getMinutes().toString().padStart(2, "0");
  return `${horas}:${minutos}`;
}

const bairrosTaxas = [
  { bairro: "MARÉ MANSA", taxa: 4 },
  { bairro: "VILA RÃ", taxa: 6 },
  { bairro: "AREIÃO", taxa: 6 },
  { bairro: "PENÍNSULA", taxa: 6 },
  { bairro: "PEDREIRA", taxa: 8 },
];

const formasPagamentoAceitas = [
  "PIX",
  "DINHEIRO",
  "CARTAO",
  "CARTÃO",
];

export default function handler(req, res) {

  // 🔥 CORS LIBERADO
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ erro: "Método não permitido" });

  try {
    const { carrinho = [], cliente = {}, pagamento } = req.body;

    if (!carrinho.length || !cliente.nome || !cliente.bairro || !pagamento) {
      return res.status(400).json({ erro: "Dados incompletos" });
    }

    const bairroInformado = normalizar(cliente.bairro);

    const taxaObj = bairrosTaxas.find((b) =>
      normalizar(b.bairro).includes(bairroInformado) ||
      bairroInformado.includes(normalizar(b.bairro))
    );

    if (!taxaObj) return res.status(400).json({ erro: "Bairro não atendido" });

    const taxaEntrega = taxaObj.taxa;
    const totalCarrinho = carrinho.reduce(
      (acc, item) => acc + (item.preco ? item.preco : 0),
      0
    );
    const totalFinal = totalCarrinho + taxaEntrega;

    const numeroPedido = gerarCodigoPedido();
    const horarioPedido = pegarHorario();

    const tipoPagamento = normalizar(pagamento);
    if (!formasPagamentoAceitas.includes(tipoPagamento)) {
      return res.status(400).json({ erro: "Forma de pagamento não aceita" });
    }

    let mensagem = `🍽️ Pedido nº ${numeroPedido} — ${horarioPedido}\n\n`;

    mensagem += `🛒 *Itens do pedido:*\n`;
    carrinho.forEach((item) => {
      const adicionais = item.adicionais?.length
        ? `\n   ➕ Adicionais: ${item.adicionais.join(", ")}`
        : "";
      mensagem += `• ${item.nome} — R$ ${item.preco?.toFixed(2) || "0.00"}${adicionais}\n`;
    });

    mensagem += `\n🚚 *Taxa de entrega:* R$ ${taxaEntrega.toFixed(2)}\n`;
    mensagem += `💰 *Total:* R$ ${totalFinal.toFixed(2)}\n\n`;

    mensagem += `👤 *Dados do cliente:*\n`;
    mensagem += `• Nome: ${cliente.nome}\n`;
    mensagem += `• Endereço: ${cliente.rua}, nº ${cliente.numero}\n`;
    mensagem += `• Bairro: ${cliente.bairro}\n`;
    if (cliente.obs) mensagem += `• Observações: ${cliente.obs}\n`;

    mensagem += `\n💳 *Forma de pagamento:* ${pagamento}\n`;

    if (tipoPagamento === "PIX") {
      mensagem += `🔑 Chave PIX: 13996039919\n`;
      mensagem += `📌 Envie o comprovante aqui no WhatsApp.\n`;
    }

    return res.status(200).json({
      mensagem,
      totalFinal,
      numeroPedido,
      horarioPedido,
    });

  } catch (err) {
    console.error("Erro interno:", err);
    return res.status(500).json({ erro: "Erro interno no servidor" });
  }
}

