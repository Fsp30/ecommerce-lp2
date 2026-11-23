import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import PageHeader from "../components/page-header";
import { mensagemErro, mensagemSucesso } from "../components/toastr";
import { BASE_URL } from "../config/axios";
import { listar, porId } from "../utils/api";
import { formatarMoeda, hoje } from "../utils/formatar";

const PARCELAS_MAX = 10;

const FORMAS = [
    { id: "CARTAO", titulo: "Cartão de Crédito Salvo", detalhe: "Pagamento aprovado na hora" },
    { id: "PIX", titulo: "PIX (Aprovação Imediata)", detalhe: "Liberação instantânea do pedido e nota fiscal" },
    { id: "BOLETO", titulo: "Boleto Bancário", detalhe: "Vencimento em 3 dias úteis" },
];

async function criarRegistro(recurso, dados) {
    const existentes = await listar(recurso);
    const proximoId =
        existentes.reduce((maior, r) => Math.max(maior, Number(r.id) || 0), 0) + 1;

    const corpo = { id: proximoId, ...dados };

    const resposta = await axios.post(`${BASE_URL}/${recurso}`, corpo, {
        headers: { "Content-Type": "application/json" },
    });

    const criado = resposta.data?.id != null ? resposta.data : corpo;

    if (criado?.id == null) {
        throw new Error(`Não foi possível obter o id de ${recurso}.`);
    }

    return criado;
}

function montarTotais(itens) {
    const subtotal = itens.reduce((soma, i) => soma + i.subtotal, 0);
    const frete = itens.every((i) => i.freteGratis) ? 0 : 0;
    return { subtotal, frete, total: subtotal + frete };
}

function gerarCodigoPagamento(forma) {
    const digitos = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join("");

    if (forma === "PIX") {
        return `00020126580014br.gov.bcb.pix${digitos(40)}`;
    }

    if (forma === "BOLETO") {
        return digitos(47).replace(
            /^(\d{5})(\d{5})(\d{5})(\d{6})(\d{5})(\d{6})(\d)(\d{14})$/,
            "$1.$2 $3.$4 $5.$6 $7 $8"
        );
    }

    return null;
}

export default function Checkout() {
    const { idParam } = useParams();
    const navigate = useNavigate();
    const [idClienteCarrinho, setIdClienteCarrinho] = React.useState(null);

    const [carregando, setCarregando] = React.useState(true);
    const [cliente, setCliente] = React.useState(null);
    const [itens, setItens] = React.useState([]);
    const [cartoes, setCartoes] = React.useState([]);
    const [forma, setForma] = React.useState("CARTAO");
    const [idCartao, setIdCartao] = React.useState(null);
    const [enviando, setEnviando] = React.useState(false);

    React.useEffect(() => {
        async function carregar() {
            try {
                const carrinho = await axios.get(`${BASE_URL}/carrinhos/${idParam}`);
                const idCliente = carrinho.data?.idCliente;

                if (idCliente === undefined || idCliente === null) {
                    mensagemErro("Carrinho não encontrado.");
                    setCarregando(false);
                    return;
                }

                const [todosItens, produtos, cliente, todosCartoes] = await Promise.all([
                    listar("itensCarrinho"),
                    listar("produtos"),
                    axios.get(`${BASE_URL}/clientes/${idCliente}`).then((r) => r.data),
                    listar("cartoes"),
                ]);

                const produtosPorId = porId(produtos);

                const doCarrinho = todosItens
                    .filter((i) => String(i.idCarrinho) === String(idParam))
                    .map((i) => {
                        const produto = produtosPorId.get(String(i.idProduto));
                        const preco = Number(produto?.precoPromocional ?? produto?.preco ?? 0);
                        const quantidade = Number(i.quantidade) || 1;
                        return {
                            id: i.id,
                            idProduto: i.idProduto,
                            idEmpresa: produto?.empresa,
                            titulo: produto?.titulo ?? "Produto indisponível",
                            preco,
                            custoUnitario: Number(produto?.custo ?? 0),
                            quantidade,
                            subtotal: preco * quantidade,
                            freteGratis: Boolean(produto?.freteGratis),
                        };
                    });

                const meusCartoes = todosCartoes.filter(
                    (c) => String(c.idCliente) === String(idCliente) && c.status !== "REMOVIDO"
                );

                setIdClienteCarrinho(String(idCliente));
                setCliente(cliente);
                setItens(doCarrinho);
                setCartoes(meusCartoes);
                setIdCartao(meusCartoes[0]?.id ?? null);
                setForma(meusCartoes.length > 0 ? "CARTAO" : "PIX");
            } catch {
                mensagemErro("Erro ao carregar o checkout.");
            } finally {
                setCarregando(false);
            }
        }

        carregar();
    }, [idParam]);

    const totais = React.useMemo(() => montarTotais(itens), [itens]);
    const parcela = totais.total / PARCELAS_MAX;
    const cartaoEscolhido = cartoes.find((c) => c.id === idCartao);

    async function finalizar() {
        if (itens.length === 0) {
            mensagemErro("Seu carrinho está vazio.");
            return;
        }
        if (forma === "CARTAO" && !cartaoEscolhido) {
            mensagemErro("Selecione um cartão para pagar.");
            return;
        }
        if (enviando) return;
        setEnviando(true);

        try {
            const codigoPagamento = gerarCodigoPagamento(forma);

            const pedido = await criarRegistro("pedidos", {
                idCliente: Number(idClienteCarrinho),
                enderecoEntrega: {
                    logradouro: cliente?.logradouro ?? "",
                    cep: cliente?.cep ?? "",
                    numeroResidencial: cliente?.numeroResidencial ?? "",
                    complemento: cliente?.complemento ?? "",
                    bairro: cliente?.bairro ?? "",
                    cidade: cliente?.cidade ?? "",
                    uf: cliente?.uf ?? "",
                },
                subtotalGeral: totais.subtotal,
                   freteGeral: totais.frete,
                   totalGeral: totais.total,
                   dataPedido: hoje(),
                   formaPagamento: forma,
                   statusPagamento: forma === "CARTAO" ? "PAGO" : "PENDENTE",
                   codigoPagamento,
            });

            if (pedido?.id == null) {
                throw new Error("Pedido criado sem id.");
            }

            const porEmpresa = new Map();
            itens.forEach((i) => {
                const chave = String(i.idEmpresa);
                porEmpresa.set(chave, [...(porEmpresa.get(chave) ?? []), i]);
            });

            for (const [idEmpresa, itensDaEmpresa] of porEmpresa) {
                const subtotal = itensDaEmpresa.reduce((s, i) => s + i.subtotal, 0);
                const frete = 0;

                const subpedido = await criarRegistro("subpedidos", {
                    idPedido: pedido.id,
                    idEmpresa: Number(idEmpresa),
                    subtotal,
                    valorFrete: frete,
                    valorTotal: subtotal + frete,
                    formaPagamento: forma,
                    idCartao: forma === "CARTAO" ? idCartao : null,
                    parcelas: forma === "CARTAO" ? 1 : 1,
                    statusPagamento: forma === "CARTAO" ? "PAGO" : "PENDENTE",
                    statusOperacional: "PEDIDO_CONFIRMADO",
                    previsaoEntrega: null,
                    dataEnvio: null,
                    dataEntregaEfetiva: null,
                    transportadora: null,
                    codigoRastreio: null,
                    historicoRastreio: [
                        { status: "PEDIDO_CONFIRMADO", data: new Date().toISOString() },
                    ],
                });



                for (const item of itensDaEmpresa) {
                    await criarRegistro("itensPedido", {
                        idSubpedido: subpedido.id,
                        idProduto: item.idProduto,
                        quantidade: item.quantidade,
                        precoUnitario: item.preco,
                        custoUnitario: item.custoUnitario ?? 0,
                    });

                    const url = `${BASE_URL}/produtos/${item.idProduto}`;
                    const produtoAtual = await axios.get(url);
                    await axios.put(url, {
                        ...produtoAtual.data,
                        estoqueQuantidade: Math.max(
                            0,
                            Number(produtoAtual.data.estoqueQuantidade) - item.quantidade
                        ),
                    });
                }
            }

            for (const item of itens) {
                await axios.delete(`${BASE_URL}/itensCarrinho/${item.id}`);
            }

            mensagemSucesso(`Pedido #${pedido.id} realizado com sucesso!`);
            navigate(`/pedido-registrado/${pedido.id}`, { state: { pedido } });
        } catch (error) {
            console.error("Falha ao finalizar pedido:", error.response?.status, error.response?.data);
            mensagemErro(error.response?.data?.error ?? "Erro ao finalizar o pedido.");
        } finally {
            setEnviando(false);
        }
    }

    if (carregando) {
        return <div className="text-center my-4">Carregando checkout...</div>;
    }

    if (itens.length === 0) {
        return (
            <>
                <PageHeader trail={["Checkout"]} title="Checkout" />
                <div className="mk-empty">Seu carrinho está vazio.</div>
            </>
        );
    }

    return (
        <>
            <PageHeader trail={["Carrinho", "Checkout"]} title="Finalizar Compra" />

            <div className="mk-checkout">
                <div className="mk-checkout__steps">
                    <section className="mk-step">
                        <header className="mk-step__head">
                            <span className="mk-step__num">1</span>
                            <h2>Endereço de Entrega</h2>
                            <button type="button" className="mk-step__action" onClick={() => navigate(`/cadastro-cliente/${idClienteCarrinho}`)}>
                                Alterar
                            </button>
                        </header>

                        <div className="mk-address">
                            <strong>{cliente?.nomeCompleto ?? "—"}</strong>
                            <span>
                                {cliente?.logradouro}, {cliente?.numeroResidencial}
                                {cliente?.complemento ? ` — ${cliente.complemento}` : ""}
                                {cliente?.bairro ? ` — ${cliente.bairro}` : ""}, {cliente?.cidade}/{cliente?.uf}
                                {cliente?.cep ? ` — CEP: ${cliente.cep}` : ""}
                            </span>
                        </div>
                    </section>

                    <section className="mk-step">
                        <header className="mk-step__head">
                            <span className="mk-step__num">2</span>
                            <h2>Forma de Pagamento</h2>
                        </header>

                        <div className="mk-payments">
                            {FORMAS.map((f) => {
                                const desabilitada = f.id === "CARTAO" && cartoes.length === 0;
                                const ativa = forma === f.id;

                                return (
                                    <label
                                        key={f.id}
                                        className={`mk-pay ${ativa ? "is-active" : ""} ${desabilitada ? "is-disabled" : ""}`}
                                    >
                                        <input
                                            type="radio"
                                            name="forma"
                                            value={f.id}
                                            checked={ativa}
                                            disabled={desabilitada}
                                            onChange={() => setForma(f.id)}
                                        />
                                        <div className="mk-pay__text">
                                            <strong>{f.titulo}</strong>
                                            {f.id === "CARTAO" && cartaoEscolhido ? (
                                                <small>
                                                    {cartaoEscolhido.apelido || cartaoEscolhido.bandeira} final{" "}
                                                    {String(cartaoEscolhido.numeroHash).slice(-4)} • Titular:{" "}
                                                    {cartaoEscolhido.nomeTitular} • Venc:{" "}
                                                    {String(cartaoEscolhido.validadeMes).padStart(2, "0")}/
                                                    {String(cartaoEscolhido.validadeAno).slice(-2)}
                                                </small>
                                            ) : f.id === "CARTAO" ? (
                                                <small>Nenhum cartão salvo. Cadastre um cartão para usar essa opção.</small>
                                            ) : (
                                                <small>{f.detalhe}</small>
                                            )}
                                        </div>

                                        {f.id === "CARTAO" && cartoes.length > 1 && ativa && (
                                            <select
                                                className="mk-pay__select"
                                                value={idCartao ?? ""}
                                                onChange={(e) => setIdCartao(Number(e.target.value))}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {cartoes.map((c) => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.apelido || c.bandeira} final {String(c.numeroHash).slice(-4)}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </label>
                                );
                            })}
                        </div>
                    </section>
                </div>

                <aside className="mk-checkout__summary">
                    <h2>Total da Compra</h2>

                    {itens.map((i) => (
                        <div key={i.id} className="mk-summary-row">
                            <span>
                                {i.titulo} ({i.quantidade}x)
                            </span>
                            <strong>{formatarMoeda(i.subtotal)}</strong>
                        </div>
                    ))}

                    <div className="mk-summary-row">
                        <span>Frete</span>
                        {totais.frete === 0 ? <strong className="mk-ok">GRÁTIS</strong> : <strong>{formatarMoeda(totais.frete)}</strong>}
                    </div>

                    <div className="mk-summary-total">
                        <span>Total a Pagar</span>
                        <div>
                            <strong>{formatarMoeda(totais.total)}</strong>
                            <small>ou {PARCELAS_MAX}x de {formatarMoeda(parcela)} sem juros</small>
                        </div>
                    </div>

                    <button type="button" className="btn btn-warning w-100" onClick={finalizar} disabled={enviando}>
                        {enviando ? "Processando..." : "Finalizar e Pagar Pedido"}
                    </button>

                    <p className="mk-summary-note">Ao clicar, o estoque é reservado e a transação é processada.</p>
                </aside>
            </div>
        </>
    );
}
