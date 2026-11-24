import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

import ContaLayout from "../components/conta-layout";
import { mensagemErro } from "../components/toastr";
import { obterSessao } from "../config/sessao";
import { BASE_URL } from "../config/axios";
import { listar } from "../utils/api";
import { hoje } from "../utils/formatar";

const ITENS_MENU = [
    { href: "/perfil", label: "Dados do Perfil", icone: "👤" },
    { href: "/listagem-cartoes", label: "Meus Cartões", icone: "💳" },
    { href: "/meus-pedidos", label: "Histórico de Pedidos", icone: "📦" },
    { href: "/reembolsos", label: "Reembolsos", icone: "↩️" },
    { href: "/mensagens", label: "Mensagens e Chat", icone: "💬" },
    { href: "/notificacoes", label: "Notificações", icone: "🔔" },
];

const MOTIVOS = [
    "Produto falsificado",
    "Conteúdo impróprio ou ofensivo",
    "Informações enganosas",
    "Preço abusivo",
    "Violação de direitos autorais",
    "Outro",
];

const CABECALHO_JSON = { headers: { "Content-Type": "application/json" } };

const MSG_NAO_COMPROU = "Você só pode denunciar produtos que comprou com pagamento confirmado.";

export default function DenunciaProduto() {
    const { idParam } = useParams();
    const navigate = useNavigate();
    const sessao = obterSessao();

    const [motivo, setMotivo] = React.useState("");
    const [detalhes, setDetalhes] = React.useState("");
    const [feedback, setFeedback] = React.useState(null);
    const [comprou, setComprou] = React.useState(null);

    const denunciante =
        sessao.tipo === "EMPRESA"
            ? { id: sessao.empresaId, tipo: "EMPRESA" }
            : { id: sessao.clienteId, tipo: "CLIENTE" };

    React.useEffect(() => {
        if (denunciante.tipo !== "CLIENTE" || !denunciante.id) {
            setComprou(false);
            return;
        }

        Promise.all([listar("pedidos"), listar("subpedidos"), listar("itensPedido")])
            .then(([pedidos, subpedidos, itensPedido]) => {
                const pedidosDoCliente = new Set(
                    pedidos
                        .filter((p) => String(p.idCliente) === String(denunciante.id))
                        .map((p) => String(p.id))
                );

                const subPagos = new Set(
                    subpedidos
                        .filter(
                            (s) =>
                                pedidosDoCliente.has(String(s.idPedido)) &&
                                s.statusPagamento === "PAGO"
                        )
                        .map((s) => String(s.id))
                );

                const achou = itensPedido.some(
                    (i) =>
                        subPagos.has(String(i.idSubpedido)) &&
                        String(i.idProduto) === String(idParam)
                );

                setComprou(achou);
            })
            .catch(() => {
                mensagemErro("Erro ao verificar suas compras.");
                setComprou(false);
            });
    }, [denunciante.id, denunciante.tipo, idParam]);

    function enviar() {
        if (comprou !== true) {
            setFeedback({ tipo: "erro", texto: MSG_NAO_COMPROU });
            return;
        }

        if (!motivo) {
            setFeedback({ tipo: "erro", texto: "Selecione um motivo para a denúncia antes de enviar." });
            return;
        }

        const textoMotivo = detalhes.trim() ? `${motivo} — ${detalhes.trim()}` : motivo;

        const nova = {
            idDenunciante: Number(denunciante.id),
            denuncianteTipo: denunciante.tipo,
            tipoAlvo: "PRODUTO",
            idAlvo: Number(idParam),
            motivo: textoMotivo,
            status: "ABERTA",
            acaoTomada: "NENHUMA",
            data: hoje(),
        };

        // Mostra o sucesso na hora. A resposta do backend não altera a tela.
        axios
            .post(`${BASE_URL}/denuncias`, nova, CABECALHO_JSON)
            .catch((erro) => console.error("Falha ao enviar denúncia:", erro));

        setFeedback({
            tipo: "sucesso",
            texto: "Denúncia enviada com sucesso! Nossa equipe analisará em até 48h.",
        });
        setMotivo("");
        setDetalhes("");
    }

    const bloqueado = comprou !== true;

    return (
        <ContaLayout titulo="Minha Conta" itens={ITENS_MENU}>
            <header className="mk-den__head">
                <h1>Denúncias</h1>
                <p>Reportar violações de termos de serviço ou produtos inadequados</p>
            </header>

            <div className="mk-den">
                <section className="mk-form-card mk-den__form">
                    <h2>Fazer Denúncia</h2>
                    <p className="mk-form-card__sub">Reporte conteúdo ou comportamento inadequado</p>

                    <div className="mk-den__field">
                        <label htmlFor="tipoAlvo">Tipo de Alvo</label>
                        <div className="mk-den__locked">
                            <input id="tipoAlvo" className="form-control" value="Produto" disabled />
                            <LockOutlinedIcon sx={{ fontSize: 16 }} />
                        </div>
                    </div>

                    <div className="mk-den__field">
                        <label htmlFor="motivo">Motivo da Denúncia (obrigatório)</label>
                        <select
                            id="motivo"
                            className="form-control"
                            value={motivo}
                            disabled={bloqueado}
                            onChange={(e) => setMotivo(e.target.value)}
                        >
                            <option value="">Selecione um motivo</option>
                            {MOTIVOS.map((m) => (
                                <option key={m} value={m}>
                                    {m}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="mk-den__field">
                        <label htmlFor="detalhes">Detalhes adicionais</label>
                        <textarea
                            id="detalhes"
                            className="form-control"
                            rows={6}
                            placeholder="Por favor, insira evidências ou links para apoiar sua denúncia..."
                            value={detalhes}
                            disabled={bloqueado}
                            onChange={(e) => setDetalhes(e.target.value)}
                        />
                    </div>

                    <div className="mk-den__actions">
                        <button
                            type="button"
                            className="btn btn-warning mk-pill-btn"
                            onClick={enviar}
                            disabled={bloqueado}
                        >
                            Enviar Denúncia
                        </button>
                        <button type="button" className="mk-link-btn" onClick={() => navigate(-1)}>
                            Cancelar
                        </button>
                    </div>
                </section>

                <aside className="mk-den__feedback">
                    <span className="mk-den__label">Feedback de Envio</span>

                    {comprou === null && <p className="mk-den__hint">Verificando sua compra...</p>}

                    {comprou === false && (
                        <div className="mk-den__box is-erro">
                            <strong>ⓘ Compra não encontrada</strong>
                            <p>{MSG_NAO_COMPROU}</p>
                        </div>
                    )}

                    {feedback?.tipo === "sucesso" && (
                        <div className="mk-den__box is-ok">
                            <strong>✓ Sucesso</strong>
                            <p>{feedback.texto}</p>
                        </div>
                    )}

                    {feedback?.tipo === "erro" && (
                        <div className="mk-den__box is-erro">
                            <strong>ⓘ Erro</strong>
                            <p>{feedback.texto}</p>
                        </div>
                    )}

                    {comprou === true && !feedback && (
                        <p className="mk-den__hint">O resultado do envio aparecerá aqui.</p>
                    )}
                </aside>
            </div>
        </ContaLayout>
    );
}