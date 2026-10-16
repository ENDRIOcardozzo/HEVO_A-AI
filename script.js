"use strict";

const tamanho = document.getElementById("tamanho");
const cliente = document.getElementById("cliente");
const telefone = document.getElementById("telefone");
const bairro = document.getElementById("bairro");
const observacoes = document.getElementById("observacoes");
const adicionais = document.querySelectorAll('input[name="adicional"]');
const resumo = document.getElementById("resumo");
const total = document.getElementById("total");
const confirmar = document.getElementById("confirmar");
const novo = document.getElementById("novo");
const tema = document.getElementById("tema");
const rastreamento = document.getElementById("rastreamento");

const limitesAdicionais = {
    pequeno: 2,
    medio: 3,
    grande: 4
};

const coordenadasEntrega = {
    loja: [-25.458, -49.527],
    Centro: [-25.4589, -49.5278],
    Vila: [-25.449, -49.519],
    Jardim: [-25.466, -49.515],
    Industrial: [-25.470, -49.540],
    default: [-25.4589, -49.5278]
};

let ultimoPedido = null;
let mapaEntrega = null;
let marcadorMoto = null;
let marcadorDestino = null;
let linhaRota = null;
let animacaoMoto = null;
let timerChegada = null;
let identificadorEntrega = 0;

function dinheiro(valor) {
    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function selecionado(nome) {
    const campo = document.querySelector(
        'input[name="' + nome + '"]:checked'
    );

    return campo ? campo.value : "";
}

function adicionaisMarcados() {
    return Array.from(adicionais)
        .filter(function (item) {
            return item.checked;
        });
}

function calcularTaxa() {
    if (!bairro || !bairro.value) {
        return 0;
    }

    const opcao = bairro.options[bairro.selectedIndex];

    if (!opcao) {
        return 0;
    }

    return Number(opcao.dataset.taxa || 0);
}

function calcularTempo() {
    if (!bairro || !bairro.value) {
        return 0;
    }

    const opcao = bairro.options[bairro.selectedIndex];

    if (!opcao) {
        return 0;
    }

    return Number(opcao.dataset.tempo || 0);
}

function calcularTotal() {
    const opcaoTamanho = tamanho
        ? tamanho.options[tamanho.selectedIndex]
        : null;

    let valor = opcaoTamanho
        ? Number(opcaoTamanho.dataset.preco || 0)
        : 0;

    adicionaisMarcados().forEach(function (item) {
        valor += Number(item.dataset.preco || 0);
    });

    valor += calcularTaxa();

    return valor;
}

function atualizarResumo() {
    if (!resumo || !total) {
        return;
    }

    const opcaoTamanho = tamanho
        ? tamanho.options[tamanho.selectedIndex]
        : null;

    const nomeTamanho = opcaoTamanho
        ? opcaoTamanho.textContent
        : "Não selecionado";

    const escolhidos = adicionaisMarcados();

    resumo.innerHTML = `
        <p><strong>Tamanho:</strong> ${nomeTamanho}</p>
        <p><strong>Adicionais:</strong>
            ${escolhidos.length
                ? escolhidos.map(function (item) {
                    return item.value;
                }).join(", ")
                : "Nenhum"}
        </p>
        <p><strong>Entrega:</strong>
            ${bairro && bairro.value
                ? bairro.options[bairro.selectedIndex].textContent
                : "Não selecionado"}
        </p>
    `;

    total.textContent = dinheiro(calcularTotal());
}

function atualizarLimiteAdicionais() {
    const tamanhoEscolhido = tamanho ? tamanho.value : "";
    const limite = limitesAdicionais[tamanhoEscolhido];

    if (!limite) {
        return;
    }

    const marcados = adicionaisMarcados();

    adicionais.forEach(function (item) {
        item.disabled =
            !item.checked && marcados.length >= limite;
    });
}

function atualizarTela() {
    atualizarLimiteAdicionais();
    atualizarResumo();
}
function validarPedido() {
    if (!tamanho || !tamanho.value) {
        alert("Selecione o tamanho do açaí.");
        return false;
    }

    if (!cliente || !cliente.value.trim()) {
        alert("Digite seu nome.");
        return false;
    }

    if (!telefone || !telefone.value.trim()) {
        alert("Digite seu telefone.");
        return false;
    }

    if (!bairro || !bairro.value) {
        alert("Selecione seu bairro.");
        return false;
    }

    const limite = limitesAdicionais[tamanho.value];

    if (
        limite !== undefined &&
        adicionaisMarcados().length > limite
    ) {
        alert("Você selecionou adicionais demais para esse tamanho.");
        return false;
    }

    return true;
}

function gerarCodigo() {
    return "HEVO-" +
        Math.random().toString(36).substring(2, 7).toUpperCase();
}

function montarPedido() {
    const opcaoTamanho = tamanho.options[tamanho.selectedIndex];
    const itens = [];

    itens.push({
        nome: opcaoTamanho.textContent,
        preco: Number(opcaoTamanho.dataset.preco || 0)
    });

    adicionaisMarcados().forEach(function (item) {
        itens.push({
            nome: item.value,
            preco: Number(item.dataset.preco || 0)
        });
    });

    const taxa = calcularTaxa();

    itens.push({
        nome: bairro.options[bairro.selectedIndex].textContent,
        preco: taxa
    });

    return {
        codigo: gerarCodigo(),
        tamanho: tamanho.value,
        cliente: cliente.value.trim(),
        telefone: telefone.value.trim(),
        bairro: bairro.value,
        observacoes: observacoes
            ? observacoes.value.trim()
            : "",
        itens: itens,
        total: itens.reduce(function (soma, item) {
            return soma + item.preco;
        }, 0),
        tempo: calcularTempo(),
        data: new Date().toLocaleString("pt-BR")
    };
}

function salvarPedido(pedido) {
    try {
        localStorage.setItem(
            "hevoUltimoPedido",
            JSON.stringify(pedido)
        );
    } catch (erro) {
        console.error("Não foi possível salvar o pedido.", erro);
    }
}

function confirmarPedido() {
    if (!validarPedido()) {
        return;
    }

    ultimoPedido = montarPedido();
    salvarPedido(ultimoPedido);

    const mensagem =
        "Pedido confirmado com sucesso!\n\n" +
        "Código: " + ultimoPedido.codigo + "\n" +
        "Cliente: " + ultimoPedido.cliente + "\n" +
        "Total: " + dinheiro(ultimoPedido.total) + "\n\n" +
        "Acompanhe a entrega pelo mapa.";

    alert(mensagem);

    if (rastreamento) {
        rastreamento.style.display = "block";
    }

    simularEntrega(ultimoPedido.bairro);
}

function copiarTexto(texto) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto)
            .then(function () {
                alert("Pedido copiado!");
            })
            .catch(function () {
                alert(texto);
            });
    } else {
        alert(texto);
    }
}

function compartilharPedido() {
    if (!ultimoPedido) {
        alert("Confirme um pedido primeiro.");
        return;
    }

    const texto =
        "HEVO AÇAÍ\n" +
        "Pedido: " + ultimoPedido.codigo + "\n" +
        "Cliente: " + ultimoPedido.cliente + "\n" +
        "Total: " + dinheiro(ultimoPedido.total);

    if (navigator.share) {
        navigator.share({
            title: "Pedido HEVO AÇAÍ",
            text: texto
        }).catch(function () {});
    } else {
        copiarTexto(texto);
    }
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
}

function iniciarMapaEntrega() {
    const elementoMapa = document.getElementById("mapaEntrega");

    if (!elementoMapa || typeof L === "undefined") {
        return;
    }

    if (mapaEntrega) {
        mapaEntrega.invalidateSize();
        return;
    }

    mapaEntrega = L.map("mapaEntrega").setView(
        coordenadasEntrega.loja,
        14
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap"
    }).addTo(mapaEntrega);

    marcadorMoto = L.marker(coordenadasEntrega.loja)
        .addTo(mapaEntrega)
        .bindPopup("🏍️ Moto da HEVO AÇAÍ");

    marcadorDestino = L.marker(coordenadasEntrega.loja)
        .addTo(mapaEntrega)
        .bindPopup("📍 Destino da entrega");

    linhaRota = L.polyline(
        [coordenadasEntrega.loja],
        {
            color: "#7c3aed",
            weight: 5
        }
    ).addTo(mapaEntrega);
}

function mostrarEfeitoChegada() {
    const camada = document.createElement("div");

    camada.style.position = "fixed";
    camada.style.inset = "0";
    camada.style.pointerEvents = "none";
    camada.style.zIndex = "99999";
    camada.style.overflow = "hidden";

    document.body.appendChild(camada);

    const emojis = ["🎉", "🎊", "🍇", "💜", "✨", "🥳"];

    for (let i = 0; i < 50; i++) {
        const confete = document.createElement("span");

        confete.textContent =
            emojis[Math.floor(Math.random() * emojis.length)];

        confete.style.position = "absolute";
        confete.style.left = Math.random() * 100 + "%";
        confete.style.top = "-40px";
        confete.style.fontSize =
            18 + Math.random() * 22 + "px";

        confete.style.animation =
            "hevoConfete " +
            (2 + Math.random() * 3) +
            "s linear forwards";

        camada.appendChild(confete);
    }

    if (!document.getElementById("hevoEstiloConfete")) {
        const estilo = document.createElement("style");

        estilo.id = "hevoEstiloConfete";
        estilo.textContent = `
            @keyframes hevoConfete {
                to {
                    transform: translateY(110vh) rotate(720deg);
                    opacity: 0;
                }
            }
        `;

        document.head.appendChild(estilo);
    }

    setTimeout(function () {
        alert("🎉 SEU PEDIDO CHEGOU! Obrigado por pedir na HEVO AÇAÍ! 🍇");
    }, 400);

    setTimeout(function () {
        camada.remove();
    }, 5500);
}

function simularEntrega(bairroEscolhido) {
    pararAnimacaoMoto();

    const idDestaEntrega = ++identificadorEntrega;

    iniciarMapaEntrega();

    if (!mapaEntrega || !marcadorMoto || !marcadorDestino) {
        return;
    }

    const destino =
        coordenadasEntrega[bairroEscolhido] ||
        coordenadasEntrega.default;

    const origem = coordenadasEntrega.loja;

    marcadorMoto.setLatLng(origem);
    marcadorDestino.setLatLng(destino);

    const rota = [
        origem,
        [
            (origem[0] + destino[0]) / 2 + 0.002,
            (origem[1] + destino[1]) / 2
        ],
        destino
    ];

    linhaRota.setLatLngs(rota);

    mapaEntrega.fitBounds(
        L.latLngBounds([origem, destino]),
        { padding: [30, 30] }
    );

    const passos = 80;
    let passoAtual = 0;

    animacaoMoto = setInterval(function () {
        if (idDestaEntrega !== identificadorEntrega) {
            pararAnimacaoMoto();
            return;
        }

        passoAtual++;

        const progresso = passoAtual / passos;
        const latitude = origem[0] +
            (destino[0] - origem[0]) * progresso;
        const longitude = origem[1] +
            (destino[1] - origem[1]) * progresso;

        marcadorMoto.setLatLng([latitude, longitude]);

        if (passoAtual >= passos) {
            pararAnimacaoMoto();

            marcadorMoto.setLatLng(destino);
            marcadorDestino.openPopup();

            mostrarEfeitoChegada();
        }
    }, 200);
}
function novoPedido() {
    pararAnimacaoMoto();
    identificadorEntrega++;

    ultimoPedido = null;

    if (tamanho) tamanho.selectedIndex = 0;
    if (cliente) cliente.value = "";
    if (telefone) telefone.value = "";
    if (bairro) bairro.selectedIndex = 0;
    if (observacoes) observacoes.value = "";

    adicionais.forEach(function (item) {
        item.checked = false;
        item.disabled = false;
    });

    if (rastreamento) {
        rastreamento.style.display = "none";
    }

    if (mapaEntrega && marcadorMoto && marcadorDestino) {
        marcadorMoto.setLatLng(coordenadasEntrega.loja);
        marcadorDestino.setLatLng(coordenadasEntrega.loja);

        if (linhaRota) {
            linhaRota.setLatLngs([coordenadasEntrega.loja]);
        }

        mapaEntrega.setView(coordenadasEntrega.loja, 14);
    }

    atualizarTela();
}

function alternarTema() {
    document.body.classList.toggle("modo-escuro");

    const escuro = document.body.classList.contains("modo-escuro");

    try {
        localStorage.setItem("hevoTemaEscuro", escuro ? "sim" : "nao");
    } catch (erro) {}
}

function carregarTema() {
    try {
        if (localStorage.getItem("hevoTemaEscuro") === "sim") {
            document.body.classList.add("modo-escuro");
        }
    } catch (erro) {}
}

function consultarRastreamento() {
    if (!ultimoPedido) {
        alert("Você ainda não confirmou um pedido.");
        return;
    }

    alert(
        "📦 Acompanhe seu pedido!\n\n" +
        "Código: " + ultimoPedido.codigo + "\n" +
        "Bairro: " + ultimoPedido.bairro + "\n" +
        "Tempo estimado: aproximadamente 16 segundos na demonstração."
    );

    if (mapaEntrega) {
        mapaEntrega.invalidateSize();
    }
}

document.addEventListener("DOMContentLoaded", function () {
    carregarTema();
    atualizarTela();

    iniciarMapaEntrega();

    if (tamanho) {
        tamanho.addEventListener("change", atualizarTela);
    }

    adicionais.forEach(function (item) {
        item.addEventListener("change", atualizarTela);
    });

    if (bairro) {
        bairro.addEventListener("change", atualizarTela);
    }

    if (confirmar) {
        confirmar.addEventListener("click", confirmarPedido);
    }

    if (novo) {
        novo.addEventListener("click", novoPedido);
    }

    if (tema) {
        tema.addEventListener("click", alternarTema);
    }

    const botaoCompartilhar =
        document.getElementById("compartilharPedido");

    if (botaoCompartilhar) {
        botaoCompartilhar.addEventListener(
            "click",
            compartilharPedido
        );
    }

    const botaoRastreamento =
        document.getElementById("consultarRastreamento");

    if (botaoRastreamento) {
        botaoRastreamento.addEventListener(
            "click",
            consultarRastreamento
        );
    }
});
