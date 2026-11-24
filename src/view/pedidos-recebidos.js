import React from "react";
import axios from "axios";

import { mensagemErro, mensagemSucesso } from "../components/toastr";
import { obterSessao } from "../config/sessao";
import { BASE_URL } from "../config/axios";
import { listar, porId } from "../utils/api";
import { formatarData, formatarMoeda, hoje, rotuloStatus } from "../utils/formatar";

const CABECALHO_JSON = { headers: { "Content-Type": "application/json" } };

// Ordem das etapas. Só é permitido avançar, nunca voltar.
const ETAPAS = ["PEDIDO_CONFIRMADO", "EM_SEPARACAO", "EM_PREPARACAO", "ENVIADO", "ENTREGUE"];

export default function PedidosRecebidos() {
    const { empresaId } = obterSessao();

    const [dados, setDados] = React.useState(null);
    const [filtro, setFiltro] = React.useState("");
    const [rascunhos, setRascunhos] = React.useState({});

    React.useEffect(() => {
        Promise.all([
            listar("subpedidos"),
            listar("pedidos"),
            listar("clientes"),
            listar("itensPedido"),
            listar("produtos"),
        ])
            .then(([subpedidos, pedidos, clientes, itensPedido, produtos]) =>
                setDados({ subpedidos, pedidos, clientes, itensPedido, produtos })
            )
            .catch(() => {
                mensagemErro("Erro ao carregar os pedidos recebidos.");
                setDados({ subpedidos: [], pedidos: [], clientes: [], itensPedido: [], produtos: [] });
            });
    }, []);

    const linhas = React.useMemo(() => {
        if (!dados) return [];

        const pedidosPorId = porId(dados.pedidos);
        const clientesPorId = porId(dados.clientes);
        const produtosPorId = porId(dados.produtos);

        return dados.subpedidos
            .filter((s) => String(s.idEmpresa) === String(empresaId))
            .map((s) => {
                const pedido = pedidosPorId.get(String(s.idPedido)) ?? {};
                const cliente = clientesPorId.get(String(pedido.idCliente));

                const itens = dados.itensPedido
                    .filter((i) => String(i.idSubpedido) === String(s.id))
                    .map((i) => ({
                        id: i.id,
                        titulo: produtosPorId.get(String(i.idProduto))?.titulo ?? `Produto #${i.idProduto}`,
                        quantidade: Number(i.quantidade) || 0,
                    }));

                return {
                    sub: s,
                    pedidoId: s.idPedido,
                    dataPedido: pedido.dataPedido,
                    cliente: cliente?.nomeCompleto ?? "—",
                    local: cliente ? [cliente.cidade, cliente.uf].filter(Boolean).join(" / ") : "",
                    itens,
                };
            })
            .sort((a, b) => String(b.dataPedido ?? "").localeCompare(String(a.dataPedido ?? "")));
    }, [dados, empresaId]);

    const visiveis = linhas.filter((l) => !filtro || l.sub.statusOperacional === filtro);

    function escolherStatus(sub, novo) {
        setRascunhos((r) => ({ ...r, [sub.id]: novo }));
    }

    function salvar(sub) {
        const novo = rascunhos[sub.id] ?? sub.statusOperacional;
        if (novo === sub.statusOperacional) return;

        const agora = new Date().toISOString().slice(0, 19);
        const atualizado = {
            ...sub,
            statusOperacional: novo,
            ...(novo === "ENVIADO" && !sub.dataEnvio ? { dataEnvio: hoje() } : {}),
            ...(novo === "ENTREGUE" ? { dataEntregaEfetiva: hoje() } : {}),
            historicoRastreio: [...(sub.historicoRastreio ?? []), { status: novo, data: agora }],
        };

        setDados((d) => ({
            ...d,
            subpedidos: d.subpedidos.map((s) => (String(s.id) === String(sub.id) ? atualizado : s)),
        }));
        setRascunhos((r) => {
            const { [sub.id]: _removido, ...resto } = r;
            return resto;
        });

        axios
            .put(`${BASE_URL}/subpedidos/${sub.id}`, atualizado, CABECALHO_JSON)
            .catch((erro) => console.error("Falha ao salvar subpedido:", erro));

        mensagemSucesso(`Pedido #${sub.idPedido} atualizado: ${rotuloStatus(novo)}.`);
    }

    if (dados === null) {
        return <div className="text-center my-4">Carregando pedidos...</div>;
    }

    return (
        <section className="mk-form-card">
            <div className="mk-recv__head">
                <div>
                    <h1>Gerenciamento de Pedidos Recebidos (RF29)</h1>
                    <p className="mk-form-card__sub">
                        Atualize o status dos pedidos para notificar automaticamente os clientes (RF29.1, RF31)
                    </p>
                </div>

                <label className="mk-recv__filter">
                    <span>Filtrar por Status:</span>
                    <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
                        <option value="">Todos</option>
                        {ETAPAS.map((s) => (
                            <option key={s} value={s}>
                                {rotuloStatus(s)}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <div className="mk-table-card">
                <div className="mk-table-scroll">
                    <table className="mk-table mk-recv">
                        <thead>
                            <tr>
                                <th scope="col">Pedido</th>
                                <th scope="col">Cliente</th>
                                <th scope="col">Itens</th>
                                <th scope="col">Total</th>
                                <th scope="col">Status atual (RF29.1)</th>
                                <th scope="col">Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visiveis.map((l) => {
                                const atual = l.sub.statusOperacional;
                                const indiceAtual = ETAPAS.indexOf(atual);
                                const selecionado = rascunhos[l.sub.id] ?? atual;
                                const alterado = selecionado !== atual;
                                const concluido = atual === "ENTREGUE";

                                return (
                                    <tr key={l.sub.id}>
                                        <td>
                                            <strong>#{l.pedidoId}</strong>
                                            <small className="mk-recv__data">{formatarData(l.dataPedido)}</small>
                                        </td>

                                        <td>
                                            <strong>{l.cliente}</strong>
                                            {l.local && <small className="mk-recv__data">{l.local}</small>}
                                        </td>

                                        <td>
                                            {l.itens.map((i) => (
                                                <div key={i.id}>
                                                    {i.titulo} ({i.quantidade}x)
                                                </div>
                                            ))}
                                        </td>

                                        <td>
                                            <strong>{formatarMoeda(l.sub.valorTotal)}</strong>
                                        </td>

                                        <td>
                                            <select
                                                className={`mk-status-select mk-status--${selecionado}`}
                                                value={selecionado}
                                                disabled={concluido}
                                                onChange={(e) => escolherStatus(l.sub, e.target.value)}
                                                aria-label={`Status do pedido ${l.pedidoId}`}
                                            >
                                                {ETAPAS.map((s, i) => (
                                                    <option key={s} value={s} disabled={i < indiceAtual}>
                                                        {rotuloStatus(s)}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>

                                        <td>
                                            {concluido ? (
                                                <span className="mk-recv__done">Concluído</span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="mk-recv__save"
                                                    disabled={!alterado}
                                                    onClick={() => salvar(l.sub)}
                                                >
                                                    Salvar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {visiveis.length === 0 && (
                        <div className="mk-table-empty">
                            {filtro ? "Nenhum pedido com este status." : "Nenhum pedido recebido ainda."}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}