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

const chavePai = (categoria) => {
    const valor = categoria.categoriaPai ?? categoria.categoriaPaiId;
    if (valor === undefined || valor === null || valor === "") return null;
    return String(typeof valor === "object" ? valor.id ?? valor.nome : valor);
};

function agruparPorDepartamento(categorias) {
    const existe = new Set(categorias.flatMap((c) => [String(c.id), String(c.nome)]));
    const ehRaiz = (c) => {
        const pai = chavePai(c);
        return pai === null || !existe.has(pai);
    };
    return categorias.filter(ehRaiz).map((raiz) => ({
        raiz,
        filhas: categorias.filter((c) => {
            const pai = chavePai(c);
            return pai !== null && (pai === String(raiz.id) || pai === String(raiz.nome));
        }),
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
                    <button type="button" className="mk-icon-btn" aria-label={`Editar ${raiz.nome}`} onClick={() => onEditar(raiz.id)}>
                        <EditOutlinedIcon fontSize="inherit" />
                    </button>
                    <button type="button" className="mk-icon-btn is-danger" aria-label={`Excluir ${raiz.nome}`} onClick={() => onExcluir(raiz.id)}>
                        <DeleteOutlineIcon fontSize="inherit" />
                    </button>
                </div>
            </div>

            {lista.length > 0 ? (
                <ul>
                    {lista.map((filha) => (
                        <li key={filha.id}>
                            <span>{filha.nome}</span>
                            <button type="button" className="mk-icon-btn" aria-label={`Editar ${filha.nome}`} onClick={() => onEditar(filha.id)}>
                                <EditOutlinedIcon fontSize="inherit" />
                            </button>
                            <button type="button" className="mk-icon-btn is-danger" aria-label={`Excluir ${filha.nome}`} onClick={() => onExcluir(filha.id)}>
                                <DeleteOutlineIcon fontSize="inherit" />
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="mk-dept__empty">{raiz.descricao || "Sem subcategorias."}</p>
            )}

            {filhas.length > LIMITE_VISIVEL ? (
                <button type="button" className="mk-dept__more" onClick={() => setExpandido((v) => !v)}>
                    {expandido ? "Ver menos ↑" : `Ver todos (${filhas.length} subcategorias) →`}
                </button>
            ) : (
                <button type="button" className="mk-dept__more" onClick={() => onEditar(raiz.id)}>
                    Editar categoria →
                </button>
            )}
        </article>
    );
}

export default function ListagemCategorias() {
    const navigate = useNavigate();
    const [dados, setDados] = React.useState(null);

    const cadastrar = () => navigate(`/cadastro-categorias`);
    const editar = (id) => navigate(`/cadastro-categorias/${id}`);

    async function excluir(id) {
        try {
            await axios.delete(`${baseURL}/${id}`);
            mensagemSucesso("Categoria excluída com sucesso!");
            setDados((atual) => atual.filter((dado) => dado.id !== id));
        } catch (error) {
            mensagemErro("Erro ao excluir a categoria");
        }
    }

    React.useEffect(() => {
        axios.get(baseURL).then((response) => setDados(response.data));
    }, []);

    const departamentos = React.useMemo(() => (dados ? agruparPorDepartamento(dados) : []), [dados]);

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
                        <Departamento key={raiz.id} raiz={raiz} filhas={filhas} onEditar={editar} onExcluir={excluir} />
                    ))
                )}
            </div>
        </>
    );
}
