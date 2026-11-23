import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import PageHeader from "../../components/page-header";
import { mensagemErro } from "../../components/toastr";
import { formatarData, formatarMoeda } from "../../utils/formatar";
import { ROTULO_STATUS_REEMBOLSO, buscarReembolso } from "../../utils/reembolso.js";

const ETAPAS = [
    { id: "SOLICITADO", rotulo: "Reembolso Solicitado" },
    { id: "EM_ANALISE", rotulo: "Em Análise" },
    { id: "AGUARDANDO_RECEBIMENTO", rotulo: "Aguardando Recebimento" },
    { id: "ESTORNADO", rotulo: "Reembolso Concluído" },
];

const ORDEM = Object.fromEntries(ETAPAS.map((e, i) => [e.id, i]));

export default function DetalheReembolso() {
    const { idReembolso } = useParams();
    const navigate = useNavigate();

    const [reembolso, setReembolso] = React.useState(undefined);

    React.useEffect(() => {
        setReembolso(undefined);
        buscarReembolso(idReembolso)
            .then(setReembolso)
            .catch(() => {
                mensagemErro("Erro ao carregar a solicitação.");
                setReembolso(null);
            });
    }, [idReembolso]);

    if (reembolso === undefined) {
        return <div className="text-center my-4">Carregando solicitação...</div>;
    }

    if (reembolso === null) {
        return <div className="mk-empty">Solicitação não encontrada.</div>;
    }

    const atual = ORDEM[reembolso.status] ?? -1;

    return (
        <>
            <PageHeader
                trail={["Minha conta", "Reembolsos", `#${reembolso.id}`]}
                title={`Acompanhamento de Reembolso #${reembolso.id}`}
                subtitle={`Pedido #${reembolso.idPedido} • Subpedido #${reembolso.subpedidoId} • ${ROTULO_STATUS_REEMBOLSO[reembolso.status] ?? reembolso.status}`}
            >
                <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => navigate(`/clientes/${reembolso.idCliente}/reembolsos`)}
                >
                    ← Voltar
                </button>
            </PageHeader>

            <div className="mk-detail">
                <section className="mk-card">
                    <h2>Etapas</h2>
                    <ol className="mk-steps">
                        {ETAPAS.map((e, i) => {
                            const feito = i <= atual;
                            return (
                                <li key={e.id} className={feito ? "is-done" : ""}>
                                    <span className="mk-steps__dot">{feito ? "✓" : i + 1}</span>
                                    <div>
                                        <strong>{e.rotulo}</strong>
                                        {reembolso.motivo && i === 0 && <small>Motivo: {reembolso.motivo}</small>}
                                        {reembolso.dataAtualizacao && i === atual && (
                                            <small>Atualizado em {formatarData(reembolso.dataAtualizacao)}</small>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ol>

                    {reembolso.status === "AGUARDANDO_RECEBIMENTO" && (
                        <div className="mk-alert is-warn">
                            Poste o pacote nos Correios com o código de postagem enviado ao seu e-mail.
                        </div>
                    )}
                </section>

                <aside className="mk-card mk-detail__side">
                    <h2>Itens devolvidos</h2>
                    <div className="mk-items">
                        {reembolso.itens.map((i, idx) => (
                            <div key={idx} className="mk-item">
                                <div className="mk-item__info">
                                    <strong>{i.titulo}</strong>
                                    <small>{i.quantidade}x</small>
                                </div>
                                <strong>{formatarMoeda(i.valor)}</strong>
                            </div>
                        ))}
                    </div>

                    <div className="mk-summary-total">
                        <span>Valor a estornar</span>
                        <strong>{formatarMoeda(reembolso.valor)}</strong>
                    </div>

                    {reembolso.chavePixReembolso && (
                        <>
                            <h3>Estorno via PIX</h3>
                            <p className="mk-muted">{reembolso.chavePixReembolso}</p>
                        </>
                    )}
                </aside>
            </div>
        </>
    );
}