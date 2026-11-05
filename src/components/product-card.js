import React from "react";
import { useNavigate } from "react-router-dom";

export const PARCELAS_MAX = 12;

const moeda = (n) =>
    Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const hoje = () => new Date().toISOString().slice(0, 10);

function promocaoAtiva(p) {
    if (p.precoPromocional == null) return false;
    const h = hoje();
    if (p.dataPromocaoInicio && h < p.dataPromocaoInicio) return false;
    if (p.dataPromocaoFim && h > p.dataPromocaoFim) return false;
    return true;
}

export function normalizar(p, empresas = new Map()) {
    const emPromocao = promocaoAtiva(p);
    return {
        id: p.id,
        titulo: p.titulo,
        vendedor: empresas.get(String(p.empresa))?.nomeFantasia ?? null,
        nota: p.notaMedia ?? null,
        recomendacao: p.percentualRecomendacao ?? null,
        preco: emPromocao ? p.precoPromocional : p.preco,
        precoOriginal: emPromocao ? p.preco : null,
        emPromocao,
        freteGratis: Boolean(p.freteGratis),
        usado: String(p.condicao).toUpperCase() === "USADO",
        imagem: p.fotos?.find(Boolean) ?? null,
        ativo: p.status === "ATIVO",
        disponivel: (p.estoqueQuantidade ?? 0) - (p.estoqueReservado ?? 0) > 0,
    };
}

export default function ProductCard({ produto, destaque = false }) {
    const navigate = useNavigate();
    const p = produto;
    const desconto = p.emPromocao
        ? Math.round((1 - p.preco / p.precoOriginal) * 100)
        : 0;

    return (
        <article className={`mk-product${destaque ? " is-featured" : ""}`}>
            <div className="mk-product__media">
                {p.imagem ? (
                    <img src={p.imagem} alt={p.titulo} loading="lazy" />
                ) : (
                    "Foto do Produto (WebP)"
                )}
                {p.freteGratis && <span className="mk-badge mk-badge--free">Frete grátis</span>}
                <span className={`mk-badge ${p.usado ? "mk-badge--used" : "mk-badge--new"}`}>
                    {p.usado ? "Usado" : "Novo"}
                </span>
            </div>

            <div className="mk-product__body">
                {p.vendedor && (
                    <p className="mk-product__seller">
                        Vendido por: <strong>{p.vendedor}</strong>
                    </p>
                )}
                <h3 className="mk-product__title">{p.titulo}</h3>
                {p.nota != null && (
                    <p className="mk-product__rating">
                        <span>★</span> {Number(p.nota).toFixed(1)}
                        {p.recomendacao != null && ` · ${Math.round(p.recomendacao)}% recomendam`}
                    </p>
                )}

                {p.emPromocao && (
                    <p className="mk-product__old">
                        <s>{moeda(p.precoOriginal)}</s> <strong>{desconto}% OFF</strong>
                    </p>
                )}
                <p className="mk-product__price">{moeda(p.preco)}</p>
                <p className="mk-product__installments">
                    até {PARCELAS_MAX}x de {moeda(p.preco / PARCELAS_MAX)} sem juros
                </p>
            </div>

            <button
                type="button"
                className="btn btn-warning mk-product__cta"
                onClick={() => navigate(`/cadastro-produtos/${p.id}`)}
            >
                Ver Detalhes
            </button>
        </article>
    );
}