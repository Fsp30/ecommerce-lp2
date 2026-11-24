import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import { mensagemErro } from "../components/toastr";
import { obterSessao } from "../config/sessao";
import { BASE_URL } from "../config/axios";
import { listar, porId } from "../utils/api";
import { formatarDataHora } from "../utils/formatar";

const CABECALHO_JSON = { headers: { "Content-Type": "application/json" } };

const ehCritico = (tipo = "") => /^(REEMBOLSO|DENUNCIA|CANCELAMENTO)/.test(tipo);

function tituloDe(tipo = "", pedidoId) {
    const pedido = pedidoId ? ` — Pedido #${pedidoId}` : "";

    if (tipo.startsWith("REEMBOLSO")) return `Solicitação de Reembolso Aberta${pedido}`;
    if (tipo.startsWith("DENUNCIA")) return `Denúncia Recebida${pedido}`;
    if (tipo.startsWith("CANCELAMENTO")) return `Pedido Cancelado${pedido}`;
    if (tipo === "NOVO_PEDIDO") return `Novo Pedido Confirmado #${pedidoId}`;
    if (tipo === "PEDIDO_ENVIADO") return `Pedido Enviado${pedido}`;
    return `Atualização${pedido}`;
}

export default function CentralNotificacoes() {
    const navigate = useNavigate();
    const { usuarioId } = obterSessao();

    const [dados, setDados] = React.useState(null);

    React.useEffect(() => {
        Promise.all([listar("notificacoes"), listar("subpedidos"), listar("usuarios")])
            .then(([notificacoes, subpedidos, usuarios]) =>
                setDados({ notificacoes, subpedidos, usuarios })
            )
            .catch(() => {
                mensagemErro("Erro ao carregar as notificações.");
                setDados({ notificacoes: [], subpedidos: [], usuarios: [] });
            });
    }, []);

    const lista = React.useMemo(() => {
        if (!dados) return [];

        const subPorId = porId(dados.subpedidos);

        return dados.notificacoes
            .filter(
                (n) =>
                    String(n.idUsuario) === String(usuarioId) &&
                    n.usuarioTipo === "EMPRESA"
            )
            .map((n) => {
                const sub = subPorId.get(String(n.idSubpedido));
                return {
                    ...n,
                    pedidoId: sub?.idPedido ?? null,
                };
            })
            .sort((a, b) => String(b.dataEnvio ?? "").localeCompare(String(a.dataEnvio ?? "")));
    }, [dados, usuarioId]);

    const emailDaLoja = React.useMemo(() => {
        const usuario = (dados?.usuarios ?? []).find(
            (u) => String(u.id) === String(usuarioId)
        );
        return usuario?.email ?? "";
    }, [dados, usuarioId]);

    function atualizarNaTela(atualizada) {
        setDados((d) => ({
            ...d,
            notificacoes: d.notificacoes.map((n) =>
                String(n.id) === String(atualizada.id) ? atualizada : n
            ),
        }));
    }

    function marcarLida(n) {
        if (n.lida) return;

        const { pedidoId, ...original } = n;
        const atualizada = { ...original, lida: true };

        atualizarNaTela(atualizada);
        axios
            .put(`${BASE_URL}/notificacoes/${n.id}`, atualizada, CABECALHO_JSON)
            .catch((erro) => console.error("Falha ao marcar notificação:", erro));
    }

    function verCaso(n) {
        marcarLida(n);
        navigate("/pedidos-recebidos");
    }

    if (dados === null) {
        return <div className="text-center my-4">Carregando notificações...</div>;
    }

    return (
        <section className="mk-form-card">
            <h1>Central de Notificações do Lojista</h1>
            <p className="mk-form-card__sub">
                Eventos críticos são sinalizados e enviados adicionalmente por e-mail (RN22)
            </p>

            {lista.length === 0 ? (
                <div className="mk-table-empty">Não existem notificações.</div>
            ) : (
                <div className="mk-notif-list">
                    {lista.map((n) => {
                        const critico = ehCritico(n.tipo);
                        const enviadoPorEmail = String(n.canal ?? "").includes("EMAIL") && emailDaLoja;

                        return (
                            <article
                                key={n.id}
                                className={`mk-notif ${critico ? "is-critico" : ""} ${n.lida ? "is-lida" : ""}`}
                            >
                                <span className="mk-notif__icon">
                                    {critico ? (
                                        <WarningAmberIcon fontSize="small" />
                                    ) : (
                                        <ShoppingBagOutlinedIcon fontSize="small" />
                                    )}
                                </span>

                                <div className="mk-notif__body">
                                    <div className="mk-notif__title">
                                        {critico && <span className="mk-notif__tag">Evento crítico</span>}
                                        <strong>{tituloDe(n.tipo, n.pedidoId)}</strong>
                                        {!n.lida && <span className="mk-notif__dot" aria-label="Não lida" />}
                                    </div>

                                    <p>{n.mensagem}</p>

                                    <small>
                                        {formatarDataHora(n.dataEnvio)} •{" "}
                                        {enviadoPorEmail
                                            ? `Enviado também para ${emailDaLoja}`
                                            : "Notificação interna da plataforma"}
                                    </small>
                                </div>

                                <div className="mk-notif__actions">
                                    {critico ? (
                                        <button type="button" className="mk-notif__cta" onClick={() => verCaso(n)}>
                                            Ver caso <ArrowForwardIcon sx={{ fontSize: 14 }} />
                                        </button>
                                    ) : (
                                        !n.lida && (
                                            <button type="button" className="mk-notif__read" onClick={() => marcarLida(n)}>
                                                Marcar como lida
                                            </button>
                                        )
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}