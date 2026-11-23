import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { listar } from "../../utils/api";
import axios from "axios";

import { mensagemErro, mensagemSucesso } from "../../components/toastr";
import { BASE_URL } from "../../config/axios";
import { formatarMoeda } from "../../utils/formatar";

function celulasQr(seed) {
    const tamanho = 21;
    let hash = 0;
    for (const c of String(seed)) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;

    const celulas = [];
    for (let y = 0; y < tamanho; y++) {
        for (let x = 0; x < tamanho; x++) {
            const emCantoFixo =
                (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
            if (emCantoFixo) {
                celulas.push({ x, y, on: true, fixo: true });
            } else {
                hash = (hash * 1103515245 + 12345) >>> 0;
                celulas.push({ x, y, on: (hash >> 16) % 2 === 0, fixo: false });
            }
        }
    }
    return { tamanho, celulas };
}

function QrIlustrativo({ seed }) {
    const { tamanho, celulas } = React.useMemo(() => celulasQr(seed), [seed]);
    return (
        <div
            className="mk-reg__qr"
            style={{ gridTemplateColumns: `repeat(${tamanho}, 1fr)` }}
            aria-label="QR Code para pagamento"
        >
            {celulas.map((c) => (
                <span key={`${c.x}-${c.y}`} className={c.on ? "is-on" : ""} />
            ))}
        </div>
    );
}

function CodigoBarras({ seed }) {
    const barras = React.useMemo(() => {
        const digitos = String(seed).replace(/\D/g, "") || "0";
        return Array.from(digitos).map((d, i) => ({
            largura: (Number(d) % 3) + 1,
            espaco: i % 2 === 0 ? 1 : 2,
        }));
    }, [seed]);

    return (
        <div className="mk-reg__barcode" aria-label="Código de barras">
            {barras.map((b, i) => (
                <React.Fragment key={i}>
                    <span style={{ width: b.largura }} />
                    <i style={{ width: b.espaco }} />
                </React.Fragment>
            ))}
        </div>
    );
}

function BlocoCopia({ rotulo, valor, onCopiar }) {
    return (
        <div className="mk-reg__copy">
            <span className="mk-reg__copy-text">{valor}</span>
            <button
                type="button"
                className="mk-reg__copy-btn"
                onClick={() => onCopiar(valor)}
            >
                Copiar
            </button>
        </div>
    );
}

export default function PedidoRegistrado() {
    const { idParam } = useParams();
    const navigate = useNavigate();

    const location = useLocation();
    const pedidoRecebido = location.state?.pedido ?? null;

    const [pedido, setPedido] = React.useState(pedidoRecebido);
    const [carregando, setCarregando] = React.useState(!pedidoRecebido);

    React.useEffect(() => {
        if (pedidoRecebido && String(pedidoRecebido.id) === String(idParam)) {
            setCarregando(false);
            return;
        }

        async function buscar() {
            try {
                const { data } = await axios.get(
                    `${BASE_URL}/pedidos/${idParam}`,
                );
                setPedido(data);
            } catch {
                try {
                    const todos = await listar("pedidos");
                    const achado = todos.find(
                        (p) => String(p.id) === String(idParam),
                    );
                    if (achado) {
                        setPedido(achado);
                    } else {
                        mensagemErro("Pedido não encontrado.");
                    }
                } catch {
                    mensagemErro("Erro ao carregar o pedido.");
                }
            } finally {
                setCarregando(false);
            }
        }

        buscar();
    }, [idParam]);

    async function copiar(valor) {
        try {
            await navigator.clipboard.writeText(valor);
            mensagemSucesso("Código copiado!");
        } catch {
            mensagemErro("Não foi possível copiar o código.");
        }
    }

    if (carregando) {
        return <div className="text-center my-4">Carregando pedido...</div>;
    }

    if (!pedido) {
        return <div className="mk-empty">Pedido não encontrado.</div>;
    }

    const forma = pedido.formaPagamento ?? "CARTAO";
    const codigo = pedido.codigoPagamento ?? "";
    const pendente = forma !== "CARTAO";

    const textos = {
        PIX: {
            titulo: "Pedido Registrado! (RF25)",
            subtitulo:
                "Quase lá! Realize o pagamento para confirmar sua compra.",
            alerta: "O estoque reservado e o código expiram em 30 minutos (RN35).",
            alertaClasse: "is-danger",
        },
        BOLETO: {
            titulo: "Pedido Registrado! (RF25)",
            subtitulo:
                "Realize o pagamento do boleto para confirmar sua compra.",
            alerta: "O estoque reservado e o boleto vencem em 3 dias úteis (RN35).",
            alertaClasse: "is-warn",
        },
        CARTAO: {
            titulo: "Pagamento aprovado! (RF25)",
            subtitulo: "Seu pedido foi confirmado e já está em preparação.",
            alerta: "Acompanhe o envio e o rastreio em Meus Pedidos.",
            alertaClasse: "is-ok",
        },
    };

    const texto = textos[forma] ?? textos.CARTAO;

    return (
        <div className="mk-reg">
            <article className="mk-reg__card">
                <span
                    className={`mk-reg__icon ${pendente ? "is-pending" : "is-ok"}`}
                    aria-hidden="true"
                >
                    ✓
                </span>

                <h1>{texto.titulo}</h1>
                <p className="mk-reg__subtitle">{texto.subtitulo}</p>

                <div className="mk-reg__summary">
                    <div>
                        <span>Número do Pedido</span>
                        <strong>#{pedido.id}</strong>
                    </div>
                    <div>
                        <span>
                            {pendente
                                ? "Valor Total a Pagar"
                                : "Valor Total Pago"}
                        </span>
                        <strong className="mk-reg__total">
                            {formatarMoeda(pedido.totalGeral)}
                        </strong>
                    </div>
                </div>

                {forma === "PIX" && (
                    <section className="mk-reg__panel">
                        <div className="mk-reg__panel-body">
                            <QrIlustrativo seed={codigo || pedido.id} />
                            <div className="mk-reg__panel-info">
                                <h2>Pague com o PIX (RF45.1)</h2>
                                <p>
                                    Abra o app do seu banco e escaneie o QR Code
                                    ou use o botão abaixo.
                                </p>
                                <BlocoCopia valor={codigo} onCopiar={copiar} />
                            </div>
                        </div>
                    </section>
                )}

                {forma === "BOLETO" && (
                    <section className="mk-reg__panel">
                        <div className="mk-reg__panel-head">
                            <h2>Boleto Bancário (RF45.1)</h2>
                            <button
                                type="button"
                                className="mk-reg__link"
                                disabled
                                title="Geração de PDF ainda não implementada"
                            >
                                Baixar Boleto em PDF
                            </button>
                        </div>
                        <CodigoBarras seed={codigo || pedido.id} />
                        <span className="mk-reg__label">Linha Digitável:</span>
                        <BlocoCopia valor={codigo} onCopiar={copiar} />
                    </section>
                )}

                <div className={`mk-reg__alert ${texto.alertaClasse}`}>
                    ⏱ {texto.alerta}
                </div>

                <div className="mk-reg__actions">
                    <button
                        type="button"
                        className="btn mk-reg__btn-outline"
                        onClick={() => navigate(`/clientes/${pedido.idCliente}/pedidos`)}
                    >
                        Ver Meus Pedidos
                    </button>
                    <button
                        type="button"
                        className="btn btn-warning"
                        onClick={() => navigate("/listagem-produtos")}
                    >
                        Continuar Comprando
                    </button>
                </div>
            </article>
        </div>
    );
}
