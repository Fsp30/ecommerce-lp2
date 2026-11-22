import React from "react";

import AdminLayout from "../../components/admin-layout";
import PageHeader from "../../components/page-header";
import { mensagemErro, mensagemSucesso } from "../../components/toastr";
import { atualizar, listar, porId } from "../../utils/api";

const ROTULO_ALVO = { PRODUTO: "Produto", EMPRESA: "Empresa", USUARIO: "Usuário", AVALIACAO: "Avaliação" };
const ROTULO_QUEM = { CLIENTE: "Cliente", EMPRESA: "Empresa" };

function nomeDenunciante(d, mapas) {
    const id = String(d.idDenunciante);
    if (d.denuncianteTipo === "CLIENTE") return mapas.clientes.get(id)?.nomeCompleto ?? "—";
    if (d.denuncianteTipo === "EMPRESA") return mapas.empresas.get(id)?.nomeFantasia ?? "—";
    return "—";
}

function descreverAlvo(d, mapas) {
    const id = String(d.idAlvo);

    if (d.tipoAlvo === "PRODUTO") {
        const produto = mapas.produtos.get(id);
        return {
            nome: produto?.titulo ?? "Produto removido",
            loja: mapas.empresas.get(String(produto?.empresa))?.nomeFantasia ?? "—",
        };
    }
    if (d.tipoAlvo === "EMPRESA") {
        const nome = mapas.empresas.get(id)?.nomeFantasia ?? "—";
        return { nome, loja: nome };
    }
    if (d.tipoAlvo === "USUARIO") {
        return { nome: mapas.usuarios.get(id)?.nome ?? "—", loja: "—" };
    }
    return { nome: `#${d.idAlvo}`, loja: "—" };
}

export default function ModeracaoCentral() {
    const [dados, setDados] = React.useState(null);

    React.useEffect(() => {
        Promise.all([
            listar("denuncias"),
            listar("avaliacoes"),
            listar("produtos"),
            listar("clientes"),
            listar("empresas"),
            listar("usuarios"),
        ])
            .then(([denuncias, avaliacoes, produtos, clientes, empresas, usuarios]) =>
                setDados({ denuncias, avaliacoes, produtos, clientes, empresas, usuarios })
            )
            .catch(() => {
                mensagemErro("Erro ao carregar a central de moderação.");
                setDados({ denuncias: [], avaliacoes: [], produtos: [], clientes: [], empresas: [], usuarios: [] });
            });
    }, []);

    const mapas = React.useMemo(
        () =>
            dados && {
                produtos: porId(dados.produtos),
                clientes: porId(dados.clientes),
                empresas: porId(dados.empresas),
                usuarios: porId(dados.usuarios),
            },
        [dados]
    );

    async function resolver(denuncia) {
        try {
            await atualizar("denuncias", denuncia.id, { status: "RESOLVIDA" });
            setDados((atual) => ({
                ...atual,
                denuncias: atual.denuncias.map((d) => (d.id === denuncia.id ? { ...d, status: "RESOLVIDA" } : d)),
            }));
            mensagemSucesso("Denúncia marcada como resolvida.");
        } catch {
            mensagemErro("Erro ao resolver a denúncia.");
        }
    }

    async function inativarProduto(denuncia) {
        if (!window.confirm("Inativar este produto e encerrar a denúncia?")) return;

        try {
            await atualizar("produtos", denuncia.idAlvo, { status: "INATIVO" });
            await atualizar("denuncias", denuncia.id, { status: "RESOLVIDA", acaoTomada: "PRODUTO_INATIVADO" });
            setDados((atual) => ({
                ...atual,
                produtos: atual.produtos.map((p) =>
                    String(p.id) === String(denuncia.idAlvo) ? { ...p, status: "INATIVO" } : p
                ),
                denuncias: atual.denuncias.map((d) =>
                    d.id === denuncia.id ? { ...d, status: "RESOLVIDA", acaoTomada: "PRODUTO_INATIVADO" } : d
                ),
            }));
            mensagemSucesso("Produto inativado e denúncia resolvida.");
        } catch {
            mensagemErro("Erro ao inativar o produto.");
        }
    }

    async function moderarAvaliacao(avaliacao, novoStatus) {
        if (novoStatus === "REMOVIDA" && !window.confirm("Remover esta avaliação da plataforma?")) return;

        try {
            await atualizar("avaliacoes", avaliacao.id, { status: novoStatus });

            const avaliacoes = dados.avaliacoes.map((a) =>
                a.id === avaliacao.id ? { ...a, status: novoStatus } : a
            );
            let produtos = dados.produtos;

            if (avaliacao.idProduto) {
                const publicadas = avaliacoes.filter(
                    (a) => String(a.idProduto) === String(avaliacao.idProduto) && a.status === "PUBLICADA"
                );
                const notaMedia = publicadas.length
                    ? Number((publicadas.reduce((soma, a) => soma + Number(a.nota), 0) / publicadas.length).toFixed(1))
                    : 0;
                const percentualRecomendacao = publicadas.length
                    ? Math.round((publicadas.filter((a) => a.recomenda).length * 100) / publicadas.length)
                    : 0;

                await atualizar("produtos", avaliacao.idProduto, { notaMedia, percentualRecomendacao });
                produtos = produtos.map((p) =>
                    String(p.id) === String(avaliacao.idProduto) ? { ...p, notaMedia, percentualRecomendacao } : p
                );
            }

            setDados({ ...dados, avaliacoes, produtos });
            mensagemSucesso(novoStatus === "REMOVIDA" ? "Avaliação removida." : "Avaliação mantida como publicada.");
        } catch {
            mensagemErro("Erro ao moderar a avaliação.");
        }
    }

    const denunciasPendentes = dados ? dados.denuncias.filter((d) => d.status !== "RESOLVIDA") : [];
    const avaliacoesReportadas = dados ? dados.avaliacoes.filter((a) => a.status === "REPORTADA") : [];
    const VAZIO = "Nenhuma denúncia ou avaliação pendente de moderação";

    return (
        <AdminLayout>
            <PageHeader
                trail={["Administração", "Moderação"]}
                title="Central de Moderação e Fila de Denúncias"
                subtitle="Modere avaliações reportadas e resolva denúncias de produtos, empresas e usuários"
            />

            {dados === null ? (
                <div className="text-center my-4">Carregando moderação...</div>
            ) : (
                <>
                    <h2 className="mk-mod-section">🚨 Fila de Denúncias Pendentes (RF44.1)</h2>

                    {denunciasPendentes.length === 0 && <div className="mk-empty">{VAZIO}</div>}

                    {denunciasPendentes.map((d) => {
                        const alvo = descreverAlvo(d, mapas);
                        const rotuloAlvo = ROTULO_ALVO[d.tipoAlvo] ?? d.tipoAlvo;

                        return (
                            <article key={d.id} className="mk-mod-card mk-mod-card--danger">
                                <div className="mk-mod-card__head">
                                    <span className="mk-pill mk-pill--danger">ALVO: {rotuloAlvo.toUpperCase()}</span>
                                    <h3>{`Denúncia #DEN-${d.id} — ${rotuloAlvo}: "${alvo.nome}"`}</h3>
                                </div>

                                <p>
                                    <strong>Motivo:</strong> {`"${d.motivo}"`}
                                </p>
                                <small>
                                    Denunciado por: {nomeDenunciante(d, mapas)} ({ROTULO_QUEM[d.denuncianteTipo] ?? "—"})
                                    {alvo.loja !== "—" && ` • Alvo: ${alvo.loja}`} • Status:{" "}
                                    <strong className="mk-negative">{d.status.replace("_", " ")}</strong>
                                </small>

                                <div className="mk-mod-card__actions">
                                    {d.tipoAlvo === "PRODUTO" && (
                                        <button type="button" className="btn btn-danger btn-sm" onClick={() => inativarProduto(d)}>
                                            🛑 Inativar Produto
                                        </button>
                                    )}
                                    <button type="button" className="btn btn-dark btn-sm" onClick={() => resolver(d)}>
                                        ✓ Marcar Resolvida
                                    </button>
                                </div>
                            </article>
                        );
                    })}

                    <h2 className="mk-mod-section">⭐ Moderação de Avaliações de Clientes (RF44)</h2>

                    {avaliacoesReportadas.length === 0 && <div className="mk-empty">{VAZIO}</div>}

                    {avaliacoesReportadas.map((a) => {
                        const ehProduto = Boolean(a.idProduto);
                        const alvo = ehProduto
                            ? mapas.produtos.get(String(a.idProduto))?.titulo ?? "Produto removido"
                            : mapas.empresas.get(String(a.idEmpresa))?.nomeFantasia ?? "—";
                        const autor = mapas.clientes.get(String(a.idCliente))?.nomeCompleto ?? "—";
                        const denuncia = dados.denuncias.find(
                            (d) => d.tipoAlvo === "AVALIACAO" && String(d.idAlvo) === String(a.id)
                        );
                        const reportadaPor = denuncia ? ROTULO_QUEM[denuncia.denuncianteTipo] : null;

                        return (
                            <article key={a.id} className="mk-mod-card">
                                <div className="mk-mod-card__head">
                                    <span className="mk-pill mk-pill--warn">
                                        AVALIAÇÃO {ehProduto ? "PRODUTO" : "EMPRESA"}
                                    </span>
                                    <h3>{`Avaliação ${ehProduto ? "no Produto" : "na Empresa"} "${alvo}"`}</h3>
                                </div>

                                <p>{`Comentário denunciado: "${a.comentario}"`}</p>
                                <small>
                                    Publicada por: {autor} • Nota atribuída: ★ {Number(a.nota).toFixed(1)}
                                    {reportadaPor && ` • Reportado por: ${reportadaPor}`}
                                </small>

                                <div className="mk-mod-card__actions">
                                    <button
                                        type="button"
                                        className="btn btn-outline-success btn-sm"
                                        onClick={() => moderarAvaliacao(a, "PUBLICADA")}
                                    >
                                        ✓ Manter Publicada
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-danger btn-sm"
                                        onClick={() => moderarAvaliacao(a, "REMOVIDA")}
                                    >
                                        🗑️ Remover Avaliação
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </>
            )}
        </AdminLayout>
    );
}