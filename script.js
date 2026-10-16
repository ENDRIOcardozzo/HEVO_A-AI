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

const limitesAdicionais = {
    "300": 2,
    "500": 4,
    "700": 6,
    "1000": 8
};

let ultimoPedido = "";

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
    if (!bairro.value) {
        return 0;
    }

    return bairro.value === "Centro" ? 5 : 10;
}

function calcularTempoEntrega() {
    if (!bairro.value) {
        return "";
    }

    return bairro.value === "Centro"
        ? "25 a 40 minutos"
        : "35 a 60 minutos";
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

    if (!tamanho || !cobertura) {
        return null;
    }

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

    const total = itens.reduce(
        (soma, item) => soma + item.preco,
        0
    );

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

    if (!pedido) {
        return;
    }

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

    if (!tamanho) {
        return;
    }

    const limite = limitesAdicionais[tamanho.value];
    const quantidade = adicionaisMarcados().length;

    document.querySelectorAll('input[name="adicional"]').forEach(item => {
        item.disabled = !item.checked && quantidade >= limite;
    });
}

function ajustarAdicionaisAoTamanho() {
    const tamanho = selecionado("tamanho");

    if (!tamanho) {
        return;
    }

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
        telefone.value =
            `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
    } else {
        telefone.value =
            `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
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
        ...pedido.itens.map(item =>
            `${item.nome}: ${dinheiro(item.preco)}`
        ),
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
    const numero = Math.floor(100000 + Math.random() * 900000);
    return `HEVO-${numero}`;
}

function salvarPedido(pedido) {
    try {
        const pedidos = JSON.parse(
            localStorage.getItem("hevo-pedidos") || "[]"
        );

        pedidos.push(pedido);

        localStorage.setItem(
            "hevo-pedidos",
            JSON.stringify(pedidos)
        );

        return true;
    } catch {
        return false;
    }
}

function confirmarPedido() {
    const pedido = obterPedido();

    if (!pedido || !validarPedido(pedido)) {
        return;
    }

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
    if (!ultimoPedido) {
        return;
    }

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
    if (!ultimoPedido) {
        return;
    }

    if (navigator.share) {
        try {
            await navigator.share({
                title: "Pedido HEVO AÇAÍ",
                text: ultimoPedido
            });
            return;
        } catch (erro) {
            if (erro.name === "AbortError") {
                return;
            }
        }
    }

    const copiado = await copiarTexto(ultimoPedido);

    mensagemConfirmacao.textContent = copiado
        ? "Pedido copiado! Você já pode colar no aplicativo de mensagens."
        : "Não foi possível compartilhar ou copiar automaticamente.";
}

function novoPedido() {
    formulario.reset();

    document.querySelector('input[name="tamanho"][value="500"]').checked = true;
    document.querySelector('input[name="base"][value="Chocolate"]').checked = true;

    ultimoPedido = "";
    resultado.hidden = true;
    mensagemConfirmacao.textContent = "";
    codigoPedidoElemento.textContent = "";
    previsaoConfirmacao.textContent = "";

    esconderAviso(avisoLimite);
    esconderAviso(avisoValidacao);

    atualizarEstadoAdicionais();
    atualizarResumo();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function aplicarTema(temaClaro) {
    document.body.classList.toggle("tema-claro", temaClaro);

    botaoTema.textContent = temaClaro ? "🌙" : "☀️";

    botaoTema.setAttribute(
        "aria-label",
        temaClaro ? "Ativar tema escuro" : "Ativar tema claro"
    );
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

    botaoRecursos.setAttribute(
        "aria-expanded",
        String(!menuRecursos.hidden)
    );

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
        adicionarTexto(
            resultadoRastreio,
            "Digite o código do pedido para consultar."
        );
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
        "Esta consulta verifica apenas o pedido salvo neste navegador. Não mostra a localização do entregador nem confirma o recebimento pela loja."
    );
}

formulario.addEventListener("change", evento => {
    if (evento.target.matches('input[name="tamanho"]')) {
        ajustarAdicionaisAoTamanho();
        return;
    }

    if (evento.target.matches('input[name="adicional"]')) {
        const tamanho = selecionado("tamanho");
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

bairro.addEventListener("change", atualizarResumo);
telefone.addEventListener("input", formatarTelefone);

cliente.addEventListener("input", () => {
    esconderAviso(avisoValidacao);
});

bairro.addEventListener("change", () => {
    esconderAviso(avisoValidacao);
});

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