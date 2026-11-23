import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import PageHeader from "../../components/page-header";
import { mensagemErro } from "../../components/toastr";
import { buscarPedido } from "../../utils/pedidos";
import { ORDEM_STATUS_PEDIDO, formatarData, formatarMoeda, rotuloStatus } from "../../utils/formatar";

const ETAPAS = [
    { id: "PEDIDO_CONFIRMADO", rotulo: "Pago" },
    { id: "EM_PREPARACAO", rotulo: "Em Preparação" },
    { id: "ENVIADO", rotulo: "Enviado" },
    { id: "ENTREGUE", rotulo: "Entregue" },
];

function etapaAtingida(statusAtual, etapa) {
    return (ORDEM_STATUS_PEDIDO[statusAtual] ?? 0) >= (ORDEM_STATUS_PEDIDO[etapa] ?? 0);
}

function Rastreio({ subpedido }) {
    return (
        <ol className="mk-track">
            {ETAPAS.map((e) => {
                const ok = etapaAtingida(subpedido.statusOperacional, e.id);
                return (
                    <li key={e.id} className={ok ? "is-done" : ""}>
                        <span className="mk-track__dot">{ok ? "✓" : ""}</span>
                        <span>{e.rotulo}</span>
                    </li>
                );
            })}
        </ol>
    );
}

export default function DetalhePedido() {
    const { idPedido } = useParams();
    const navigate = useNavigate();

    const [pedido, setPedido] = React.useState(undefined);

    React.useEffect(() => {
        setPedido(undefined);
        buscarPedido(idPedido)
            .then((p) => setPedido(p))
            .catch(() => {
                mensagemErro("Erro ao carregar o pedido.");
                setPedido(null);
            });
    }, [idPedido]);

    if (pedido === undefined) {
        return <div className="text-center my-4">Carregando pedido...</div>;
    }

    if (pedido === null) {
        return <div className="mk-empty">Pedido não encontrado.</div>;
    }

    const end = pedido.enderecoEntrega ?? {};

    return (
        <>
            <PageHeader
                trail={["Minha conta", "Pedidos", `#${pedido.id}`]}
                title={`Detalhes do Pedido #${pedido.id}`}
                subtitle={`Realizado em ${formatarData(pedido.dataPedido)} • ${rotuloStatus(pedido.status)}`}
            >
                <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => navigate(`/clientes/${pedido.idCliente}/pedidos`)}
                >
                    ← Voltar aos pedidos
                </button>
            </PageHeader>

            <div className="mk-detail">
                <div className="mk-detail__main">
                    {pedido.subpedidos.map((s) => (
                        <section key={s.id} className="mk-card">
                            <header className="mk-card__head">
                                <h2>{s.empresaNome}</h2>
                                <span className={`mk-status mk-status--${s.statusOperacional}`}>
                                    {rotuloStatus(s.statusOperacional)}
                                </span>
                            </header>

                            <Rastreio subpedido={s} />

                            {s.codigoRastreio && (
                                <p className="mk-muted">
                                    {s.transportadora ?? "Transportadora"} • Rastreio: <strong>{s.codigoRastreio}</strong>
                                </p>
                            )}

                            <div className="mk-items">
                                {s.itens.map((i) => (
                                    <div key={i.id} className="mk-item">
                                        <div className="mk-item__media">
                                            {i.foto ? <img src={i.foto} alt={i.titulo} /> : <span>WebP</span>}
                                        </div>
                                        <div className="mk-item__info">
                                            <strong>{i.titulo}</strong>
                                            <small>
                                                {i.quantidade}x {formatarMoeda(i.precoUnitario)}
                                            </small>
                                        </div>
                                        <strong>{formatarMoeda(i.subtotal)}</strong>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>

                <aside className="mk-card mk-detail__side">
                    <h2>Resumo</h2>

                    <div className="mk-summary-row">
                        <span>Subtotal</span>
                        <strong>{formatarMoeda(pedido.subtotalGeral)}</strong>
                    </div>
                    <div className="mk-summary-row">
                        <span>Frete</span>
                        <strong>{pedido.freteGeral ? formatarMoeda(pedido.freteGeral) : "GRÁTIS"}</strong>
                    </div>
                    <div className="mk-summary-total">
                        <span>Total</span>
                        <strong>{formatarMoeda(pedido.totalGeral)}</strong>
                    </div>

                    <h3>Endereço de entrega</h3>
                    <p className="mk-muted">
                        {end.logradouro}, {end.numeroResidencial}
                        {end.complemento ? ` — ${end.complemento}` : ""}
                        <br />
                        {end.bairro ? `${end.bairro} — ` : ""}
                        {end.cidade}/{end.uf}
                        <br />
                        CEP: {end.cep}
                    </p>

                    {pedido.formaPagamento && (
                        <>
                            <h3>Pagamento</h3>
                            <p className="mk-muted">{pedido.formaPagamento}</p>
                        </>
                    )}
                </aside>
            </div>
        </>
    );
}