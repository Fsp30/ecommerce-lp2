import React from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import { mensagemErro } from "../components/toastr";
import { obterSessao } from "../config/sessao";
import { BASE_URL } from "../config/axios";
import { listar, porId } from "../utils/api";
import { lerImagem } from "../utils/imagem";

const CABECALHO_JSON = { headers: { "Content-Type": "application/json" } };

const hojeISO = () => new Date().toISOString().slice(0, 10);

function horaOuData(valor) {
    if (!valor) return "";
    const data = new Date(valor);
    return String(valor).slice(0, 10) === hojeISO()
        ? data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        : data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

const iniciais = (nome = "") =>
    nome.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";

export default function Mensagens() {
    const navigate = useNavigate();
    const { idParam } = useParams();
    const sessao = obterSessao();

    const ehEmpresa = sessao.tipo === "EMPRESA";
    const meuId = ehEmpresa ? sessao.empresaId : sessao.tipo === "CLIENTE" ? sessao.clienteId : null;
    const meuTipo = ehEmpresa ? "EMPRESA" : "CLIENTE";

    const [dados, setDados] = React.useState(null);
    const [busca, setBusca] = React.useState("");
    const [texto, setTexto] = React.useState("");
    const [anexo, setAnexo] = React.useState(null);

    const inputArquivo = React.useRef(null);
    const fimDaConversa = React.useRef(null);

    React.useEffect(() => {
        Promise.all([
            listar("conversas"),
            listar("mensagens"),
            listar("clientes"),
            listar("empresas"),
            listar("subpedidos"),
            listar("pedidos"),
            listar("produtos"),
        ])
            .then(([conversas, mensagens, clientes, empresas, subpedidos, pedidos, produtos]) =>
                setDados({ conversas, mensagens, clientes, empresas, subpedidos, pedidos, produtos })
            )
            .catch(() => {
                mensagemErro("Erro ao carregar as mensagens.");
                setDados({
                    conversas: [], mensagens: [], clientes: [], empresas: [],
                    subpedidos: [], pedidos: [], produtos: [],
                });
            });
    }, []);

    const conversas = React.useMemo(() => {
        if (!dados || meuId == null) return [];

        const clientesPorId = porId(dados.clientes);
        const empresasPorId = porId(dados.empresas);
        const subPorId = porId(dados.subpedidos);
        const produtosPorId = porId(dados.produtos);

        return dados.conversas
            .filter((c) => String(ehEmpresa ? c.idEmpresa : c.idCliente) === String(meuId))
            .map((c) => {
                const msgs = dados.mensagens
                    .filter((m) => String(m.idConversa) === String(c.id))
                    .sort((a, b) => String(a.dataEnvio ?? "").localeCompare(String(b.dataEnvio ?? "")));

                const cliente = clientesPorId.get(String(c.idCliente));
                const empresa = empresasPorId.get(String(c.idEmpresa));
                const sub = c.idSubpedido ? subPorId.get(String(c.idSubpedido)) : null;
                const produto = c.idProduto ? produtosPorId.get(String(c.idProduto)) : null;

                const nome = ehEmpresa ? cliente?.nomeCompleto : empresa?.nomeFantasia;

                return {
                    id: c.id,
                    idCliente: c.idCliente,
                    idEmpresa: c.idEmpresa,
                    idProduto: c.idProduto,
                    pedidoId: sub?.idPedido ?? null,
                    produtoTitulo: produto?.titulo ?? null,
                    contraparte: nome ?? (ehEmpresa ? "Cliente" : "Loja"),
                    foto: ehEmpresa ? cliente?.fotoUrl : empresa?.logoUrl,
                    msgs,
                    ultima: msgs[msgs.length - 1] ?? null,
                    naoLidas: msgs.filter((m) => !m.lida && m.remetenteTipo !== meuTipo).length,
                };
            })
            .sort((a, b) =>
                String(b.ultima?.dataEnvio ?? "").localeCompare(String(a.ultima?.dataEnvio ?? ""))
            );
    }, [dados, meuId, ehEmpresa, meuTipo]);

    const listaVisivel = conversas.filter((c) => {
        const termo = busca.trim().toLowerCase();
        if (!termo) return true;
        return (
            c.contraparte.toLowerCase().includes(termo) ||
            String(c.pedidoId ?? "").includes(termo)
        );
    });

    const atual = idParam
        ? conversas.find((c) => String(c.id) === String(idParam)) ?? null
        : conversas[0] ?? null;

    function marcarLidas(conversa) {
        const pendentes = conversa.msgs.filter((m) => !m.lida && m.remetenteTipo !== meuTipo);
        if (pendentes.length === 0) return;

        const ids = new Set(pendentes.map((m) => String(m.id)));
        setDados((d) => ({
            ...d,
            mensagens: d.mensagens.map((m) => (ids.has(String(m.id)) ? { ...m, lida: true } : m)),
        }));

        pendentes.forEach((m) =>
            axios
                .put(`${BASE_URL}/mensagens/${m.id}`, { ...m, lida: true }, CABECALHO_JSON)
                .catch((erro) => console.error("Falha ao marcar mensagem:", erro))
        );
    }

    React.useEffect(() => {
        if (atual) marcarLidas(atual);
    }, [atual?.id, dados === null]);
    React.useEffect(() => {
        fimDaConversa.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [atual?.id, atual?.msgs.length]);

    async function escolherAnexo(e) {
        const arquivo = e.target.files?.[0];
        e.target.value = "";
        if (!arquivo) return;

        try {
            setAnexo(await lerImagem(arquivo));
        } catch (erro) {
            mensagemErro(erro.message);
        }
    }

    function enviar() {
        const conteudo = texto.trim();
        if (!atual || (!conteudo && !anexo)) return;

        const novaMensagem = {
            id: Math.max(0, ...dados.mensagens.map((m) => Number(m.id) || 0)) + 1,
            idConversa: atual.id,
            remetenteTipo: meuTipo,
            texto: conteudo,
            anexoUrl: anexo ?? "",
            lida: false,
            dataEnvio: new Date().toISOString().slice(0, 19),
        };

        setDados((d) => ({ ...d, mensagens: [...d.mensagens, novaMensagem] }));
        setTexto("");
        setAnexo(null);

        axios
            .post(`${BASE_URL}/mensagens`, novaMensagem, CABECALHO_JSON)
            .catch((erro) => console.error("Falha ao enviar mensagem:", erro));
    }

    function aoTeclar(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            enviar();
        }
    }

    if (dados === null) {
        return <div className="text-center my-4">Carregando mensagens...</div>;
    }

    if (meuId == null) {
        return <div className="mk-empty">Esta área é para clientes e lojas.</div>;
    }

    const linkPedido = atual?.pedidoId
        ? ehEmpresa
            ? "/pedidos-recebidos"
            : `/pedidos/${atual.pedidoId}`
        : null;

    const linkProduto = atual?.idProduto
        ? ehEmpresa
            ? `/cadastro-produto/${atual.idProduto}`
            : `/produtos/${atual.idProduto}`
        : null;

    return (
        <>
            <button type="button" className="mk-back" onClick={() => navigate(-1)}>
                <ArrowBackIosNewIcon sx={{ fontSize: 14 }} />
                Voltar
            </button>

            <div className="mk-chat">
                <aside className="mk-chat__list">
                    <h1>Mensagens</h1>
                    <p>Canal direto entre cliente e loja</p>

                    <input
                        type="search"
                        className="form-control mk-chat__busca"
                        placeholder={ehEmpresa ? "Buscar por cliente ou pedido..." : "Buscar por loja ou pedido..."}
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                    />

                    <div className="mk-chat__items">
                        {listaVisivel.map((c) => (
                            <button
                                key={c.id}
                                type="button"
                                className={`mk-chat__item ${atual?.id === c.id ? "is-active" : ""}`}
                                onClick={() => navigate(`/mensagens/${c.id}`)}
                            >
                                <span className="mk-chat__avatar">
                                    {c.foto ? <img src={c.foto} alt={c.contraparte} /> : iniciais(c.contraparte)}
                                </span>

                                <span className="mk-chat__item-body">
                                    <span className="mk-chat__item-top">
                                        <strong>{c.contraparte}</strong>
                                        <small>{horaOuData(c.ultima?.dataEnvio)}</small>
                                    </span>

                                    <span className="mk-chat__tags">
                                        {c.pedidoId && <span className="mk-chat__tag">Pedido #{c.pedidoId}</span>}
                                        {c.produtoTitulo && <span className="mk-chat__tag">{c.produtoTitulo}</span>}
                                    </span>

                                    <span className="mk-chat__preview">
                                        {c.ultima?.texto || (c.ultima?.anexoUrl ? "Imagem enviada" : "Sem mensagens")}
                                    </span>
                                </span>

                                {c.naoLidas > 0 && <span className="mk-chat__badge">{c.naoLidas}</span>}
                            </button>
                        ))}

                        {listaVisivel.length === 0 && (
                            <div className="mk-chat__vazio">
                                {busca ? "Nenhuma conversa encontrada." : "Nenhuma conversa iniciada."}
                            </div>
                        )}
                    </div>
                </aside>

                <section className="mk-chat__main">
                    {atual ? (
                        <>
                            <header className="mk-chat__head">
                                <div className="mk-chat__head-who">
                                    <span className="mk-chat__avatar is-lg">
                                        {atual.foto ? (
                                            <img src={atual.foto} alt={atual.contraparte} />
                                        ) : (
                                            iniciais(atual.contraparte)
                                        )}
                                    </span>
                                    <div>
                                        <strong>{atual.contraparte}</strong>
                                        <small>{ehEmpresa ? "Cliente" : "Loja"}</small>
                                    </div>
                                </div>

                                {(atual.pedidoId || atual.produtoTitulo) && (
                                    <div className="mk-chat__link-card">
                                        <div>
                                            {atual.produtoTitulo && <strong>{atual.produtoTitulo}</strong>}
                                            {atual.pedidoId && <small>Pedido #{atual.pedidoId}</small>}
                                        </div>
                                        <span className="mk-chat__link-actions">
                                            {linkProduto && (
                                                <button type="button" onClick={() => navigate(linkProduto)}>
                                                    Ver produto
                                                </button>
                                            )}
                                            {linkPedido && (
                                                <button type="button" onClick={() => navigate(linkPedido)}>
                                                    Ver pedido <ArrowForwardIcon sx={{ fontSize: 12 }} />
                                                </button>
                                            )}
                                        </span>
                                    </div>
                                )}
                            </header>

                            <div className="mk-chat__thread">
                                {atual.msgs.map((m) => {
                                    const minha = m.remetenteTipo === meuTipo;
                                    return (
                                        <div
                                            key={m.id}
                                            className={`mk-chat__row ${minha ? "is-mine" : ""}`}
                                        >
                                            <div className="mk-chat__bubble">
                                                {m.anexoUrl && (
                                                    <img className="mk-chat__image" src={m.anexoUrl} alt="Anexo" />
                                                )}
                                                {m.texto && <p>{m.texto}</p>}
                                                <small>{horaOuData(m.dataEnvio)}</small>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={fimDaConversa} />
                            </div>

                            <div className="mk-chat__composer">
                                {anexo && (
                                    <div className="mk-chat__preview-anexo">
                                        <img src={anexo} alt="Anexo selecionado" />
                                        <button type="button" aria-label="Remover anexo" onClick={() => setAnexo(null)}>
                                            <CloseIcon sx={{ fontSize: 14 }} />
                                        </button>
                                    </div>
                                )}

                                <div className="mk-chat__input-row">
                                    <button
                                        type="button"
                                        className="mk-chat__attach"
                                        aria-label="Anexar imagem"
                                        onClick={() => inputArquivo.current?.click()}
                                    >
                                        <AttachFileIcon sx={{ fontSize: 18 }} />
                                    </button>
                                    <input
                                        ref={inputArquivo}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/avif"
                                        hidden
                                        onChange={escolherAnexo}
                                    />

                                    <input
                                        type="text"
                                        className="mk-chat__text"
                                        placeholder={`Escreva sua mensagem para ${atual.contraparte}...`}
                                        value={texto}
                                        onChange={(e) => setTexto(e.target.value)}
                                        onKeyDown={aoTeclar}
                                    />

                                    <button
                                        type="button"
                                        className="btn btn-warning mk-chat__send"
                                        onClick={enviar}
                                        disabled={!texto.trim() && !anexo}
                                    >
                                        Enviar
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="mk-chat__vazio is-main">
                            {conversas.length === 0
                                ? "Você ainda não tem conversas."
                                : "Selecione uma conversa para começar."}
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}