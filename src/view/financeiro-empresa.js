import React from "react";
import { obterSessao } from "../config/sessao";
import { mensagemErro } from "../components/toastr";
import { listar, porId } from "../utils/api";
import { formatarMoeda } from "../utils/formatar";

// "2026-09-25" -> "2026-09"
const mesDe = (data) => String(data ?? "").slice(0, 7);

// "2026-09" -> "Setembro"
const rotuloMes = (ym) => {
    const texto = new Date(`${ym}-01T00:00:00`).toLocaleDateString("pt-BR", { month: "long" });
    return texto.charAt(0).toUpperCase() + texto.slice(1);
};

const percentual = (valor) => `${valor >= 0 ? "+" : ""}${valor.toFixed(1)}%`;

export default function FinanceiroEmpresa() {
    const { empresaId } = obterSessao();
    const [dados, setDados] = React.useState(null);

    React.useEffect(() => {
        Promise.all([
            listar("subpedidos"),
            listar("pedidos"),
            listar("itensPedido"),
            listar("produtos"),
        ])
            .then(([subpedidos, pedidos, itensPedido, produtos]) =>
                setDados({ subpedidos, pedidos, itensPedido, produtos })
            )
            .catch(() => {
                mensagemErro("Erro ao carregar o desempenho financeiro.");
                setDados({ subpedidos: [], pedidos: [], itensPedido: [], produtos: [] });
            });
    }, []);

    const relatorio = React.useMemo(() => {
        if (!dados) return null;

        const pedidosPorId = porId(dados.pedidos);
        const produtosPorId = porId(dados.produtos);

        // Subpedidos pagos desta loja, já com a data do pedido.
        const pagos = dados.subpedidos
            .filter((s) => String(s.idEmpresa) === String(empresaId) && s.statusPagamento === "PAGO")
            .map((s) => ({
                ...s,
                data: pedidosPorId.get(String(s.idPedido))?.dataPedido ?? "",
            }));

        const pagosPorId = new Map(pagos.map((s) => [String(s.id), s]));

        // Cada item vendido com receita, custo e lucro calculados pelos valores da venda.
        const itens = dados.itensPedido
            .filter((i) => pagosPorId.has(String(i.idSubpedido)))
            .map((i) => {
                const qtd = Number(i.quantidade) || 0;
                const pu = Number(i.precoUnitario) || 0;
                const cu = Number(i.custoUnitario) || 0;
                return {
                    idProduto: String(i.idProduto),
                    mes: mesDe(pagosPorId.get(String(i.idSubpedido)).data),
                    qtd,
                    receita: qtd * pu,
                    custo: qtd * cu,
                    lucro: qtd * (pu - cu),
                };
            });

        const receitaTotal = itens.reduce((s, i) => s + i.receita, 0);
        const lucroTotal = itens.reduce((s, i) => s + i.lucro, 0);
        const totalVendido = pagos.reduce((s, p) => s + (Number(p.valorTotal) || 0), 0);
        const margemMedia = receitaTotal > 0 ? (lucroTotal / receitaTotal) * 100 : 0;
        const ticketMedio = pagos.length > 0 ? totalVendido / pagos.length : 0;

        // Por produto
        const mapaProdutos = new Map();
        for (const i of itens) {
            const atual = mapaProdutos.get(i.idProduto) ?? { qtd: 0, receita: 0, custo: 0, lucro: 0 };
            mapaProdutos.set(i.idProduto, {
                qtd: atual.qtd + i.qtd,
                receita: atual.receita + i.receita,
                custo: atual.custo + i.custo,
                lucro: atual.lucro + i.lucro,
            });
        }

        const produtos = [...mapaProdutos.entries()]
            .map(([id, v]) => ({
                id,
                titulo: produtosPorId.get(id)?.titulo ?? `Produto #${id}`,
                foto: (produtosPorId.get(id)?.fotos ?? []).find(Boolean),
                ...v,
                precoMedio: v.qtd ? v.receita / v.qtd : 0,
                custoMedio: v.qtd ? v.custo / v.qtd : 0,
                margem: v.receita > 0 ? (v.lucro / v.receita) * 100 : 0,
            }))
            .sort((a, b) => b.lucro - a.lucro);

        const prejuizo = produtos.filter((p) => p.lucro < 0);

        // Por mês (receita e volume de pedidos)
        const mapaMeses = new Map();
        for (const i of itens) {
            const atual = mapaMeses.get(i.mes) ?? { receita: 0, pedidos: 0 };
            mapaMeses.set(i.mes, { ...atual, receita: atual.receita + i.receita });
        }
        for (const p of pagos) {
            const mes = mesDe(p.data);
            const atual = mapaMeses.get(mes) ?? { receita: 0, pedidos: 0 };
            mapaMeses.set(mes, { ...atual, pedidos: atual.pedidos + 1 });
        }

        const meses = [...mapaMeses.entries()]
            .filter(([mes]) => mes)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-4)
            .map(([mes, v]) => ({ mes, ...v }));

        const atualMes = meses[meses.length - 1];
        const anteriorMes = meses[meses.length - 2];
        const crescimento =
            atualMes && anteriorMes && anteriorMes.receita > 0
                ? ((atualMes.receita - anteriorMes.receita) / anteriorMes.receita) * 100
                : null;

        const maiorMes = Math.max(0, ...meses.map((m) => m.receita));

        return {
            pagos: pagos.length,
            totalVendido,
            receitaTotal,
            lucroTotal,
            margemMedia,
            ticketMedio,
            produtos,
            prejuizo,
            meses,
            crescimento,
            maiorMes,
        };
    }, [dados, empresaId]);

    if (relatorio === null) {
        return <div className="text-center my-4">Carregando desempenho financeiro...</div>;
    }

    const temPrejuizo = relatorio.prejuizo.length > 0;

    return (
        <>
            <header className="mk-fin__head">
                <h1>Desempenho Financeiro</h1>
                <p>Indicadores de vendas e margem calculados com o preço e o custo de cada venda</p>
            </header>

            <div className="mk-fin__kpis">
                <div className="mk-kpi">
                    <small>TOTAL VENDIDO</small>
                    <strong>{formatarMoeda(relatorio.totalVendido)}</strong>
                    {relatorio.crescimento !== null ? (
                        <span className={relatorio.crescimento >= 0 ? "is-ok" : "is-neg"}>
                            {relatorio.crescimento >= 0 ? "↑" : "↓"} {percentual(relatorio.crescimento)} este mês
                        </span>
                    ) : (
                        <span>Sem mês anterior para comparar</span>
                    )}
                </div>

                <div className="mk-kpi">
                    <small>PEDIDOS CONFIRMADOS</small>
                    <strong>{relatorio.pagos} {relatorio.pagos === 1 ? "Pedido" : "Pedidos"}</strong>
                    <span>
                        Ticket médio: <b>{formatarMoeda(relatorio.ticketMedio)}</b>
                    </span>
                </div>

                <div className="mk-kpi">
                    <small>LUCRO LÍQUIDO ESTIMADO</small>
                    <strong className={relatorio.lucroTotal < 0 ? "is-neg" : "is-ok"}>
                        {formatarMoeda(relatorio.lucroTotal)}
                    </strong>
                    <span className="is-warn">Margem média: {relatorio.margemMedia.toFixed(1)}% </span>
                </div>

                <div className={`mk-kpi ${temPrejuizo ? "mk-kpi--alert" : ""}`}>
                    <small>{temPrejuizo ? "⚠ ALERTA DE MARGEM" : "MARGEM"}</small>
                    <strong className={temPrejuizo ? "is-neg" : "is-ok"}>
                        {temPrejuizo
                            ? `${relatorio.prejuizo.length} ${relatorio.prejuizo.length === 1 ? "Item" : "Itens"} com Prejuízo`
                            : "Sem prejuízo"}
                    </strong>
                    <span>
                        {temPrejuizo ? "Preço menor que custo (Margem < 0)" : "Todos os produtos vendidos têm margem positiva"}
                    </span>
                </div>
            </div>

            <section className="mk-section-card">
                <h2>Desempenho por Produto e Margens de Lucro</h2>
                <p>Cálculo baseado no preço de venda e custo cadastrado</p>

                {relatorio.produtos.length === 0 ? (
                    <div className="mk-table-empty">Nenhuma venda paga até o momento.</div>
                ) : (
                    <div className="mk-table-scroll">
                        <table className="mk-table">
                            <thead>
                                <tr>
                                    <th scope="col">Produto</th>
                                    <th scope="col">Vendidos</th>
                                    <th scope="col">Preço venda</th>
                                    <th scope="col">Custo unit.</th>
                                    <th scope="col">Margem (%)</th>
                                    <th scope="col">Lucro total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {relatorio.produtos.map((p) => {
                                    const negativo = p.lucro < 0;
                                    return (
                                        <tr key={p.id}>
                                            <td>
                                                <div className="mk-fin__prod">
                                                    <span className="mk-fin__thumb">
                                                        {p.foto ? <img src={p.foto} alt={p.titulo} /> : null}
                                                    </span>
                                                    <strong className={negativo ? "mk-fin__alert" : ""}>
                                                        {p.titulo}
                                                        {negativo && " ⚠"}
                                                    </strong>
                                                </div>
                                            </td>
                                            <td>{p.qtd} un</td>
                                            <td>{formatarMoeda(p.precoMedio)}</td>
                                            <td className="mk-muted">{formatarMoeda(p.custoMedio)}</td>
                                            <td>
                                                <span className={`mk-pill ${negativo ? "mk-pill--soft-danger" : "mk-pill--ok"}`}>
                                                    {percentual(p.margem)}
                                                </span>
                                            </td>
                                            <td className={negativo ? "mk-negative" : "mk-ok"}>
                                                <strong>{formatarMoeda(p.lucro)}</strong>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className="mk-section-card">
                <h2>Crescimento de Vendas e Volume Mensal</h2>

                {relatorio.meses.length === 0 ? (
                    <div className="mk-table-empty">Sem vendas para exibir no gráfico.</div>
                ) : (
                    <div className="mk-fin__chart">
                        {relatorio.meses.map((m, i) => {
                            const altura = relatorio.maiorMes > 0 ? (m.receita / relatorio.maiorMes) * 100 : 0;
                            const atual = i === relatorio.meses.length - 1;
                            return (
                                <div key={m.mes} className="mk-fin__col">
                                    <span className="mk-fin__value">{formatarMoeda(m.receita)}</span>
                                    <div className="mk-fin__bar-wrap">
                                        <div
                                            className={`mk-fin__bar ${atual ? "is-atual" : ""}`}
                                            style={{ height: `${Math.max(altura, 4)}%` }}
                                            title={`${m.pedidos} pedidos`}
                                        />
                                    </div>
                                    <small className={atual ? "is-atual" : ""}>{rotuloMes(m.mes)}</small>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </>
    );
}