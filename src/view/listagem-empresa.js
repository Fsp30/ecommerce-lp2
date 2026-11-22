import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

import PageHeader from "../components/page-header";
import TabelaListagem from "../components/tabela-listagem";
import { mensagemSucesso, mensagemErro } from "../components/toastr";
import { BASE_URL } from "../config/axios";

const baseURL = `${BASE_URL}/empresas`;

const COLUNAS = [
    { titulo: "Nome Fantasia", render: (d) => d.nomeFantasia },
    { titulo: "CNPJ", render: (d) => d.cnpj },
    { titulo: "CEP", render: (d) => d.cep },
];

export default function ListagemEmpresas() {
    const navigate = useNavigate();
    const location = useLocation();
    const [dados, setDados] = React.useState(null);

    const cadastrar = () => navigate(`/cadastro-empresa`);
    const editar = (id) => navigate(`/cadastro-empresa/${id}`);

    async function excluir(id) {
        try {
            await axios.delete(`${baseURL}/${id}`);
            mensagemSucesso("Empresa excluída com sucesso!");
            setDados((atual) => atual ? atual.filter((dado) => String(dado.id) !== String(id)) : null);
        } catch (error) {
            mensagemErro("Erro ao excluir a empresa.");
        }
    }

    // 1. Busca inicial da API (Roda apenas uma única vez ao montar a tela)
    React.useEffect(() => {
        axios
            .get(baseURL)
            .then((response) => setDados(response.data ?? []))
            .catch(() => {
                mensagemErro("Erro ao carregar as empresas.");
                setDados([]);
            });
    }, []);

    // 2. Interceptador de Estado (Injeta a empresa cadastrada/editada na lista local de forma permanente)
    React.useEffect(() => {
        if (dados === null) return; // Espera a API responder primeiro

        const item = location.state?.item;
        const acao = location.state?.acao;

        if (item && acao) {
            setDados((atual) => {
                if (!atual) return atual;

                if (acao === "CADASTRAR") {
                    // Evita chaves duplicadas na tabela verificando pelo ID da empresa
                    const jaExiste = atual.some((d) => String(d.id) === String(item.id));
                    if (jaExiste) return atual;
                    return [item, ...atual];
                }

                if (acao === "EDITAR") {
                    return atual.map((d) => (String(d.id) === String(item.id) ? item : d));
                }

                return atual;
            });

            // LIMPEZA SILENCIOSA: Modifica a referência na memória da rota sem chamar o navigate().
            // Isso impede que o React Router force uma remontagem e suma com o seu registro na tabela.
            location.state = undefined; 
            window.history.replaceState({}, document.title);
        }
    }, [dados, location]); // Monitora de maneira segura

    return (
        <>
            <PageHeader 
                trail={["Empresas"]} 
                title="Empresas" 
                subtitle="Lojas parceiras do marketplace." 
                count={`${dados?.length || 0}`} // Protegido contra null
            >
                <button type="button" className="btn btn-warning btn-sm" onClick={cadastrar}>
                    Nova Empresa
                </button>
            </PageHeader>

            {dados !== null ? (
                <TabelaListagem 
                    colunas={COLUNAS} 
                    linhas={dados} 
                    onEditar={editar} 
                    onExcluir={excluir} 
                    vazio="Nenhuma empresa cadastrada."
                />
            ) : (
                <div className="text-center my-4">Carregando empresas...</div>
            )}
        </>
    );
}
