import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";

import { mensagemErro } from "../components/toastr";
import { obterSessao } from "../config/sessao";
import { BASE_URL } from "../config/axios";
import { listar } from "../utils/api";
import { formatarMoeda } from "../utils/formatar";
import { idEmpresaDo } from "../utils/vitrine";

const CABECALHO_JSON = { headers: { "Content-Type": "application/json" } };

const situacaoDe = (p) => {
    if (p.status !== "ATIVO") return "INATIVO";
    return Number(p.estoqueQuantidade) <= 0 ? "ESGOTADO" : "ATIVO";
};

const ROTULO_SITUACAO = { ATIVO: "Ativo", INATIVO: "Inativo", ESGOTADO: "Esgotado" };
const CLASSE_SITUACAO = {
    ATIVO: "mk-pill mk-pill--ok",
    INATIVO: "mk-pill",
    ESGOTADO: "mk-pill mk-pill--soft-danger",
};

export default function GestaoEstoque() {
    const navigate = useNavigate();
    const { empresaId } = obterSessao();

    const [dados, setDados] = React.useState(null);
    const [busca, setBusca] = React.useState("");

    React.useEffect(() => {
        Promise.all([listar("produtos"), listar("categorias"), listar("produtoCategoria")])
            .then(([produtos, categorias, vinculos]) => setDados({ produtos, categorias, vinculos }))
            .catch(() => {
                mensagemErro("Erro ao carregar o estoque.");
                setDados({ produtos: [], categorias: [], vinculos: [] });
            });
    }, []);

    const categoriasPorId = React.useMemo(
        () => new Map((dados?.categorias ?? []).map((c) => [String(c.id), c])),
        [dados]
    );

    const caminhoDe = (produto) => {
        const ids =
            Array.isArray(produto.categorias) && produto.categorias.length
                ? produto.categorias.map((c) => (typeof c === "object" ? c.id : c))
                : (dados?.vinculos ?? [])
                      .filter((v) => String(v.idProduto) === String(produto.id))
                      .map((v) => v.idCategoria);

        const cat = categoriasPorId.get(String(ids[0]));
        if (!cat) return "Sem categoria";

        const pai = cat.idCategoriaPai != null ? categoriasPorId.get(String(cat.idCategoriaPai)) : null;
        return pai ? `${pai.nome} > ${cat.nome}` : cat.nome;
    };

    const meusProdutos = React.useMemo(() => {
        if (!dados) return [];
        const termo = busca.trim().toLowerCase();

        return dados.produtos
            .filter((p) => String(idEmpresaDo(p)) === String(empresaId))
            .filter((p) => !termo || String(p.titulo ?? "").toLowerCase().includes(termo));
    }, [dados, empresaId, busca]);

    function atualizarNaTela(produtoAtualizado) {
        setDados((d) => ({
            ...d,
            produtos: d.produtos.map((p) =>
                String(p.id) === String(produtoAtualizado.id) ? produtoAtualizado : p
            ),
        }));
    }

    function enviarPut(produtoAtualizado) {
        axios
            .put(`${BASE_URL}/produtos/${produtoAtualizado.id}`, produtoAtualizado, CABECALHO_JSON)
            .catch((erro) => console.error("Falha ao salvar produto:", erro));
    }

    function ajustarEstoque(produto, delta) {
        const atual = Number(produto.estoqueQuantidade) || 0;
        const novo = Math.max(0, atual + delta);
        if (novo === atual) return;

        const produtoAtualizado = { ...produto, estoqueQuantidade: novo };
        atualizarNaTela(produtoAtualizado);
        enviarPut(produtoAtualizado);
    }

    function alternarStatus(produto) {
        const novo = produto.status === "ATIVO" ? "INATIVO" : "ATIVO";

        const produtoAtualizado = { ...produto, status: novo };
        atualizarNaTela(produtoAtualizado);
        enviarPut(produtoAtualizado);
    }

    if (dados === null) {
        return <div className="text-center my-4">Carregando estoque...</div>;
    }

    return (
        <>
            <button type="button" className="mk-back" onClick={() => navigate(-1)}>
                <ArrowBackIosNewIcon sx={{ fontSize: 14 }} />
                Voltar
            </button>

            <section className="mk-form-card">
                <div className="mk-gestao__head">
                    <div>
                        <h1>Gestão de Catálogo e Estoque (RF35)</h1>
                        <p className="mk-form-card__sub">
                            Atualize quantidades em estoque e status de ativação dos seus produtos
                        </p>
                    </div>

                    <button
                        type="button"
                        className="btn btn-warning mk-pill-btn"
                        onClick={() => navigate("/cadastro-produto")}
                    >
                        <AddIcon sx={{ fontSize: 16 }} /> Novo Produto
                    </button>
                </div>

                <div className="mk-toolbar">
                    <input
                        type="search"
                        className="form-control mk-gestao__busca"
                        placeholder="Buscar por título do produto..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                    />
                </div>

                <div className="mk-table-card">
                    <div className="mk-table-scroll">
                        <table className="mk-table">
                            <thead>
                                <tr>
                                    <th scope="col">Produto</th>
                                    <th scope="col">Status</th>
                                    <th scope="col">Preço</th>
                                    <th scope="col">Estoque atual (RF35)</th>
                                    <th scope="col">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {meusProdutos.map((p) => {
                                    const situacao = situacaoDe(p);
                                    const estoque = Number(p.estoqueQuantidade) || 0;
                                    const inativo = p.status !== "ATIVO";
                                    const foto = Array.isArray(p.fotos) ? p.fotos.find(Boolean) : p.fotos;

                                    return (
                                        <tr key={p.id} className={inativo ? "is-suspended" : ""}>
                                            <td>
                                                <div className="mk-prod-cell">
                                                    <span className="mk-prod-cell__thumb">
                                                        {foto ? <img src={foto} alt={p.titulo} /> : "Foto"}
                                                    </span>
                                                    <div>
                                                        <strong>{p.titulo}</strong>
                                                        <small>{caminhoDe(p)}</small>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                <span className={CLASSE_SITUACAO[situacao]}>
                                                    {ROTULO_SITUACAO[situacao]}
                                                </span>
                                            </td>

                                            <td>
                                                <strong>{formatarMoeda(p.preco)}</strong>
                                            </td>

                                            <td>
                                                <div className={`mk-stock ${estoque === 0 ? "is-out" : ""}`}>
                                                    <button
                                                        type="button"
                                                        aria-label="Diminuir estoque"
                                                        disabled={estoque === 0}
                                                        onClick={() => ajustarEstoque(p, -1)}
                                                    >
                                                        <RemoveIcon sx={{ fontSize: 14 }} />
                                                    </button>
                                                    <strong>{estoque}</strong>
                                                    <button
                                                        type="button"
                                                        aria-label="Aumentar estoque"
                                                        onClick={() => ajustarEstoque(p, 1)}
                                                    >
                                                        <AddIcon sx={{ fontSize: 14 }} />
                                                    </button>
                                                </div>
                                            </td>

                                            <td>
                                                <div className="mk-acts">
                                                    <button
                                                        type="button"
                                                        className="mk-act"
                                                        onClick={() => navigate(`/cadastro-produto/${p.id}`)}
                                                    >
                                                        <EditOutlinedIcon sx={{ fontSize: 14 }} /> Editar
                                                    </button>

                                                    {inativo ? (
                                                        <button
                                                            type="button"
                                                            className="mk-act mk-act--ok"
                                                            onClick={() => alternarStatus(p)}
                                                        >
                                                            <CheckCircleOutlinedIcon sx={{ fontSize: 14 }} /> Ativar
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className="mk-act mk-act--danger"
                                                            onClick={() => alternarStatus(p)}
                                                        >
                                                            <BlockIcon sx={{ fontSize: 14 }} /> Inativar
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {meusProdutos.length === 0 && (
                            <div className="mk-table-empty">
                                {busca
                                    ? "Nenhum produto encontrado para esta busca."
                                    : "Sua loja ainda não possui produtos cadastrados."}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}