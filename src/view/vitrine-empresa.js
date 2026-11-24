import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import { mensagemErro } from "../components/toastr";
import { listar } from "../utils/api";
import { formatarMoeda } from "../utils/formatar";
import {
    OPCOES_ORDENACAO,
    avaliacaoDaEmpresa,
    contarAvaliacoesPorProduto,
    descontoDe,
    idEmpresaDo,
    ordenarProdutos,
    parcelasDe,
    precoAtual,
    promocaoAtiva,
    vendasDaEmpresa,
    vendasPorProduto,
} from "../utils/vitrine";

const DADOS_VAZIOS = {
    empresas: [],
    produtos: [],
    avaliacoes: [],
    subpedidos: [],
    itensPedido: [],
};

function ProdutoVitrineCard({ produto, onVerDetalhes }) {
    const navigate = useNavigate();
    const preco = precoAtual(produto);
    const emPromocao = promocaoAtiva(produto);
    const nota = Number(produto.notaMedia) || 0;
    const parcelas = parcelasDe(preco);
    const foto = Array.isArray(produto.fotos) ? produto.fotos.find(Boolean) : produto.fotos;

    return (
        <article className="mk-product">
            <div className="mk-product__media">
                {produto.freteGratis && <span className="mk-badge mk-badge--free">Frete grátis</span>}
                {foto ? (
                    <img src={foto} alt={produto.titulo} loading="lazy" />
                ) : (
                    <span>Foto Produto (WebP)</span>
                )}
            </div>

            <div className="mk-product__body">
                <h3 className="mk-product__title">{produto.titulo}</h3>

                {nota > 0 && (
                    <p className="mk-product__rating">
                        <span>★</span> {nota.toFixed(1)} ({produto.totalAvaliacoes})
                    </p>
                )}

                {emPromocao && (
                    <p className="mk-product__old">
                        <s>{formatarMoeda(produto.preco)}</s>
                        <strong>{Math.round(descontoDe(produto) * 100)}% OFF</strong>
                    </p>
                )}

                <p className="mk-product__price">{formatarMoeda(preco)}</p>

                {parcelas >= 2 && (
                    <p className="mk-product__installments">
                        {parcelas}x de {formatarMoeda(preco / parcelas)} sem juros
                    </p>
                )}
            </div>

            <button
                type="button"
                className="btn btn-warning mk-product__cta"
                onClick={() => navigate(`/produtos/${produto.id}`)}
            >
                Ver Detalhes
            </button>
        </article>
    );
}

export default function VitrineEmpresa() {
    const { idParam } = useParams();
    const navigate = useNavigate();

    const [dados, setDados] = React.useState(null);
    const [ordem, setOrdem] = React.useState("mais-vendidos");

    React.useEffect(() => {
        Promise.all([
            listar("empresas"),
            listar("produtos"),
            listar("avaliacoes"),
            listar("subpedidos"),
            listar("itensPedido"),
        ])
            .then(([empresas, produtos, avaliacoes, subpedidos, itensPedido]) =>
                setDados({ empresas, produtos, avaliacoes, subpedidos, itensPedido })
            )
            .catch(() => {
                mensagemErro("Erro ao carregar a vitrine da loja.");
                setDados(DADOS_VAZIOS);
            });
    }, []);

    const vitrine = React.useMemo(() => {
        if (!dados) return null;

        const empresa = dados.empresas.find((e) => String(e.id) === String(idParam));
        if (!empresa) return { empresa: null };

        const vendasPorProd = vendasPorProduto(dados.itensPedido, dados.subpedidos);
        const avaliacoesPorProd = contarAvaliacoesPorProduto(dados.avaliacoes);

        const produtos = dados.produtos
            .filter((p) => idEmpresaDo(p) === String(empresa.id) && p.status === "ATIVO")
            .map((p) => ({
                ...p,
                vendas: vendasPorProd.get(String(p.id)) ?? 0,
                totalAvaliacoes: avaliacoesPorProd.get(String(p.id)) ?? 0,
            }));

        return {
            empresa,
            produtos,
            avaliacao: avaliacaoDaEmpresa(dados.avaliacoes, empresa.id),
            totalVendas: vendasDaEmpresa(dados.subpedidos, empresa.id),
        };
    }, [dados, idParam]);

    const produtosOrdenados = React.useMemo(
        () => ordenarProdutos(vitrine?.produtos ?? [], ordem),
        [vitrine, ordem]
    );

    if (dados === null) {
        return <div className="text-center my-4">Carregando vitrine...</div>;
    }

    if (!vitrine.empresa) {
        return (
            <div className="mk-empty">
                Loja não encontrada.
                <div>
                    <button
                        type="button"
                        className="btn btn-warning btn-sm mt-3"
                        onClick={() => navigate("/listagem-empresa")}
                    >
                        Voltar
                    </button>
                </div>
            </div>
        );
    }

    const { empresa, avaliacao, totalVendas, produtos } = vitrine;

    return (
        <section className="mk-vitrine">
            <header className="mk-vitrine__head">
                <span className="mk-vitrine__logo">
                    {empresa.logoUrl ? (
                        <img src={empresa.logoUrl} alt={empresa.nomeFantasia} />
                    ) : (
                        empresa.nomeFantasia?.charAt(0)
                    )}
                </span>

                <div className="mk-vitrine__info">
                    <h1>
                        {empresa.nomeFantasia}
                        {empresa.statusVerificacao === "VERIFICADA" && (
                            <span className="mk-vitrine__badge">✓ Loja oficial</span>
                        )}
                    </h1>

                    <p className="mk-vitrine__meta">
                        {avaliacao.media !== null ? (
                            <>
                                <strong>★ {avaliacao.media.toFixed(1)}</strong>{" "}
                                ({avaliacao.total} avaliações da loja)
                            </>
                        ) : (
                            "Ainda sem avaliações"
                        )}
                        {" • "}
                        {totalVendas} {totalVendas === 1 ? "venda" : "vendas"}
                    </p>

                    {empresa.descricao && <p className="mk-vitrine__desc">{empresa.descricao}</p>}
                </div>

                <button
                    type="button"
                    className="btn btn-warning"
                    onClick={() => navigate("/mensagens", { state: { empresaId: empresa.id } })}
                >
                    💬 Falar com a Loja
                </button>
            </header>

            <div className="mk-vitrine__toolbar">
                <h2>Todos os Produtos da Loja ({produtos.length})</h2>

                <div className="mk-periodos">
                    {OPCOES_ORDENACAO.map((o) => (
                        <button
                            key={o.chave}
                            type="button"
                            className={ordem === o.chave ? "is-active" : ""}
                            onClick={() => setOrdem(o.chave)}
                        >
                            {o.rotulo}
                        </button>
                    ))}
                </div>
            </div>

            {produtosOrdenados.length === 0 ? (
                <div className="mk-empty">
                    {ordem === "ofertas"
                        ? "Nenhuma oferta ativa nesta loja."
                        : "Esta loja ainda não possui produtos ativos."}
                </div>
            ) : (
                <div className="mk-vitrine__grid">
                    {produtosOrdenados.map((p) => (
                        <ProdutoVitrineCard
                            key={p.id}
                            produto={p}
                            onVerDetalhes={(id) => navigate(`/produto/${id}`)}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
