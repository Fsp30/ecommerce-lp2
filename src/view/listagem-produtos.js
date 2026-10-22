import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/Delete";

import PageHeader from "../components/page-header";
import Pagination from "../components/pagination";
import { mensagemSucesso, mensagemErro } from "../components/toastr";
import { BASE_URL } from "../config/axios";

const baseURL = `${BASE_URL}/produtos`;
const POR_PAGINA = 6;
const FILTROS_VAZIOS = { min: "", max: "", novo: false, usado: false, frete: false, nota: 0, sub: null };

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const numero = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};

const condicaoDe = (p) => {
    const c = String(p.condicao ?? "").toLowerCase();
    if (c.includes("usad")) return "usado";
    if (c.includes("nov")) return "novo";
    return "";
};

const vendedorDe = (p) =>
    typeof p.empresa === "object" && p.empresa !== null
        ? p.empresa.nomeFantasia || p.empresa.razaoSocial || ""
        : p.empresa || "";

const subcategoriasDe = (p) =>
    Array.isArray(p.categorias) ? p.categorias.map((c) => (typeof c === "object" ? c.nome : c)).filter(Boolean) : [];

const parcelasDe = (preco) => Math.min(12, Math.floor(preco / 50));

function ProdutoCard({ produto, onEditar, onExcluir }) {
    const preco = numero(produto.preco);
    const condicao = condicaoDe(produto);
    const foto = Array.isArray(produto.fotos) ? produto.fotos[0] : produto.fotos;
    const nota = numero(produto.notaMedia);
    const avaliacoes = produto.totalAvaliacoes ?? produto.qtdAvaliacoes;
    const vendedor = vendedorDe(produto);
    const parcelas = parcelasDe(preco);

    return (
        <article className="mk-product">
            <div className="mk-product__media">
                {produto.freteGratis && <span className="mk-badge mk-badge--free">Frete grátis</span>}
                {condicao && (
                    <span className={`mk-badge ${condicao === "novo" ? "mk-badge--new" : "mk-badge--used"}`}>{condicao}</span>
                )}
                {foto ? <img src={foto} alt={produto.titulo} /> : <span>Foto do Produto (WebP)</span>}
                <div className="mk-product__admin">
                    <button type="button" className="mk-icon-btn" aria-label="Editar" onClick={() => onEditar(produto.id)}>
                        <EditOutlinedIcon fontSize="inherit" />
                    </button>
                    <button type="button" className="mk-icon-btn is-danger" aria-label="Excluir" onClick={() => onExcluir(produto.id)}>
                        <DeleteOutlineIcon fontSize="inherit" />
                    </button>
                </div>
            </div>
            <div className="mk-product__body">
                {vendedor && (
                    <p className="mk-product__seller">
                        Vendido por: <strong>{vendedor}</strong>
                    </p>
                )}
                <h3 className="mk-product__title">{produto.titulo}</h3>
                {nota > 0 && (
                    <p className="mk-product__rating">
                        <span>★</span> {nota.toFixed(1)}
                        {avaliacoes !== undefined && ` (${avaliacoes} avaliações)`}
                    </p>
                )}
                <p className="mk-product__price">{brl.format(preco)}</p>
                {parcelas >= 2 && (
                    <p className="mk-product__installments">
                        {parcelas}x de {brl.format(preco / parcelas)} sem juros
                    </p>
                )}
            </div>
            <button type="button" className="btn btn-warning mk-product__cta" onClick={() => onEditar(produto.id)}>
                Ver Detalhes
            </button>
        </article>
    );
}

export default function ListagemProdutos() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const busca = (params.get("busca") || "").trim().toLowerCase();

    const [dados, setDados] = React.useState(null);
    const [rascunho, setRascunho] = React.useState(FILTROS_VAZIOS);
    const [aplicados, setAplicados] = React.useState(FILTROS_VAZIOS);
    const [ordem, setOrdem] = React.useState("padrao");
    const [pagina, setPagina] = React.useState(1);

    const cadastrar = () => navigate(`/cadastro-produtos`);
    const editar = (id) => navigate(`/cadastro-produtos/${id}`);

    async function excluir(id) {
        try {
            await axios.delete(`${baseURL}/${id}`);
            mensagemSucesso("Produto excluído com sucesso!");
            setDados((atual) => atual.filter((dado) => dado.id !== id));
        } catch (error) {
            mensagemErro("Erro ao excluir o produto");
        }
    }

    React.useEffect(() => {
        axios.get(baseURL).then((response) => setDados(response.data));
    }, []);

    React.useEffect(() => {
        setPagina(1);
    }, [aplicados, ordem, busca]);

    const filtrados = React.useMemo(() => {
        if (!dados) return [];
        const min = rascunhoNumero(aplicados.min);
        const max = rascunhoNumero(aplicados.max);

        const lista = dados.filter((p) => {
            const preco = numero(p.preco);
            const condicao = condicaoDe(p);
            if (busca && !`${p.titulo ?? ""} ${vendedorDe(p)}`.toLowerCase().includes(busca)) return false;
            if (min !== null && preco < min) return false;
            if (max !== null && preco > max) return false;
            if ((aplicados.novo || aplicados.usado) && !((aplicados.novo && condicao === "novo") || (aplicados.usado && condicao === "usado"))) return false;
            if (aplicados.frete && !p.freteGratis) return false;
            if (aplicados.nota && numero(p.notaMedia) < aplicados.nota) return false;
            if (aplicados.sub && !subcategoriasDe(p).includes(aplicados.sub)) return false;
            return true;
        });

        const ordenacoes = {
            menor: (a, b) => numero(a.preco) - numero(b.preco),
            maior: (a, b) => numero(b.preco) - numero(a.preco),
            nota: (a, b) => numero(b.notaMedia) - numero(a.notaMedia),
        };
        return ordenacoes[ordem] ? [...lista].sort(ordenacoes[ordem]) : lista;
    }, [dados, aplicados, ordem, busca]);

    if (!dados) return null;

    const contagem = {
        novo: dados.filter((p) => condicaoDe(p) === "novo").length,
        usado: dados.filter((p) => condicaoDe(p) === "usado").length,
    };
    const subcategorias = Object.entries(
        dados.flatMap(subcategoriasDe).reduce((acc, nome) => ({ ...acc, [nome]: (acc[nome] || 0) + 1 }), {})
    );

    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
    const visiveis = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
    const atualizar = (campo, valor) => setRascunho((atual) => ({ ...atual, [campo]: valor }));
    const limpar = () => {
        setRascunho(FILTROS_VAZIOS);
        setAplicados(FILTROS_VAZIOS);
    };

    return (
        <>
            <PageHeader trail={["Produtos"]} title="Produtos" count={`${filtrados.length} produtos encontrados`}>
                <label className="mk-sort">
                    Ordenar por:
                    <select value={ordem} onChange={(e) => setOrdem(e.target.value)}>
                        <option value="padrao">Relevância</option>
                        <option value="menor">Menor preço</option>
                        <option value="maior">Maior preço</option>
                        <option value="nota">Melhor avaliados</option>
                    </select>
                </label>
                <button type="button" className="btn btn-warning btn-sm" onClick={cadastrar}>
                    Novo Produto
                </button>
            </PageHeader>

            <div className="mk-shop">
                <aside className="mk-filters" aria-label="Filtros">
                    <div className="mk-filters__head">
                        <h2>Filtros</h2>
                        <button type="button" onClick={limpar}>Limpar</button>
                    </div>

                    {subcategorias.length > 0 && (
                        <div className="mk-filter-group">
                            <h3>Subcategorias</h3>
                            <ul>
                                {subcategorias.map(([nome, qtd]) => (
                                    <li key={nome}>
                                        <button
                                            type="button"
                                            className={`mk-sublink ${rascunho.sub === nome ? "is-active" : ""}`}
                                            onClick={() => atualizar("sub", rascunho.sub === nome ? null : nome)}
                                        >
                                            • {nome} ({qtd})
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="mk-filter-group">
                        <h3>Faixa de Preço</h3>
                        <div className="mk-price">
                            <input type="number" min="0" placeholder="R$ 0,00" value={rascunho.min} onChange={(e) => atualizar("min", e.target.value)} />
                            até
                            <input type="number" min="0" placeholder="R$ 0,00" value={rascunho.max} onChange={(e) => atualizar("max", e.target.value)} />
                        </div>
                    </div>

                    <div className="mk-filter-group">
                        <h3>Condição</h3>
                        <ul>
                            <li>
                                <label className="mk-filter-opt">
                                    <input type="checkbox" checked={rascunho.novo} onChange={(e) => atualizar("novo", e.target.checked)} />
                                    Novo ({contagem.novo})
                                </label>
                            </li>
                            <li>
                                <label className="mk-filter-opt">
                                    <input type="checkbox" checked={rascunho.usado} onChange={(e) => atualizar("usado", e.target.checked)} />
                                    Usado ({contagem.usado})
                                </label>
                            </li>
                        </ul>
                    </div>

                    <div className="mk-filter-group">
                        <h3>Benefícios</h3>
                        <label className="mk-filter-opt is-green">
                            <input type="checkbox" checked={rascunho.frete} onChange={(e) => atualizar("frete", e.target.checked)} />
                            Apenas Frete Grátis
                        </label>
                    </div>

                    <div className="mk-filter-group" style={{ borderBottom: 0 }}>
                        <h3>Avaliação</h3>
                        <ul>
                            {[4, 3].map((n) => (
                                <li key={n}>
                                    <label className="mk-filter-opt">
                                        <input
                                            type="checkbox"
                                            checked={rascunho.nota === n}
                                            onChange={() => atualizar("nota", rascunho.nota === n ? 0 : n)}
                                        />
                                        <span className="mk-stars">{"★".repeat(n)}{"☆".repeat(5 - n)}</span>
                                        {n.toFixed(1)} ou mais
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <button type="button" className="btn btn-warning" onClick={() => setAplicados(rascunho)}>
                        Aplicar Filtros
                    </button>
                </aside>

                <section>
                    <div className="mk-grid">
                        {visiveis.length === 0 ? (
                            <div className="mk-empty">Nenhum produto encontrado.</div>
                        ) : (
                            visiveis.map((produto) => (
                                <ProdutoCard key={produto.id} produto={produto} onEditar={editar} onExcluir={excluir} />
                            ))
                        )}
                    </div>
                    <Pagination page={pagina} pages={totalPaginas} onChange={setPagina} />
                </section>
            </div>
        </>
    );
}

function rascunhoNumero(valor) {
    return valor === "" || valor === null ? null : numero(valor);
}
