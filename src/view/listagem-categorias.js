import React from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/Delete";

import PageHeader from "../components/page-header";
import { mensagemSucesso, mensagemErro } from "../components/toastr";
import { BASE_URL } from "../config/axios";

const baseURL = `${BASE_URL}/categorias`;
const LIMITE_VISIVEL = 5;

function idDoPai(categoria) {
    const valor =
        categoria.categoriaPai?.id ??
        categoria.categoriaPai ??
        categoria.categoriaPaiId ??
        categoria.idCategoriaPai;
    if (valor === undefined || valor === null || valor === "") return null;
    return String(valor);
}


function montarArvore(categorias) {
    const porId = new Map(categorias.map((c) => [String(c.id), c]));
    const filhasDe = new Map();

    for (const c of categorias) {
        const pai = idDoPai(c);
        if (pai !== null && porId.has(pai)) {
            if (!filhasDe.has(pai)) filhasDe.set(pai, []);
            filhasDe.get(pai).push(c);
        }
    }

    const descendentes = (id, visitados = new Set()) => {
        if (visitados.has(id)) return [];
        visitados.add(id);
        const diretas = filhasDe.get(id) ?? [];
        return diretas.flatMap((f) => [
            { ...f, profundidade: visitados.size },
            ...descendentes(String(f.id), visitados),
        ]);
    };

    return categorias
        .filter((c) => {
            const pai = idDoPai(c);
            return pai === null || !porId.has(pai);
        })
        .map((raiz) => ({
            raiz,
            filhas: descendentes(String(raiz.id), new Set()),
        }));
}

function Departamento({ raiz, filhas, onEditar, onExcluir }) {
    const [expandido, setExpandido] = React.useState(false);
    const lista = expandido ? filhas : filhas.slice(0, LIMITE_VISIVEL);

    return (
        <article className="mk-dept">
            <div className="mk-dept__head">
                <span className="mk-dept__icon">
                    <CategoryOutlinedIcon fontSize="small" />
                </span>
                <h2>{raiz.nome}</h2>
                <div className="mk-dept__admin">
                    <button
                        type="button"
                        className="mk-icon-btn"
                        aria-label={`Editar ${raiz.nome}`}
                        onClick={() => onEditar(raiz.id)}
                    >
                        <EditOutlinedIcon fontSize="inherit" />
                    </button>
                    <button
                        type="button"
                        className="mk-icon-btn is-danger"
                        aria-label={`Excluir ${raiz.nome}`}
                        onClick={() => onExcluir(raiz.id)}
                    >
                        <DeleteOutlineIcon fontSize="inherit" />
                    </button>
                </div>
            </div>

            {lista.length > 0 ? (
                <ul>
                    {lista.map((filha) => (
                        <li
                            key={filha.id}
                            style={{ paddingLeft: `${(filha.profundidade - 1) * 12}px` }}
                        >
                            <span>{filha.nome}</span>
                            <button
                                type="button"
                                className="mk-icon-btn"
                                aria-label={`Editar ${filha.nome}`}
                                onClick={() => onEditar(filha.id)}
                            >
                                <EditOutlinedIcon fontSize="inherit" />
                            </button>
                            <button
                                type="button"
                                className="mk-icon-btn is-danger"
                                aria-label={`Excluir ${filha.nome}`}
                                onClick={() => onExcluir(filha.id)}
                            >
                                <DeleteOutlineIcon fontSize="inherit" />
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="mk-dept__empty">{raiz.descricao || "Sem subcategorias."}</p>
            )}

            {filhas.length > LIMITE_VISIVEL ? (
                <button
                    type="button"
                    className="mk-dept__more"
                    onClick={() => setExpandido((v) => !v)}
                >
                    {expandido ? "Ver menos ↑" : `Ver todos (${filhas.length} subcategorias) →`}
                </button>
            ) : (
                <button
                    type="button"
                    className="mk-dept__more"
                    onClick={() => onEditar(raiz.id)}
                >
                    Editar categoria →
                </button>
            )}
        </article>
    );
}

export default function ListagemCategorias() {
    const navigate = useNavigate();
    const [dados, setDados] = React.useState(null);

    const cadastrar = () => navigate("/cadastro-categorias");
    const editar = (id) => navigate(`/cadastro-categorias/${id}`);

    async function excluir(id) {
        try {
            await axios.delete(`${baseURL}/${id}`);
            mensagemSucesso("Categoria excluída com sucesso!");
            setDados((atual) => atual.filter((dado) => String(dado.id) !== String(id)));
        } catch (error) {
            mensagemErro(error.response?.data || "Erro ao excluir a categoria");
        }
    }

    React.useEffect(() => {
        axios
            .get(baseURL)
            .then((response) => setDados(response.data ?? []))
            .catch(() => {
                mensagemErro("Erro ao carregar as categorias");
                setDados([]);
            });
    }, []);

    const departamentos = React.useMemo(
        () => (dados ? montarArvore(dados) : []),
        [dados]
    );

    if (!dados) return null;

    return (
        <>
            <PageHeader
                trail={["Todas as Categorias"]}
                title="Explorar por Departamentos"
                subtitle="Navegue pelas categorias e encontre o produto ideal para o seu dia a dia."
            >
                <button type="button" className="btn btn-warning btn-sm" onClick={cadastrar}>
                    Nova Categoria
                </button>
            </PageHeader>

            <div className="mk-dept-grid">
                {departamentos.length === 0 ? (
                    <div className="mk-empty">Nenhuma categoria cadastrada.</div>
                ) : (
                    departamentos.map(({ raiz, filhas }) => (
                        <Departamento
                            key={raiz.id}
                            raiz={raiz}
                            filhas={filhas}
                            onEditar={editar}
                            onExcluir={excluir}
                        />
                    ))
                )}
            </div>
        </>
    );
}