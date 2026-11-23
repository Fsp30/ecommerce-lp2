import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import PageHeader from "../components/page-header";
import { mensagemErro } from "../components/toastr";
import { formatarData, formatarMoeda } from "../utils/formatar";
import { ROTULO_STATUS_REEMBOLSO, listarReembolsosDoCliente } from "../utils/reembolso.js";

export default function ReembolsosCliente() {
    const { idCliente } = useParams();
    const navigate = useNavigate();

    const [reembolsos, setReembolsos] = React.useState(null);

    React.useEffect(() => {
        setReembolsos(null);
        listarReembolsosDoCliente(idCliente)
            .then(setReembolsos)
            .catch(() => {
                mensagemErro("Erro ao carregar as solicitações de reembolso.");
                setReembolsos([]);
            });
    }, [idCliente]);

    if (!idCliente) {
        return <div className="mk-empty">Cliente não informado.</div>;
    }

    if (reembolsos === null) {
        return <div className="text-center my-4">Carregando reembolsos...</div>;
    }

    return (
        <>
            <PageHeader
                trail={["Minha conta", "Reembolsos"]}
                title="Minhas Solicitações de Reembolso"
                subtitle="Acompanhe as devoluções de subpedidos."
                count={`${reembolsos.length}`}
            />

            {reembolsos.length === 0 ? (
                <div className="mk-empty">Você não possui solicitações de reembolso.</div>
            ) : (
                <div className="mk-refunds">
                    {reembolsos.map((r) => (
                        <article key={r.id} className="mk-refund">
                            <header className="mk-refund__head">
                                <span>
                                    Subpedido: <strong>#{r.subpedidoId}</strong>
                                </span>
                                <span>
                                    Valor: <strong>{formatarMoeda(r.valor)}</strong>
                                </span>
                                <span>
                                    Data: <strong>{formatarData(r.dataSolicitacao)}</strong>
                                </span>
                            </header>

                            <div className="mk-refund__body">
                                <span className={`mk-status mk-status--REEMBOLSO_${r.status}`}>
                                    {ROTULO_STATUS_REEMBOLSO[r.status] ?? r.status}
                                </span>

                                <strong className="mk-refund__items">
                                    {r.itens.map((i) => `${i.quantidade}x ${i.titulo}`).join(" • ") || "Sem itens"}
                                </strong>

                                <button
                                    type="button"
                                    className={`btn btn-sm ${r.status === "EM_ANALISE" ? "btn-warning" : "btn-outline-secondary"}`}
                                    onClick={() => navigate(`/reembolsos/${r.id}`)}
                                >
                                    {r.status === "EM_ANALISE" ? "Ver Acompanhamento" : "Ver Detalhes"}
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </>
    );
}