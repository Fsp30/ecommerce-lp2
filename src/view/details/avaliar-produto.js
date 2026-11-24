import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import PageHeader from "../../components/page-header";
import Drop from "../../components/drop-card";
import ProductImageGrid from "../../components/product-image-grid";
import { mensagemErro, mensagemSucesso } from "../../components/toastr";
import { MAX_FOTOS, buscarItemParaAvaliar, publicarAvaliacao } from "../../utils/avaliacoes";

const MAX_BYTES = 2 * 1024 * 1024;

export default function AvaliarProduto() {
    const { idCliente, idItemPedido } = useParams();
    const navigate = useNavigate();

    const [dados, setDados] = React.useState(undefined);
    const [nota, setNota] = React.useState(0);
    const [recomenda, setRecomenda] = React.useState(null);
    const [comentario, setComentario] = React.useState("");
    const [arquivos, setArquivos] = React.useState([]);
    const [enviando, setEnviando] = React.useState(false);
    const [concluida, setConcluida] = React.useState(false);

    React.useEffect(() => {
        setDados(undefined);
        buscarItemParaAvaliar(idCliente, idItemPedido)
            .then(setDados)
            .catch(() => {
                mensagemErro("Erro ao carregar o item.");
                setDados(null);
            });
    }, [idCliente, idItemPedido]);

    function adicionarFotos(novas) {
        const imagens = novas.filter((f) => f.type.startsWith("image/"));
        const pequenas = imagens.filter((f) => f.size <= MAX_BYTES);

        if (pequenas.length !== novas.length) {
            mensagemErro("Use apenas imagens de até 2MB.");
        }

        const disponiveis = MAX_FOTOS - arquivos.length;
        if (disponiveis <= 0) {
            mensagemErro(`Você pode enviar até ${MAX_FOTOS} fotos.`);
            return;
        }
        if (pequenas.length > disponiveis) {
            mensagemErro(`Você pode enviar mais ${disponiveis} foto(s).`);
        }

        setArquivos((atual) => [...atual, ...pequenas.slice(0, disponiveis)]);
    }

    async function enviar() {
        if (nota < 1) return mensagemErro("Selecione uma nota de 1 a 5.");
        if (recomenda === null) return mensagemErro("Informe se você recomenda o produto.");

        setEnviando(true);
        try {
            const enviadas = await publicarAvaliacao({
                idCliente,
                dadosItem: dados,
                nota,
                recomenda,
                comentario,
                arquivos,
            });

            if (enviadas === 0) {
                mensagemErro("Este item já foi avaliado.");
                return;
            }

            mensagemSucesso("Avaliação enviada com sucesso! Obrigado pelo seu feedback.");
            setConcluida(true);
        } catch {
            mensagemErro("Erro ao enviar a avaliação.");
        } finally {
            setEnviando(false);
        }
    }

    if (dados === undefined) {
        return <div className="text-center my-4">Carregando item...</div>;
    }

    if (dados === null) {
        return <div className="mk-empty">Item não encontrado para este cliente.</div>;
    }

    const jaAvaliado = dados.avaliouProduto && dados.avaliouLoja;

    return (
        <>
            <PageHeader
                trail={["Minha conta", "Pedidos", "Avaliar"]}
                title="Avaliação"
                subtitle="Gerencie feedbacks e depoimentos de produtos comprados"
            >
                <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => navigate(`/clientes/${idCliente}/pedidos`)}
                >
                    ← Voltar
                </button>
            </PageHeader>

            <div className="mk-review-grid">
                <section className="mk-card">
                    <h2>Avaliar Produto/Loja</h2>
                    <p className="mk-muted">Sua avaliação ajuda outros clientes a comprar melhor.</p>

                    <div className="mk-review-product">
                        <div className="mk-review-product__media">
                            {dados.foto ? <img src={dados.foto} alt={dados.titulo} /> : <span>WebP</span>}
                        </div>
                        <div>
                            <strong>{dados.titulo}</strong>
                            <small>{dados.lojaNome}</small>
                        </div>
                    </div>

                    {jaAvaliado || concluida ? (
                        <div className="mk-alert is-ok">
                            {concluida ? "Avaliação enviada com sucesso!" : "Você já avaliou este item."}
                        </div>
                    ) : (
                        <>
                            <div className="mk-review-field">
                                <label>Nota Geral:</label>
                                <div className="mk-stars-input" role="radiogroup" aria-label="Nota">
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <button
                                            key={n}
                                            type="button"
                                            className={n <= nota ? "is-on" : ""}
                                            aria-label={`${n} estrelas`}
                                            onClick={() => setNota(n)}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mk-review-field">
                                <label>Você recomenda este produto/loja?</label>
                                <div className="mk-toggle">
                                    <button
                                        type="button"
                                        className={recomenda === true ? "is-active" : ""}
                                        onClick={() => setRecomenda(true)}
                                    >
                                        Sim
                                    </button>
                                    <button
                                        type="button"
                                        className={recomenda === false ? "is-active" : ""}
                                        onClick={() => setRecomenda(false)}
                                    >
                                        Não
                                    </button>
                                </div>
                            </div>

                            <div className="mk-review-field">
                                <label htmlFor="comentario">Seu Comentário</label>
                                <textarea
                                    id="comentario"
                                    rows={4}
                                    className="form-control"
                                    placeholder="Conte como foi sua experiência..."
                                    value={comentario}
                                    onChange={(e) => setComentario(e.target.value)}
                                />
                            </div>

                            <div className="mk-review-field">
                                <label>Fotos do Produto (Máx {MAX_FOTOS} imagens de até 2MB)</label>
                                {arquivos.length < MAX_FOTOS && (
                                    <Drop size="sm" onFilesSelected={adicionarFotos} />
                                )}
                                <div className="mk-review-photos">
                                    <ProductImageGrid files={arquivos} onChange={setArquivos} />
                                </div>
                            </div>

                            <div className="mk-review-actions">
                                <button type="button" className="btn btn-warning" onClick={enviar} disabled={enviando}>
                                    {enviando ? "Enviando..." : "Enviar Avaliação"}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() => navigate(`/clientes/${idCliente}/pedidos`)}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </>
                    )}
                </section>
            </div>
        </>
    );
}