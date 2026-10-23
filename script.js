"use strict";

const formulario = document.getElementById("pedido-form");
const resumo = document.getElementById("itens-resumo");
const totalElemento = document.getElementById("total");
const cliente = document.getElementById("cliente");
const telefone = document.getElementById("telefone");
const codigoPais = document.getElementById("codigo-pais");
const bairro = document.getElementById("bairro");
const observacao = document.getElementById("observacao");
const confirmar = document.getElementById("confirmar");
const novoPedidoBotao = document.getElementById("novo-pedido");
const resultado = document.getElementById("resultado");
const mensagemConfirmacao = document.getElementById("mensagem-confirmacao");
const codigoPedidoElemento = document.getElementById("codigo-pedido");
const previsaoConfirmacao = document.getElementById("previsao-confirmacao");
const copiarPedidoBotao = document.getElementById("copiar-pedido");
const compartilharPedidoBotao = document.getElementById("compartilhar-pedido");
const botaoTema = document.getElementById("theme-toggle");
const avisoLimite = document.getElementById("aviso-limite");
const avisoValidacao = document.getElementById("aviso-validacao");
const taxaEntregaTexto = document.getElementById("taxa-entrega");
const tempoEntregaTexto = document.getElementById("tempo-entrega");
const botaoRecursos = document.getElementById("recursos-toggle");
const menuRecursos = document.getElementById("recursos-menu");
const campoCodigoRastreio = document.getElementById("codigo-rastreio");
const botaoRastrear = document.getElementById("rastrear");
const resultadoRastreio = document.getElementById("resultado-rastreio");

const mapaElemento = document.getElementById("mapa-campo-largo");
const mapaBairroTexto = document.getElementById("mapa-bairro-texto");
const mapaStatusMoto = document.getElementById("mapa-status-moto");
const mapaDistancia = document.getElementById("mapa-distancia");
const mapaTempoTexto = document.getElementById("mapa-tempo-texto");

const limitesAdicionais = {
    "300": 2,
    "500": 4,
    "700": 6,
    "1000": 8
};

const coordenadasEntrega = {
    "Meliane": [-25.4430, -49.5260],
    "Gorski": [-25.4510, -49.5160],
    "Centro": [-25.4595, -49.5290],
    "Jardim Esmeralda": [-25.4740, -49.5500],
    "Itaqui": [-25.4320, -49.5700],
    "Rivabem": [-25.4870, -49.5350],
    "Ferraria": [-25.4550, -49.6050],
    "Partenope": [-25.4460, -49.5440],
    "Vila Bancaria": [-25.4660, -49.5180],
    "Bom Jesus": [-25.4500, -49.5400],
    "Boa Vista": [-25.4300, -49.5350],
    "Cristo Rei": [-25.4680, -49.5450],
    "Ouro Verde": [-25.4820, -49.5200],
    "Aguas Claras": [-25.5000, -49.5550],
    "Itambezinho": [-25.4120, -49.5450]
};

const pontoLoja = [-25.4630, -49.5330];
const DURACAO_ENTREGA = 16000;
const INTERVALO_ANIMACAO = 100;

let ultimoPedido = "";
let mapaEntrega = null;
let marcadorMoto = null;
let marcadorDestino = null;
let linhaRota = null;
let animacaoMoto = null;
let timerChegada = null;
let identificadorEntrega = 0;
let entregaEmAndamento = false;
let pedidoRastreado = null;
let codigosJaIniciados = new Set();

function dinheiro(valor) {
    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function selecionado(nome) {
    return document.querySelector(`input[name="${nome}"]:checked`);
}

function adicionaisMarcados() {
    return [...document.querySelectorAll('input[name="adicional"]:checked')];
}

function calcularTaxaEntrega() {
    if (!bairro.value) return 0;
    return bairro.value === "Centro" ? 5 : 10;
}

function calcularTempoEntrega() {
    if (!bairro.value) return "";
    return bairro.value === "Centro" ? "25 a 40 minutos" : "35 a 60 minutos";
}

function atualizarTextoTaxa() {
    if (!bairro.value) {
        taxaEntregaTexto.textContent = "Selecione seu bairro para calcular.";
        tempoEntregaTexto.textContent = "⏱️ Tempo estimado: selecione seu bairro.";
        return;
    }

    taxaEntregaTexto.textContent =
        `Taxa para ${bairro.value}: ${dinheiro(calcularTaxaEntrega())}.`;

    tempoEntregaTexto.textContent =
        `⏱️ Tempo estimado de entrega: ${calcularTempoEntrega()}.`;
}

function mostrarAviso(elemento, mensagem) {
    elemento.textContent = mensagem;
    elemento.hidden = false;
}

function esconderAviso(elemento) {
    elemento.textContent = "";
    elemento.hidden = true;
}

function obterPedido() {
    const tamanho = selecionado("tamanho");
    const cobertura = selecionado("base");

    if (!tamanho || !cobertura) return null;

    const adicionais = adicionaisMarcados();
    const taxa = calcularTaxaEntrega();

    const itens = [
        {
            nome: `${tamanho.value} ml`,
            preco: Number(tamanho.dataset.price)
        },
        {
            nome: `Cobertura: ${cobertura.value}`,
            preco: Number(cobertura.dataset.price)
        },
        ...adicionais.map(item => ({
            nome: item.value,
            preco: Number(item.dataset.price)
        }))
    ];

    if (bairro.value) {
        itens.push({
            nome: `Entrega - ${bairro.value}`,
            preco: taxa
        });
    }

    const total = itens.reduce((soma, item) => soma + item.preco, 0);

    return {
        tamanho: tamanho.value,
        cliente: cliente.value.trim(),
        telefone: telefone.value.trim(),
        codigoPais: codigoPais.value,
        bairro: bairro.value,
        observacao: observacao.value.trim(),
        itens,
        total,
        quantidadeAdicionais: adicionais.length,
        limite: limitesAdicionais[tamanho.value],
        taxa,
        tempo: calcularTempoEntrega()
    };
}

function atualizarResumo() {
    atualizarTextoTaxa();

    const pedido = obterPedido();
    if (!pedido) return;

    const fragmento = document.createDocumentFragment();

    pedido.itens.forEach(item => {
        const linha = document.createElement("p");
        const nome = document.createElement("span");
        const preco = document.createElement("strong");

        nome.textContent = item.nome;
        preco.textContent = dinheiro(item.preco);

        linha.append(nome, preco);
        fragmento.appendChild(linha);
    });

    resumo.replaceChildren(fragmento);
    totalElemento.textContent = dinheiro(pedido.total);

    if (pedido.quantidadeAdicionais >= pedido.limite) {
        mostrarAviso(
            avisoLimite,
            `Você selecionou ${pedido.quantidadeAdicionais} de ${pedido.limite} adicionais permitidos para ${pedido.tamanho} ml.`
        );
    } else {
        esconderAviso(avisoLimite);
    }
}

function atualizarEstadoAdicionais() {
    const tamanho = selecionado("tamanho");
    if (!tamanho) return;

    const limite = limitesAdicionais[tamanho.value];
    const quantidade = adicionaisMarcados().length;

    document.querySelectorAll('input[name="adicional"]').forEach(item => {
        item.disabled = !item.checked && quantidade >= limite;
    });
}

function ajustarAdicionaisAoTamanho() {
    const tamanho = selecionado("tamanho");
    if (!tamanho) return;

    const limite = limitesAdicionais[tamanho.value];
    const marcados = adicionaisMarcados();

    if (marcados.length > limite) {
        marcados.slice(limite).forEach(item => {
            item.checked = false;
        });

        mostrarAviso(
            avisoLimite,
            `O tamanho ${tamanho.value} ml permite até ${limite} adicionais. Os excedentes foram desmarcados.`
        );
    }

    atualizarEstadoAdicionais();
    atualizarResumo();
}

function validarTelefone(valor) {
    const numeros = valor.replace(/\D/g, "");
    return numeros.length === 10 || numeros.length === 11;
}

function formatarTelefone() {
    const numeros = telefone.value.replace(/\D/g, "").slice(0, 11);

    if (numeros.length <= 2) {
        telefone.value = numeros.length ? `(${numeros}` : "";
    } else if (numeros.length <= 6) {
        telefone.value = `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    } else if (numeros.length <= 10) {
        telefone.value = `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
    } else {
        telefone.value = `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
    }

    esconderAviso(avisoValidacao);
}

function montarTextoPedido(pedido) {
    return [
        "🍇 HEVO AÇAÍ — PEDIDO",
        "",
        `Código: ${pedido.codigo}`,
        `Nome: ${pedido.cliente}`,
        `Telefone: ${pedido.codigoPais} ${pedido.telefone}`,
        `Bairro: ${pedido.bairro}`,
        "",
        "ITENS DO PEDIDO:",
        ...pedido.itens.map(item => `${item.nome}: ${dinheiro(item.preco)}`),
        "",
        `Taxa de entrega: ${dinheiro(pedido.taxa)}`,
        `Previsão estimada: ${pedido.tempo}`,
        `TOTAL: ${dinheiro(pedido.total)}`,
        `Observações: ${pedido.observacao || "Nenhuma"}`,
        "",
        "Pedido criado pelo site HEVO AÇAÍ."
    ].join("\n");
}

function validarPedido(pedido) {
    esconderAviso(avisoValidacao);

    if (!pedido.cliente) {
        mostrarAviso(avisoValidacao, "Preencha seu nome completo.");
        cliente.focus();
        return false;
    }

    if (!validarTelefone(pedido.telefone)) {
        mostrarAviso(
            avisoValidacao,
            "Informe um telefone válido com DDD, contendo 10 ou 11 números."
        );
        telefone.focus();
        return false;
    }

    if (!pedido.bairro) {
        mostrarAviso(avisoValidacao, "Selecione seu bairro de entrega.");
        bairro.focus();
        return false;
    }

    if (pedido.quantidadeAdicionais > pedido.limite) {
        mostrarAviso(
            avisoValidacao,
            `O copo de ${pedido.tamanho} ml permite até ${pedido.limite} adicionais.`
        );
        return false;
    }

    return true;
}

function gerarCodigoPedido() {
    return `HEVO-${Math.floor(100000 + Math.random() * 900000)}`;
}

function salvarPedido(pedido) {
    try {
        const pedidos = JSON.parse(localStorage.getItem("hevo-pedidos") || "[]");
        pedidos.push(pedido);
        localStorage.setItem("hevo-pedidos", JSON.stringify(pedidos));
        return true;
    } catch {
        return false;
    }
}

function confirmarPedido() {
    const pedido = obterPedido();

    if (!pedido || !validarPedido(pedido)) return;

    pedido.codigo = gerarCodigoPedido();
    pedido.status = "Pedido registrado neste navegador";
    pedido.criadoEm = new Date().toISOString();

    ultimoPedido = montarTextoPedido(pedido);
    const salvo = salvarPedido(pedido);

    mensagemConfirmacao.textContent =
        `Pedido preparado para ${pedido.cliente}. Total: ${dinheiro(pedido.total)}.`;

    codigoPedidoElemento.textContent = pedido.codigo;

    previsaoConfirmacao.textContent =
        `Previsão estimada: ${pedido.tempo}. O prazo é aproximado e não representa confirmação em tempo real.`;

    resultado.hidden = false;

    if (!salvo) {
        mensagemConfirmacao.textContent +=
            " Não foi possível salvar o pedido neste navegador. Copie os dados antes de sair.";
    }

    pedidoRastreado = null;

    if (mapaStatusMoto) {
        mapaStatusMoto.textContent = "Pedido confirmado — aguardando rastreamento";
    }

    if (mapaTempoTexto) {
        mapaTempoTexto.textContent = "Aguardando rastreamento";
    }

    if (mapaDistancia) {
        mapaDistancia.textContent = "Clique em Rastrear pedido para iniciar a simulação.";
    }

    resultado.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}

async function copiarTexto(texto) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(texto);
            return true;
        }
    } catch {}

    const campo = document.createElement("textarea");
    campo.value = texto;
    campo.setAttribute("readonly", "");
    campo.style.position = "fixed";
    campo.style.opacity = "0";

    document.body.appendChild(campo);
    campo.select();

    let copiado = false;

    try {
        copiado = document.execCommand("copy");
    } catch {
        copiado = false;
    }

    campo.remove();
    return copiado;
}

async function copiarPedido() {
    if (!ultimoPedido) return;

    const copiado = await copiarTexto(ultimoPedido);

    if (copiado) {
        copiarPedidoBotao.textContent = "✅ Pedido copiado!";

        setTimeout(() => {
            copiarPedidoBotao.textContent = "Copiar pedido completo";
        }, 2000);
    } else {
        mensagemConfirmacao.textContent =
            "Não foi possível copiar automaticamente. Tente selecionar e copiar o texto do pedido.";
    }
}

async function compartilharPedido() {
    if (!ultimoPedido) return;

    if (navigator.share) {
        try {
            await navigator.share({
                title: "Pedido HEVO AÇAÍ",
                text: ultimoPedido
            });
            return;
        } catch (erro) {
            if (erro.name === "AbortError") return;
        }
    }

    const copiado = await copiarTexto(ultimoPedido);

    mensagemConfirmacao.textContent = copiado
        ? "Pedido copiado! Você já pode colar no aplicativo de mensagens."
        : "Não foi possível compartilhar ou copiar automaticamente.";
}

function novoPedido() {
    pararAnimacaoMoto();

    formulario.reset();

    document.querySelector('input[name="tamanho"][value="500"]').checked = true;
    document.querySelector('input[name="base"][value="Chocolate"]').checked = true;

    ultimoPedido = "";
    pedidoRastreado = null;
    resultado.hidden = true;
    mensagemConfirmacao.textContent = "";
    codigoPedidoElemento.textContent = "";
    previsaoConfirmacao.textContent = "";

    esconderAviso(avisoLimite);
    esconderAviso(avisoValidacao);

    if (marcadorMoto && mapaEntrega) {
        marcadorMoto.setLatLng(pontoLoja);
    }

    if (linhaRota && mapaEntrega) {
        mapaEntrega.removeLayer(linhaRota);
        linhaRota = null;
    }

    if (marcadorDestino && mapaEntrega) {
        marcadorDestino.setLatLng(pontoLoja);
    }

    if (mapaStatusMoto) mapaStatusMoto.textContent = "Aguardando pedido";
    if (mapaDistancia) mapaDistancia.textContent = "A rota aparecerá aqui.";
    if (mapaTempoTexto) mapaTempoTexto.textContent = "-- min";
    if (mapaBairroTexto) {
        mapaBairroTexto.textContent =
            "Selecione um bairro para visualizar a rota simulada.";
    }

    atualizarEstadoAdicionais();
    atualizarResumo();

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function aplicarTema(temaClaro) {
    document.body.classList.toggle("tema-claro", temaClaro);

    botaoTema.textContent = temaClaro ? "🌙" : "☀️";

    botaoTema.setAttribute(
        "aria-label",
        temaClaro ? "Ativar tema escuro" : "Ativar tema claro"
    );

    if (mapaEntrega) {
        setTimeout(() => mapaEntrega.invalidateSize(), 100);
    }
}

function carregarTema() {
    let temaSalvo = "escuro";

    try {
        temaSalvo = localStorage.getItem("hevo-tema") || "escuro";
    } catch {
        temaSalvo = "escuro";
    }

    aplicarTema(temaSalvo === "claro");
}

function alternarTema() {
    const temaClaro = !document.body.classList.contains("tema-claro");
    aplicarTema(temaClaro);

    try {
        localStorage.setItem("hevo-tema", temaClaro ? "claro" : "escuro");
    } catch {}
}

function alternarRecursos() {
    menuRecursos.hidden = !menuRecursos.hidden;

    botaoRecursos.setAttribute("aria-expanded", String(!menuRecursos.hidden));

    botaoRecursos.textContent = menuRecursos.hidden
        ? "☰ Recursos"
        : "✕ Fechar recursos";
}

function adicionarTexto(elemento, texto, tag = "p") {
    const novoElemento = document.createElement(tag);
    novoElemento.textContent = texto;
    elemento.appendChild(novoElemento);
    return novoElemento;
}

function consultarRastreamento() {
    const codigo = campoCodigoRastreio.value.trim().toUpperCase();

    resultadoRastreio.replaceChildren();
    resultadoRastreio.hidden = false;

    if (!codigo) {
        adicionarTexto(resultadoRastreio, "Digite o código do pedido para consultar.");
        campoCodigoRastreio.focus();
        return;
    }

    let pedidos = [];

    try {
        pedidos = JSON.parse(localStorage.getItem("hevo-pedidos") || "[]");
    } catch {
        pedidos = [];
    }

    const pedido = pedidos.find(item => item.codigo === codigo);

    if (!pedido) {
        adicionarTexto(resultadoRastreio, "Pedido não encontrado", "h3");
        adicionarTexto(
            resultadoRastreio,
            "Confira o código. Pedidos de outros navegadores ou dispositivos não aparecem nesta consulta."
        );
        return;
    }

    adicionarTexto(resultadoRastreio, "📦 Pedido localizado", "h3");
    adicionarTexto(resultadoRastreio, `Código: ${pedido.codigo}`);
    adicionarTexto(resultadoRastreio, `Status demonstrativo: ${pedido.status}`);
    adicionarTexto(resultadoRastreio, `Total: ${dinheiro(pedido.total)}`);
    adicionarTexto(
        resultadoRastreio,
        `Previsão estimada: ${pedido.tempo || "Não disponível"}`
    );

    adicionarTexto(
        resultadoRastreio,
        "Esta é uma simulação demonstrativa da entrega."
    );

    if (codigosJaIniciados.has(pedido.codigo)) {
        adicionarTexto(
            resultadoRastreio,
            "O rastreamento deste pedido já foi iniciado."
        );
        return;
    }

    if (entregaEmAndamento) {
        adicionarTexto(
            resultadoRastreio,
            "Já existe uma entrega em andamento. Aguarde a conclusão."
        );
        return;
    }

    codigosJaIniciados.add(pedido.codigo);
    pedidoRastreado = pedido.codigo;

    simularEntrega(pedido.bairro, true);
}

function iniciarMapaEntrega() {
    if (!mapaElemento || typeof L === "undefined") {
        console.error(
            "Mapa não iniciado: confira o elemento #mapa-campo-largo e o carregamento do Leaflet."
        );
        return;
    }

    mapaEntrega = L.map("mapa-campo-largo").setView(pontoLoja, 12);

    L.tileLayer("https://tile.openstreetmap.de/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19
    }).addTo(mapaEntrega);

    const iconeLoja = L.divIcon({
        className: "",
        html: '<div class="mapa-marcador-loja">🍇</div>',
        iconSize: [38, 38],
        iconAnchor: [19, 19]
    });

    const iconeMoto = L.divIcon({
        className: "",
        html: '<div class="mapa-marcador-moto">🏍️</div>',
        iconSize: [38, 38],
        iconAnchor: [19, 19]
    });

    L.marker(pontoLoja, { icon: iconeLoja })
        .addTo(mapaEntrega)
        .bindPopup("HEVO AÇAÍ — ponto de saída demonstrativo");

    marcadorMoto = L.marker(pontoLoja, {
        icon: iconeMoto
    }).addTo(mapaEntrega);

    const iconeDestino = L.divIcon({
        className: "",
        html: '<div style="font-size: 32px; text-align: center;">📍</div>',
        iconSize: [38, 38],
        iconAnchor: [19, 38]
    });

    marcadorDestino = L.marker(pontoLoja, {
        icon: iconeDestino
    }).addTo(mapaEntrega);

    marcadorDestino.bindPopup("📍 Destino da entrega");

    setTimeout(() => {
        if (mapaEntrega) {
            mapaEntrega.invalidateSize(true);
        }
    }, 500);
}

function pararAnimacaoMoto() {
    if (animacaoMoto !== null) {
        clearInterval(animacaoMoto);
        animacaoMoto = null;
    }

    if (timerChegada !== null) {
        clearTimeout(timerChegada);
        timerChegada = null;
    }

    identificadorEntrega++;
    entregaEmAndamento = false;
}

function mostrarEfeitoChegada() {
    const camadaAnterior = document.getElementById("efeito-confetes-hevo");

    if (camadaAnterior) {
        camadaAnterior.remove();
    }

    const camada = document.createElement("div");
    camada.id = "efeito-confetes-hevo";
    camada.style.position = "fixed";
    camada.style.inset = "0";
    camada.style.width = "100%";
    camada.style.height = "100%";
    camada.style.overflow = "hidden";
    camada.style.pointerEvents = "none";
    camada.style.zIndex = "2147483647";

    document.body.appendChild(camada);

    if (!document.getElementById("estilo-confetes-hevo")) {
        const estilo = document.createElement("style");
        estilo.id = "estilo-confetes-hevo";
        estilo.textContent = `
            @keyframes hevoConfete {
                from { transform: translateY(0) rotate(0deg); opacity: 1; }
                to { transform: translateY(110vh) rotate(720deg); opacity: 0.9; }
            }
        `;
        document.head.appendChild(estilo);
    }

    const emojis = ["🎉", "🎊", "✨", "🍇", "🟣", "🟡", "🟢", "🔵"];

    for (let i = 0; i < 150; i++) {
        const confete = document.createElement("span");

        confete.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        confete.style.position = "absolute";
        confete.style.left = Math.random() * 100 + "vw";
        confete.style.top = "-50px";
        confete.style.fontSize = (18 + Math.random() * 22) + "px";

        camada.appendChild(confete);

        const duracao = 2000 + Math.random() * 2500;
        const rotacao = Math.random() * 1440;
        const deslocamento = window.innerHeight + 100;

        if (typeof confete.animate === "function") {
            confete.animate(
                [
                    {
                        transform: "translateY(0) rotate(0deg)",
                        opacity: 1
                    },
                    {
                        transform: `translateY(${deslocamento}px) rotate(${rotacao}deg)`,
                        opacity: 0.9
                    }
                ],
                {
                    duration: duracao,
                    easing: "linear",
                    fill: "forwards"
                }
            );
        } else {
            confete.style.animation = "hevoConfete 3s linear forwards";
        }
    }

    setTimeout(() => camada.remove(), 5000);

    alert("🎉 SEU PEDIDO CHEGOU! Obrigado por pedir na HEVO AÇAÍ! 🍇");
}

function simularEntrega(bairroDestino, pedidoConfirmado = false) {
    pararAnimacaoMoto();

    if (!pedidoConfirmado) {
        if (mapaStatusMoto) {
            mapaStatusMoto.textContent = "Aguardando rastreamento";
        }

        if (mapaTempoTexto) {
            mapaTempoTexto.textContent = "Aguardando rastreamento";
        }

        return;
    }

    const destino = coordenadasEntrega[bairroDestino];

    if (!destino) {
        if (mapaStatusMoto) {
            mapaStatusMoto.textContent = "Destino não disponível";
        }

        adicionarTexto(
            resultadoRastreio,
            "Não há coordenadas cadastradas para o bairro deste pedido."
        );
        return;
    }

    if (mapaBairroTexto) {
        mapaBairroTexto.textContent =
            `📍 Destino: ${bairroDestino}, Campo Largo - PR`;
    }

    if (mapaDistancia) {
        mapaDistancia.textContent = `Rota demonstrativa até ${bairroDestino}`;
    }

    if (mapaStatusMoto) {
        mapaStatusMoto.textContent = "Motoboy saindo da loja";
    }

    if (mapaTempoTexto) {
        mapaTempoTexto.textContent = "16 segundos";
    }

    if (!mapaEntrega || !marcadorMoto || !marcadorDestino) {
        const idEntrega = identificadorEntrega;
        entregaEmAndamento = true;

        timerChegada = setTimeout(() => {
            if (idEntrega !== identificadorEntrega) return;

            timerChegada = null;
            entregaEmAndamento = false;

            if (mapaStatusMoto) {
                mapaStatusMoto.textContent = "🎉 Entrega concluída!";
            }

            if (mapaTempoTexto) {
                mapaTempoTexto.textContent = "Chegou!";
            }

            mostrarEfeitoChegada();
        }, DURACAO_ENTREGA);

        return;
    }

    if (linhaRota) {
        mapaEntrega.removeLayer(linhaRota);
        linhaRota = null;
    }

    marcadorDestino.setLatLng(destino);
    marcadorMoto.setLatLng(pontoLoja);

    linhaRota = L.polyline([pontoLoja, destino], {
        color: "#a879f5",
        weight: 5,
        opacity: 0.9,
        dashArray: "9, 10"
    }).addTo(mapaEntrega);

    mapaEntrega.fitBounds(linhaRota.getBounds(), {
        padding: [35, 35],
        maxZoom: 14
    });

    entregaEmAndamento = true;

    const idEntrega = identificadorEntrega;
    const inicio = performance.now();

    animacaoMoto = setInterval(() => {
        if (idEntrega !== identificadorEntrega) {
            clearInterval(animacaoMoto);
            animacaoMoto = null;
            return;
        }

        const tempoDecorrido = performance.now() - inicio;
        const progresso = Math.min(tempoDecorrido / DURACAO_ENTREGA, 1);

        const latitude =
            pontoLoja[0] + (destino[0] - pontoLoja[0]) * progresso;

        const longitude =
            pontoLoja[1] + (destino[1] - pontoLoja[1]) * progresso;

        marcadorMoto.setLatLng([latitude, longitude]);

        if (progresso < 0.35) {
            if (mapaStatusMoto) mapaStatusMoto.textContent = "Saindo da loja";
        } else if (progresso < 0.75) {
            if (mapaStatusMoto) mapaStatusMoto.textContent = "Motoboy em rota";
        } else if (progresso < 1) {
            if (mapaStatusMoto) {
                mapaStatusMoto.textContent = `Chegando a ${bairroDestino}`;
            }
        }

        if (progresso >= 1) {
            clearInterval(animacaoMoto);
            animacaoMoto = null;
            entregaEmAndamento = false;

            marcadorMoto.setLatLng(destino);

            if (mapaStatusMoto) {
                mapaStatusMoto.textContent = "🎉 Entrega concluída!";
            }

            if (mapaDistancia) {
                mapaDistancia.textContent = `Destino: ${bairroDestino}`;
            }

            if (mapaTempoTexto) {
                mapaTempoTexto.textContent = "Chegou!";
            }

            mostrarEfeitoChegada();
        }
    }, INTERVALO_ANIMACAO);
}

formulario.addEventListener("change", evento => {
    if (evento.target.matches('input[name="tamanho"]')) {
        ajustarAdicionaisAoTamanho();
        return;
    }

    if (evento.target.matches('input[name="adicional"]')) {
        const tamanho = selecionado("tamanho");
        if (!tamanho) return;

        const limite = limitesAdicionais[tamanho.value];
        const marcados = adicionaisMarcados();

        if (evento.target.checked && marcados.length > limite) {
            evento.target.checked = false;

            mostrarAviso(
                avisoLimite,
                `Limite atingido! O copo de ${tamanho.value} ml permite até ${limite} adicionais.`
            );
        }

        atualizarEstadoAdicionais();
        atualizarResumo();
        return;
    }

    if (evento.target.matches('input[name="base"]')) {
        atualizarResumo();
    }
});

bairro.addEventListener("change", () => {
    atualizarResumo();

    if (!entregaEmAndamento) {
        if (mapaStatusMoto) {
            mapaStatusMoto.textContent = "Aguardando rastreamento";
        }

        if (mapaTempoTexto) {
            mapaTempoTexto.textContent = "Aguardando rastreamento";
        }

        if (mapaBairroTexto) {
            mapaBairroTexto.textContent = bairro.value
                ? `📍 Destino selecionado: ${bairro.value}`
                : "Selecione um bairro para visualizar a rota simulada.";
        }
    }
});

telefone.addEventListener("input", formatarTelefone);
cliente.addEventListener("input", () => esconderAviso(avisoValidacao));

botaoTema.addEventListener("click", alternarTema);
botaoRecursos.addEventListener("click", alternarRecursos);
confirmar.addEventListener("click", confirmarPedido);
novoPedidoBotao.addEventListener("click", novoPedido);
copiarPedidoBotao.addEventListener("click", copiarPedido);
compartilharPedidoBotao.addEventListener("click", compartilharPedido);
botaoRastrear.addEventListener("click", consultarRastreamento);

campoCodigoRastreio.addEventListener("keydown", evento => {
    if (evento.key === "Enter") {
        evento.preventDefault();
        consultarRastreamento();
    }
});

menuRecursos.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
        menuRecursos.hidden = true;
        botaoRecursos.setAttribute("aria-expanded", "false");
        botaoRecursos.textContent = "☰ Recursos";
    });
});

carregarTema();
botaoRecursos.setAttribute("aria-expanded", "false");
atualizarEstadoAdicionais();
atualizarResumo();

window.addEventListener("load", () => {
    iniciarMapaEntrega();

    setTimeout(() => {
        if (mapaEntrega) {
            mapaEntrega.invalidateSize(true);
        }
    }, 500);
});

formulario.addEventListener("submit", evento => {
    evento.preventDefault();
    confirmarPedido();
});
