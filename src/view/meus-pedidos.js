import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import PageHeader from "../components/page-header";
import { mensagemErro } from "../components/toastr";
import { listarPedidosDoCliente } from "../utils/pedidos";
import {
    ROTULO_STATUS_PEDIDO,
    formatarData,
    formatarMoeda,
    rotuloStatus,
} from "../utils/formatar";

const OPCOES_STATUS = Object.keys(ROTULO_STATUS_PEDIDO).filter((s) => s !== "SEM_SUBPEDIDOS");

function resumoItens(pedido) {
    if (pedido.qtdItens === 0) return "Sem itens";

    const titulos = [...new Set(pedido.itens.map((i) => i.titulo))];
    if (pedido.qtdItens === 1) return `1 Item (${titulos[0]})`;
    return `${pedido.qtdItens} Itens (${titulos.join(" + ")})`;
}

export default function MeusPedidos() {
    const { idCliente } = useParams();
    const navigate = useNavigate();

    const [pedidos, setPedidos] = React.useState(null);
    const [filtro, setFiltro] = React.useState("");

    React.useEffect(() => {
        setPedidos(null);
        listarPedidosDoCliente(idCliente)
            .then(setPedidos)
            .catch(() => {
                mensagemErro("Erro ao carregar os pedidos.");
                setPedidos([]);
            });
    }, [idCliente]);

    const visiveis = React.useMemo(
        () => (pedidos ?? []).filter((p) => !filtro || p.status === filtro),
        [pedidos, filtro]
    );

    if (pedidos === null) {
        return <div className="text-center my-4">Carregando pedidos...</div>;
    }

    return (
        <>
            <PageHeader
                trail={["Minha conta", "Pedidos"]}
                title="Meus Pedidos Realizados"
                count={`${pedidos.length}`}
            >
                <select
                    className="form-control mk-order-filter"
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                >
                    <option value="">Filtrar por status: Todos</option>
                    {OPCOES_STATUS.map((s) => (
                        <option key={s} value={s}>
                            {rotuloStatus(s)}
                        </option>
                    ))}
                </select>
            </PageHeader>

            {visiveis.length === 0 ? (
                <div className="mk-empty">
                    {filtro ? "Nenhum pedido com este status." : "Você ainda não fez nenhum pedido."}
                </div>
            ) : (
                <div className="mk-orders">
                    {visiveis.map((p) => (
                        <article key={p.id} className="mk-order">
                            <header className="mk-order__head">
                                <span>
                                    Pedido realizado em: <strong>{formatarData(p.dataPedido)}</strong>
                                </span>
                                <span>
                                    Total: <strong>{formatarMoeda(p.totalGeral)}</strong>
                                </span>
                                <span className="mk-order__id">Pedido Nº #{p.id}</span>
                            </header>

                            <div className="mk-order__body">
                                <span className={`mk-status mk-status--${p.status}`}>
                                    {rotuloStatus(p.status)}
                                </span>

                                <div className="mk-order__info">
                                    <strong>{resumoItens(p)}</strong>
                                    <small>
                                        Vendido por:{" "}
                                        {[...new Set(p.subpedidos.map((s) => s.empresaNome))].join(", ") || "—"}
                                    </small>
                                </div>

                                <button
                                    type="button"
                                    className="btn btn-warning btn-sm"
                                    onClick={() => navigate(`/pedidos/${p.id}`)}
                                >
                                    Ver Detalhes →
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </>
    );
}