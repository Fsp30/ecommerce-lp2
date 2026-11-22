import React from "react";
import { useNavigate } from "react-router-dom";

import AdminLayout from "../../components/admin-layout";
import PageHeader from "../../components/page-header";
import { mensagemErro } from "../../components/toastr";
import { listar, porId } from "../../utils/api";
import { formatarCnpj } from "../../utils/documentos";
import { formatarMoeda } from "../../utils/formatar";

const PERIODOS = [
    { id: "DIA", label: "Dia", rotulo: "DIA" },
    { id: "MES", label: "Mês", rotulo: "MÊS" },
    { id: "ANO", label: "Ano", rotulo: "ANO" },
];

const hoje = () => new Date().toLocaleDateString("sv-SE");

function noPeriodo(data, periodo) {
    if (!data) return false;
    const tamanho = periodo === "DIA" ? 10 : periodo === "MES" ? 7 : 4;
    return String(data).slice(0, tamanho) === hoje().slice(0, tamanho);
}

const contarPedidos = (subpedidos) => new Set(subpedidos.map((s) => String(s.idPedido))).size;
const somar = (lista, valorDe) => lista.reduce((soma, item) => soma + valorDe(item), 0);

function calcular(dados, periodo) {
    const pedidosPorId = porId(dados.pedidos);
    const pagos = dados.subpedidos.filter(
        (s) => s.statusPagamento === "PAGO" && noPeriodo(pedidosPorId.get(String(s.idPedido))?.dataPedido, periodo)
    );
    const idsPagos = new Set(pagos.map((s) => String(s.id)));

    const volume = somar(pagos, (s) => Number(s.valorTotal));
    const pedidos = contarPedidos(pagos);

    const itens = dados.itensPedido.filter((i) => idsPagos.has(String(i.idSubpedido)));
    const receita = somar(itens, (i) => Number(i.quantidade) * Number(i.precoUnitario));
    const custo = somar(itens, (i) => Number(i.quantidade) * Number(i.custoUnitario));
    const lucro = receita - custo;

    const ranking = dados.empresas
        .map((empresa) => {
            const dela = pagos.filter((s) => String(s.idEmpresa) === String(empresa.id));
            return { empresa, pedidos: contarPedidos(dela), total: somar(dela, (s) => Number(s.valorTotal)) };
        })
        .filter((r) => r.total > 0)
        .sort((a, b) => b.total - a.total);

    return {
        volume,
        pedidos,
        ticket: pedidos ? volume / pedidos : 0,
        lucro,
        margem: receita ? (lucro / receita) * 100 : 0,
        ranking,
    };
}

export default function MetricasGerais() {
    const navigate = useNavigate();
    const [dados, setDados] = React.useState(null);
    const [periodo, setPeriodo] = React.useState("MES");

    React.useEffect(() => {
        Promise.all([
            listar("pedidos"),
            listar("subpedidos"),
            listar("itensPedido"),
            listar("empresas"),
            listar("clientes"),
            listar("solicitacoesReembolso"),
        ])
            .then(([pedidos, subpedidos, itensPedido, empresas, clientes, reembolsos]) =>
                setDados({ pedidos, subpedidos, itensPedido, empresas, clientes, reembolsos })
            )
            .catch(() => {
                mensagemErro("Erro ao carregar as métricas da plataforma.");
                setDados({ pedidos: [], subpedidos: [], itensPedido: [], empresas: [], clientes: [], reembolsos: [] });
            });
    }, []);

    const metricas = React.useMemo(() => (dados ? calcular(dados, periodo) : null), [dados, periodo]);

    const rotuloPeriodo = PERIODOS.find((p) => p.id === periodo).rotulo;
    const clientes = dados ? dados.clientes.filter((c) => c.status !== "REMOVIDO").length : 0;
    const empresas = dados ? dados.empresas.filter((e) => e.status !== "REMOVIDO").length : 0;
    const devolucoes = dados ? dados.reembolsos.filter((r) => r.status === "AGUARDANDO_RECEBIMENTO").length : 0;

    return (
        <AdminLayout>
            <PageHeader trail={["Administração", "Métricas"]} title="Visão Geral da Plataforma">
                <div className="mk-periodos-bar">
                    <div className="mk-periodos">
                        {PERIODOS.map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                className={periodo === p.id ? "is-active" : ""}
                                onClick={() => setPeriodo(p.id)}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <span className="mk-admin-pill">Admin Geral</span>
                </div>
            </PageHeader>

            {metricas === null ? (
                <div className="text-center my-4">Carregando métricas...</div>
            ) : (
                <>
                    <div className="mk-kpis">
                        <div className="mk-kpi">
                            <small>{`VOLUME TOTAL DE VENDAS (${rotuloPeriodo})`}</small>
                            <strong>{formatarMoeda(metricas.volume)}</strong>
                            <span className="is-ok">Apenas pedidos pagos confirmados</span>
                        </div>

                        <div className="mk-kpi">
                            <small>PEDIDOS PROCESSADOS</small>
                            <strong>{`${metricas.pedidos} Pedidos`}</strong>
                            <span>Ticket médio: {formatarMoeda(metricas.ticket)}</span>
                        </div>

                        <div className="mk-kpi">
                            <small>BASE DE USUÁRIOS</small>
                            <strong>{`${clientes + empresas} Contas`}</strong>
                            <span className="is-warn">{`${clientes} Clientes • ${empresas} Empresas`}</span>
                        </div>

                        <div className="mk-kpi">
                            <small>MARGEM GLOBAL MÉDIA</small>
                            <strong className={metricas.margem < 0 ? "is-neg" : "is-ok"}>{`${metricas.margem.toFixed(1)}%`}</strong>
                            <span>Lucro bruto est.: {formatarMoeda(metricas.lucro)}</span>
                        </div>
                    </div>

                    <section className="mk-section-card">
                        <h2>Ranking Oficial de Empresas por Vendas</h2>
                        <p>Ordenação decrescente por volume financeiro transacionado</p>

                        <div className="mk-table-scroll">
                            <table className="mk-table">
                                <thead>
                                    <tr>
                                        <th scope="col">Posição</th>
                                        <th scope="col">Empresa / Loja</th>
                                        <th scope="col">CNPJ</th>
                                        <th scope="col">Pedidos pagos</th>
                                        <th scope="col">Total vendido</th>
                                        <th scope="col">Ação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {metricas.ranking.map((r, i) => (
                                        <tr key={r.empresa.id}>
                                            <td>
                                                <span className={`mk-medal mk-medal--${i < 3 ? i + 1 : "n"}`}>{`${i + 1}º`}</span>
                                            </td>
                                            <td>
                                                <strong>{r.empresa.nomeFantasia}</strong>
                                            </td>
                                            <td className="mk-muted">{formatarCnpj(r.empresa.cnpj)}</td>
                                            <td>{`${r.pedidos} ${r.pedidos === 1 ? "pedido" : "pedidos"}`}</td>
                                            <td>
                                                <strong className="mk-ok">{formatarMoeda(r.total)}</strong>
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="mk-act"
                                                    onClick={() => navigate("/admin/lojas", { state: { empresaId: r.empresa.id } })}
                                                >
                                                    Inspecionar →
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {metricas.ranking.length === 0 && (
                                <div className="mk-table-empty">Nenhuma venda paga no período selecionado.</div>
                            )}
                        </div>
                    </section>

                    <section className="mk-section-card">
                        <h2>Saúde do Sistema & Integridade Transacional</h2>

                        <div className="mk-health">
                            <div className="mk-health__card mk-health__card--ok">
                                <strong>✓ Consistência de Estoque</strong>
                                <p>Nenhuma divergência entre baixas e pedidos confirmados.</p>
                            </div>

                            <div className="mk-health__card mk-health__card--warn">
                                <strong>⚠️ Monitoramento de Reembolsos</strong>
                                <p>
                                    {devolucoes === 0
                                        ? "Nenhuma devolução aguardando validação final de postagem."
                                        : `${devolucoes} ${devolucoes === 1 ? "devolução aguardando" : "devoluções aguardando"} validação final de postagem.`}
                                </p>
                            </div>

                            <div className="mk-health__card">
                                <strong>ℹ️ Modo Demonstração</strong>
                                <p>Métricas e relatórios abastecidos via dados mockados.</p>
                            </div>
                        </div>
                    </section>
                </>
            )}
        </AdminLayout>
    );
}