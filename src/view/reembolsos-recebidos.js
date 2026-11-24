import React from "react";
import axios from "axios";

import { mensagemErro, mensagemSucesso } from "../components/toastr";
import { obterSessao } from "../config/sessao";
import { BASE_URL } from "../config/axios";
import { listar, porId } from "../utils/api";
import { formatarData, formatarMoeda, hoje } from "../utils/formatar";

const CABECALHO_JSON = { headers: { "Content-Type": "application/json" } };

const ROTULO_STATUS = {
    EM_ANALISE: "Em análise",
    AGUARDANDO_RECEBIMENTO: "Aguardando retorno",
    ESTORNADO: "Estornado",
    RECUSADO: "Recusado",
};

export default function ReembolsosRecebidos() {
    const { empresaId } = obterSessao();

    const [dados, setDados] = React.useState(null);
    const [retornos, setRetornos] = React.useState({});

    React.useEffect(() => {
        Promise.all([
            listar("solicitacoesReembolso"),
            listar("itensReembolso"),
            listar("subpedidos"),
            listar("pedidos"),
            listar("clientes"),
            listar("itensPedido"),
            listar("produtos"),
        ])
            .then(([solicitacoesReembolso, itensReembolso, subpedidos, pedidos, clientes, itensPedido, produtos]) =>
                setDados({ solicitacoesReembolso, itensReembolso, subpedidos, pedidos, clientes, itensPedido, produtos })
            )
            .catch(() => {
                mensagemErro("Erro ao carregar os reembolsos.");
                setDados({
                    solicitacoesReembolso: [], itensReembolso: [], subpedidos: [],
                    pedidos: [], clientes: [], itensPedido: [], produtos: [],
                });
            });
    }, []);

    const linhas = React.useMemo(() => {
        if (!dados) return [];

        const subPorId = porId(dados.subpedidos);
        const pedidosPorId = porId(dados.pedidos);
        const clientesPorId = porId(dados.clientes);
        const itemPedidoPorId = porId(dados.itensPedido);
        const produtosPorId = porId(dados.produtos);

        return dados.solicitacoesReembolso
            .map((sol) => {
                const sub = subPorId.get(String(sol.idSubpedido));
                if (!sub || String(sub.idEmpresa) !== String(empresaId)) return null;

                const pedido = pedidosPorId.get(String(sub.idPedido)) ?? {};
                const cliente = clientesPorId.get(String(pedido.idCliente));

                const itens = dados.itensReembolso
                    .filter((i) => String(i.idSolicitacao) === String(sol.id))
                    .map((i) => {
                        const itemPedido = itemPedidoPorId.get(String(i.idItemPedido)) ?? {};
                        const quantidade = Number(i.quantidade) || 0;
                        return {
                            id: i.id,
                            idProduto: String(itemPedido.idProduto),
                            titulo: produtosPorId.get(String(itemPedido.idProduto))?.titulo ?? "Produto",
                            quantidade,
                            valor: quantidade * (Number(itemPedido.precoUnitario) || 0),
                        };
                    });

                return {
                    sol,
                    subId: sub.id,
                    pedidoId: sub.idPedido,
                    cliente: cliente?.nomeCompleto ?? "—",
                    itens,
                    estorno: itens.reduce((soma, i) => soma + i.valor, 0),
                };
            })
            .filter(Boolean)
            .sort((a, b) => String(b.sol.dataSolicitacao ?? "").localeCompare(String(a.sol.dataSolicitacao ?? "")));
    }, [dados, empresaId]);

    function enviarPut(caminho, objeto) {
        axios
            .put(`${BASE_URL}/${caminho}/${objeto.id}`, objeto, CABECALHO_JSON)
            .catch((erro) => console.error(`Falha ao salvar ${caminho}:`, erro));
    }

    function atualizarSolicitacao(sol, campos) {
        const atualizada = { ...sol, ...campos, dataAtualizacao: hoje() };

        setDados((d) => ({
            ...d,
            solicitacoesReembolso: d.solicitacoesReembolso.map((s) =>
                String(s.id) === String(sol.id) ? atualizada : s
            ),
        }));
        enviarPut("solicitacoesReembolso", atualizada);
    }

    function aprovar(sol) {
        atualizarSolicitacao(sol, { status: "AGUARDANDO_RECEBIMENTO" });
        mensagemSucesso("Reembolso aprovado. Aguardando o retorno do produto.");
    }

    function recusar(sol) {
        atualizarSolicitacao(sol, { status: "RECUSADO", estoqueLiberado: false });
        mensagemSucesso("Reembolso recusado.");
    }

    function confirmarRecebimento(linha) {
        const voltarEstoque = retornos[linha.sol.id] ?? true;

        atualizarSolicitacao(linha.sol, { status: "ESTORNADO", estoqueLiberado: voltarEstoque });

        if (voltarEstoque) {
            const quantidadePorProduto = new Map();
            linha.itens.forEach((i) =>
                quantidadePorProduto.set(i.idProduto, (quantidadePorProduto.get(i.idProduto) ?? 0) + i.quantidade)
            );

            const produtosAtualizados = dados.produtos
                .filter((p) => quantidadePorProduto.has(String(p.id)))
                .map((p) => ({
                    ...p,
                    estoqueQuantidade: (Number(p.estoqueQuantidade) || 0) + quantidadePorProduto.get(String(p.id)),
                }));

            setDados((d) => ({
                ...d,
                produtos: d.produtos.map((p) => produtosAtualizados.find((a) => String(a.id) === String(p.id)) ?? p),
            }));
            produtosAtualizados.forEach((p) => enviarPut("produtos", p));
        }

        mensagemSucesso("Recebimento confirmado.");
    }

    if (dados === null) {
        return <div className="text-center my-4">Carregando reembolsos...</div>;
    }

    return (
        <section className="mk-form-card">
            <h1>Reembolsos Recebidos</h1>
            <p className="mk-form-card__sub">
                Aprove devoluções e decida o retorno dos produtos ao estoque.
            </p>

            <div className="mk-table-card mk-reemb">
                <div className="mk-table-scroll">
                    <table className="mk-table">
                        <thead>
                            <tr>
                                <th scope="col">Subpedido</th>
                                <th scope="col">Cliente / Motivo</th>
                                <th scope="col">Itens</th>
                                <th scope="col">Status atual</th>
                                <th scope="col">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {linhas.map((linha) => {
                                const { sol } = linha;
                                const voltarEstoque = retornos[sol.id] ?? true;

                                return (
                                    <tr key={sol.id}>
                                        <td>
                                            <strong>#{linha.pedidoId}-{linha.subId}</strong>
                                            <small>{formatarData(sol.dataSolicitacao)}</small>
                                        </td>

                                        <td>
                                            <strong>{linha.cliente}</strong>
                                            <small>{sol.motivo}</small>
                                        </td>

                                        <td>
                                            {linha.itens.map((i) => (
                                                <div key={i.id}>
                                                    {i.quantidade}x {i.titulo}
                                                </div>
                                            ))}
                                            <div className="mk-reemb__estorno">
                                                Estorno: {formatarMoeda(linha.estorno)}
                                            </div>
                                        </td>

                                        <td>
                                            <span className={`mk-reemb__status mk-reemb__status--${sol.status}`}>
                                                {ROTULO_STATUS[sol.status] ?? sol.status}
                                            </span>
                                        </td>

                                        <td>
                                            {sol.status === "EM_ANALISE" && (
                                                <div className="mk-reemb__actions">
                                                    <button type="button" className="mk-reemb__btn is-approve" onClick={() => aprovar(sol)}>
                                                        Aprovar
                                                    </button>
                                                    <button type="button" className="mk-reemb__btn is-refuse" onClick={() => recusar(sol)}>
                                                        Recusar
                                                    </button>
                                                </div>
                                            )}

                                            {sol.status === "AGUARDANDO_RECEBIMENTO" && (
                                                <div className="mk-reemb__actions is-column">
                                                    <label className="mk-reemb__check">
                                                        <input
                                                            type="checkbox"
                                                            checked={voltarEstoque}
                                                            onChange={(e) =>
                                                                setRetornos((r) => ({ ...r, [sol.id]: e.target.checked }))
                                                            }
                                                        />
                                                        Devolver ao estoque
                                                    </label>
                                                    <button
                                                        type="button"
                                                        className="mk-reemb__btn is-confirm"
                                                        onClick={() => confirmarRecebimento(linha)}
                                                    >
                                                        Confirmar recebimento
                                                    </button>
                                                </div>
                                            )}

                                            {(sol.status === "ESTORNADO" || sol.status === "RECUSADO") && (
                                                <span className="mk-muted">
                                                    {sol.status === "ESTORNADO"
                                                        ? sol.estoqueLiberado ? "Concluído, item devolvido ao estoque" : "Concluído, sem retorno ao estoque"
                                                        : "Reembolso recusado"}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {linhas.length === 0 && (
                        <div className="mk-table-empty">Nenhuma solicitação de reembolso no momento.</div>
                    )}
                </div>
            </div>
        </section>
    );
}