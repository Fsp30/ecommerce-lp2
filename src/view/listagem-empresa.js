import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";

import PageHeader from "../components/page-header";
import { mensagemSucesso, mensagemErro } from "../components/toastr";
import { BASE_URL } from "../config/axios";

const baseURL = `${BASE_URL}/empresas`;

const CAMPOS = [
    { rotulo: "Responsável", valor: (e) => e.responsavelLegal },
    { rotulo: "Telefone", valor: (e) => e.telefone },
    { rotulo: "Localização", valor: (e) => [e.cidade, e.uf].filter(Boolean).join(" - ") },
    { rotulo: "CEP", valor: (e) => e.cep },
];

function EmpresaCard({ empresa, onVerVitrine, onEditar, onExcluir }) {
    const status = empresa.status ?? "ATIVO";
    const ativa = status === "ATIVO";
    const oficial = empresa.statusVerificacao === "VERIFICADA";

    return (
        <article className="mk-empresa">
            <header className="mk-empresa__top">
                <span className="mk-empresa__logo">
                    {empresa.logoUrl ? (
                        <img src={empresa.logoUrl} alt={empresa.nomeFantasia} />
                    ) : (
                        empresa.nomeFantasia?.charAt(0) ?? "?"
                    )}
                </span>

                <div className="mk-empresa__info">
                    <h2 className="mk-empresa__name" title={empresa.nomeFantasia}>
                        {empresa.nomeFantasia || "Sem nome"}
                    </h2>
                    <p className="mk-empresa__cnpj">CNPJ: {empresa.cnpj || "—"}</p>
                    <div className="mk-empresa__tags">
                        <span className={`mk-pill ${ativa ? "mk-pill--ok" : "mk-pill--soft-danger"}`}>
                            {status}
                        </span>
                        {oficial && <span className="mk-pill mk-pill--warn">Loja oficial</span>}
                    </div>
                </div>

                <div className="mk-dept__admin">
                    <button
                        type="button"
                        className="mk-icon-btn"
                        aria-label={`Editar ${empresa.nomeFantasia}`}
                        onClick={() => onEditar(empresa.id)}
                    >
                        <EditOutlinedIcon fontSize="inherit" />
                    </button>
                    <button
                        type="button"
                        className="mk-icon-btn is-danger"
                        aria-label={`Excluir ${empresa.nomeFantasia}`}
                        onClick={() => onExcluir(empresa.id)}
                    >
                        <DeleteOutlineIcon fontSize="inherit" />
                    </button>
                </div>
            </header>

            {empresa.descricao && <p className="mk-empresa__desc">{empresa.descricao}</p>}

            <dl className="mk-empresa__fields">
                {CAMPOS.map((campo) => (
                    <div key={campo.rotulo} className="mk-empresa__field">
                        <dt>{campo.rotulo}</dt>
                        <dd>{campo.valor(empresa) || "—"}</dd>
                    </div>
                ))}
            </dl>

            <button
                type="button"
                className="btn btn-warning mk-empresa__vitrine"
                onClick={() => onVerVitrine(empresa.id)}
            >
                <StorefrontOutlinedIcon fontSize="small" />
                Ver Vitrine
            </button>
        </article>
    );
}

export default function ListagemEmpresas() {
    const navigate = useNavigate();
    const location = useLocation();
    const [dados, setDados] = React.useState(null);

    const cadastrar = () => navigate(`/cadastro-empresa`);
    const editar = (id) => navigate(`/cadastro-empresa/${id}`);
    const verVitrine = (id) => navigate(`/vitrine/${id}`);

    async function excluir(id) {
        try {
            await axios.delete(`${baseURL}/${id}`);
            mensagemSucesso("Empresa excluída com sucesso!");
            setDados((atual) => (atual ? atual.filter((d) => String(d.id) !== String(id)) : null));
        } catch {
            mensagemErro("Erro ao excluir a empresa.");
        }
    }

    // 1. Busca inicial da API (roda uma vez ao montar a tela)
    React.useEffect(() => {
        axios
            .get(baseURL)
            .then((response) => setDados(response.data ?? []))
            .catch(() => {
                mensagemErro("Erro ao carregar as empresas.");
                setDados([]);
            });
    }, []);

    // 2. Injeta a empresa cadastrada/editada na lista local
    React.useEffect(() => {
        if (dados === null) return;

        const item = location.state?.item;
        const acao = location.state?.acao;

        if (item && acao) {
            setDados((atual) => {
                if (!atual) return atual;

                if (acao === "CADASTRAR") {
                    const jaExiste = atual.some((d) => String(d.id) === String(item.id));
                    return jaExiste ? atual : [item, ...atual];
                }

                if (acao === "EDITAR") {
                    return atual.map((d) => (String(d.id) === String(item.id) ? item : d));
                }

                return atual;
            });

            // Limpa o state do histórico para que o item não seja reaplicado em re-renders
            window.history.replaceState({}, document.title);
        }
    }, [dados, location]);

    return (
        <>
            <PageHeader
                trail={["Empresas"]}
                title="Empresas"
                subtitle="Lojas parceiras do marketplace."
                count={`${dados?.length || 0}`}
            >
                <button type="button" className="btn btn-warning btn-sm" onClick={cadastrar}>
                    Nova Empresa
                </button>
            </PageHeader>

            {dados === null ? (
                <div className="text-center my-4">Carregando empresas...</div>
            ) : dados.length === 0 ? (
                <div className="mk-empty">Nenhuma empresa cadastrada.</div>
            ) : (
                <div className="mk-empresas">
                    {dados.map((empresa) => (
                        <EmpresaCard
                            key={empresa.id}
                            empresa={empresa}
                            onVerVitrine={verVitrine}
                            onEditar={editar}
                            onExcluir={excluir}
                        />
                    ))}
                </div>
            )}
        </>
    );
}