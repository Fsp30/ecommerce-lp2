import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import PageHeader from "../../components/page-header";
import { mensagemErro } from "../../components/toastr";
import { PARCELAS_MAX, buscarProdutoDetalhe } from "../../utils/produtos";
import { formatarData, formatarMoeda } from "../../utils/formatar";

function Estrelas({ valor }) {
    const cheias = Math.round(Number(valor) || 0);
    return (
        <span className="mk-stars-view" aria-label={`${cheias} de 5 estrelas`}>
            {"★".repeat(cheias)}
            {"☆".repeat(5 - cheias)}
        </span>
    );
}

export default function ProdutoDetalhe() {
    const { idProduto } = useParams();
    const navigate = useNavigate()

    const [produto, setProduto] = React.useState(undefined);
    const [indiceFoto, setIndiceFoto] = React.useState(0);
    const [quantidade, setQuantidade] = React.useState(1);
    const [cep, setCep] = React.useState("");
    const [frete, setFrete] = React.useState(null);

    React.useEffect(() => {
        setProduto(undefined);
        setIndiceFoto(0);
        setQuantidade(1);
        buscarProdutoDetalhe(idProduto)
            .then(setProduto)
            .catch(() => {
                mensagemErro("Erro ao carregar o produto.");
                setProduto(null);
            });
    }, [idProduto]);

    if (produto === undefined) {
        return <div className="text-center my-4">Carregando produto...</div>;
    }

    if (produto === null) {
        return <div className="mk-empty">Produto não encontrado.</div>;
    }

    const esgotado = produto.disponivel <= 0;
    const fotoAtual = produto.fotos[indiceFoto];

    function alterarQuantidade(delta) {
        setQuantidade((q) => Math.min(Math.max(1, q + delta), Math.max(1, produto.disponivel)));
    }

    function calcularFrete() {
        if (!/^\d{5}-?\d{3}$/.test(cep.trim())) {
            mensagemErro("Informe um CEP válido.");
            return;
        }
        setFrete(produto.freteGratis ? { gratis: true } : { gratis: false });
    }

    return (
        <>
            <PageHeader
                trail={["Produtos", produto.titulo]}
                title={produto.titulo}
            />

            <div className="mk-pdp">
                <section className="mk-pdp__gallery">
                    <div className="mk-pdp__main">
                        {fotoAtual ? (
                            <img src={fotoAtual} alt={produto.titulo} />
                        ) : (
                            <span>Imagem Principal do Produto (WebP máx 100KB)</span>
                        )}
                        {produto.freteGratis && <span className="mk-badge mk-badge--free">Frete grátis</span>}
                        <span className={`mk-badge ${produto.usado ? "mk-badge--used" : "mk-badge--new"}`}>
                            {produto.usado ? "Usado" : "Novo"}
                        </span>
                    </div>

                    {produto.fotos.length > 1 && (
                        <div className="mk-pdp__thumbs">
                            {produto.fotos.map((f, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    className={i === indiceFoto ? "is-active" : ""}
                                    onClick={() => setIndiceFoto(i)}
                                    aria-label={`Foto ${i + 1}`}
                                >
                                    <img src={f} alt="" />
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                <section className="mk-pdp__info">
                    <h1>{produto.titulo}</h1>

                    {produto.totalAvaliacoes > 0 || produto.notaMedia > 0 ? (
                        <p className="mk-pdp__rating">
                            <Estrelas valor={produto.notaMedia} />
                            <strong>{produto.notaMedia.toFixed(1)}</strong>
                            <span>({produto.totalAvaliacoes} avaliações)</span>
                        </p>
                    ) : null}

                    {produto.emPromocao && (
                        <p className="mk-pdp__old">
                            De: <s>{formatarMoeda(produto.precoOriginal)}</s>
                        </p>
                    )}
                    <p className="mk-pdp__price">{formatarMoeda(produto.preco)}</p>
                    <p className="mk-pdp__installments">
                        ou até {PARCELAS_MAX}x de {formatarMoeda(produto.preco / PARCELAS_MAX)} sem juros no cartão
                    </p>

                    <p className={`mk-pdp__stock ${esgotado ? "is-out" : ""}`}>
                        {esgotado ? "Esgotado" : `✓ Em estoque (${produto.disponivel} unidades)`}
                    </p>

                    <div className="mk-pdp__qty">
                        <span>Quantidade:</span>
                        <div className="mk-qty">
                            <button type="button" onClick={() => alterarQuantidade(-1)} disabled={esgotado || quantidade <= 1}>
                                -
                            </button>
                            <span>{esgotado ? 0 : quantidade}</span>
                            <button
                                type="button"
                                onClick={() => alterarQuantidade(1)}
                                disabled={esgotado || quantidade >= produto.disponivel}
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <button type="button" className="btn btn-warning w-100 mk-pdp__cta" disabled>
                        Comprar Agora
                    </button>
                    <button type="button" className="btn mk-pdp__cta-outline w-100" disabled>
                        Adicionar ao Carrinho
                    </button>

                    <div className="mk-pdp__seller">
                        <div>
                            <strong>{produto.empresaNome}</strong>
                            <small>Loja Parceira</small>
                        </div>
                    </div>

                    <div className="mk-pdp__shipping">
                        <span>Simular frete:</span>
                        <input
                            type="text"
                            placeholder="00000-000"
                            value={cep}
                            onChange={(e) => setCep(e.target.value)}
                            className="form-control"
                        />
                        <button type="button" className="btn btn-dark btn-sm" onClick={calcularFrete}>
                            Calcular
                        </button>
                    </div>
                    {frete && (
                        <p className="mk-pdp__frete">
                            {frete.gratis ? (
                                <strong className="mk-ok">Frete grátis para este produto</strong>
                            ) : (
                                <span>O valor do frete é calculado no checkout.</span>
                            )}
                        </p>
                    )}
                </section>
            </div>

            <section className="mk-card mk-pdp__reviews">
                <div className="mk-pdp__reviews-head">
                    <div>
                        <h2>Avaliações de Clientes ({produto.totalAvaliacoes})</h2>
                        <p className="mk-muted">Opiniões de compradores com fotos reais anexadas</p>
                    </div>
                    <div className="mk-pdp__score">
                        <strong>{produto.notaMedia.toFixed(1)}</strong>
                        <Estrelas valor={produto.notaMedia} />
                        {produto.totalAvaliacoes > 0 && (
                            <small>{produto.recomendacao}% recomendam este produto</small>
                        )}
                    </div>
                    <button
                        type="button"
                        className="mk-link-btn mk-link-btn--danger"
                        onClick={() => navigate(`/denunciar/produto/${produto.id}`)}
                    >
                        Denunciar produto
                    </button>
                </div>

                {produto.avaliacoes.length === 0 ? (
                    <div className="mk-empty">Este produto ainda não tem avaliações.</div>
                ) : (
                    <div className="mk-reviews">
                        {produto.avaliacoes.map((a) => (
                            <article key={a.id} className="mk-review">
                                <header>
                                    <span className="mk-review__avatar">{a.autor.charAt(0)}</span>
                                    <div>
                                        <strong>{a.autor}</strong>
                                        <small>
                                            {a.compraVerificada && <span className="mk-verified">✓ Compra verificada</span>}
                                            {a.compraVerificada && " • "}
                                            {formatarData(a.data)}
                                        </small>
                                    </div>
                                    <Estrelas valor={a.nota} />
                                </header>

                                <p>{a.comentario}</p>

                                {a.fotos.length > 0 && (
                                    <div className="mk-review__photos">
                                        {a.fotos.map((f, i) => (
                                            <img key={i} src={f} alt={`Foto da avaliação ${i + 1}`} />
                                        ))}
                                    </div>
                                )}
                                {!a.recomenda && <small className="mk-muted">Não recomenda este produto</small>}
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <section className="mk-card mk-pdp__desc">
                <h2>Descrição do Produto</h2>
                <p>{produto.descricao || "Sem descrição."}</p>
            </section>
        </>
    );
}