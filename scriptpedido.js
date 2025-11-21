document.addEventListener("DOMContentLoaded", () => {

  /* --------------------------
  ELEMENTOS
  -------------------------- */
  const produtoDiv = document.getElementById("produto");
  const pagamentoSelect = document.getElementById("pagamento");
  const pixDiv = document.getElementById("pix-info");

  const campos = {
    nome: document.getElementById("nome"),
    bairro: document.getElementById("endereco"),
    rua: document.getElementById("rua"),
    numero: document.getElementById("numero"),
    obs: document.getElementById("observacoes"),
  };

  /* --------------------------
  TAXAS POR BAIRRO
  -------------------------- */
  const bairrosTaxas = [
    { bairro: "MARÉ MANSA", taxa: 4 },
    { bairro: "VILA RÃ", taxa: 6 },
    { bairro: "AREIÃO", taxa: 6 },
    { bairro: "PENÍNSULA", taxa: 6 },
    { bairro: "PEDREIRA", taxa: 8 },
  ];

  /* --------------------------
  FUNÇÕES ÚTEIS
  -------------------------- */
  const normalizar = (s) =>
    s.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  /* --------------------------
  RENDER CARRINHO
  -------------------------- */
  function renderCarrinho() {
    const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
    produtoDiv.innerHTML = "";

    if (carrinho.length === 0) {
      produtoDiv.innerHTML = "<p>Nenhum item no pedido.</p>";
      return;
    }

    let total = 0;

    carrinho.forEach((item, index) => {
      const div = document.createElement("div");
      div.classList.add("item-carrinho");

      const nome = item.nome || "Item sem nome";
      const preco = item.preco || 0;
      const adicionais = item.adicionais?.length
        ? ` (${item.adicionais.join(", ")})`
        : "";

      const span = document.createElement("span");
      span.textContent = `${nome}${adicionais} – R$ ${preco.toFixed(2)}`;

      const btn = document.createElement("button");
      btn.className = "btn-remover";
      btn.textContent = "Remover";
      btn.addEventListener("click", () => removerItem(index));

      div.appendChild(span);
      div.appendChild(btn);

      produtoDiv.appendChild(div);

      total += preco;
    });

    const totalEl = document.createElement("h3");
    totalEl.textContent = `Total: R$ ${total.toFixed(2)}`;
    produtoDiv.appendChild(totalEl);
  }

  /* --------------------------
  REMOVER ITEM
  -------------------------- */
  function removerItem(index) {
    const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
    carrinho.splice(index, 1);
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
    renderCarrinho();
  }

  /* --------------------------
  PIX – MOSTRAR/OCULTAR
  -------------------------- */
  pagamentoSelect.addEventListener("change", () => {
    if (pagamentoSelect.value === "pix") {
      pixDiv.classList.remove("hidden");
      pixDiv.innerHTML = `
        <h3>Pagamento PIX</h3>
        <p><strong>Valor:</strong> será calculado após finalizar</p>
      `;
    } else {
      pixDiv.classList.add("hidden");
      pixDiv.innerHTML = "";
    }
  });

  /* --------------------------
  VALIDAR CAMPOS
  -------------------------- */
  function validarCampos() {
    return (
      Object.values(campos).every((c) => c.value.trim() !== "") &&
      pagamentoSelect.value !== ""
    );
  }

  /* --------------------------
  FINALIZAR PEDIDO – COM BACK-END SEGURO
  -------------------------- */
  async function finalizarPedido() {
    if (!validarCampos()) {
      alert("Preencha todos os campos!");
      return;
    }

    const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
    if (carrinho.length === 0) return alert("Seu carrinho está vazio!");

    const cliente = {
      nome: campos.nome.value,
      bairro: campos.bairro.value,
      rua: campos.rua.value,
      numero: campos.numero.value,
      obs: campos.obs.value
    };

    const pagamento = pagamentoSelect.value;

    try {
      const response = await fetch("/api/pedido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carrinho, cliente, pagamento })
      });

      const data = await response.json();

      if (!response.ok) {
        return alert(data.erro || "Erro ao enviar pedido");
      }

      // Abrir WhatsApp com mensagem pronta
      const numeroWhats = "5513996039919";
      window.open(
        `https://wa.me/${numeroWhats}?text=${encodeURIComponent(data.mensagem)}`,
        "_blank"
      );

      // Mostrar valor PIX, se for pagamento PIX
      if (pagamento === "pix") {
        pixDiv.classList.remove("hidden");
        pixDiv.innerHTML = `
          <h3>Pagamento PIX</h3>
          <p><strong>Valor:</strong> R$ ${data.totalFinal.toFixed(2)}</p>
        `;
      }

      // Limpar carrinho
      localStorage.removeItem("carrinho");
      renderCarrinho();
    } catch (err) {
      console.error(err);
      alert("Erro de conexão com o servidor. Tente novamente.");
    }
  }

  document.getElementById("enviar-vendedora-btn").onclick = finalizarPedido;

  /* --------------------------
  INÍCIO
  -------------------------- */
  renderCarrinho();
});
