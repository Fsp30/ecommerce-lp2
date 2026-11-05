import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

import PageHeader from "../components/page-header";
import TabelaListagem from "../components/tabela-listagem";
import { mensagemSucesso, mensagemErro } from "../components/toastr";
import { BASE_URL } from "../config/axios";

const baseURL = `${BASE_URL}/clientes`;

const COLUNAS = [
    { titulo: "Nome", render: (d) => d.nomeCompleto },
    { titulo: "CPF", render: (d) => d.cpf },
    { titulo: "Telefone", render: (d) => d.telefone },
];

export default function ListagemCliente() {
    const navigate = useNavigate();
    const location = useLocation();
    const [dados, setDados] = React.useState(null);

    const cadastrar = () => navigate("/cadastro-cliente");
    const editar = (id) => navigate(`/cadastro-cliente/${id}`);

    async function excluir(id) {
        try {
            await axios.delete(`${baseURL}/${id}`);
            mensagemSucesso("Cliente excluído com sucesso!");
            setDados((atual) => atual ? atual.filter((dado) => String(dado.id) !== String(id)) : null);
        } catch (error) {
            mensagemErro(error.response?.data || "Erro ao excluir o cliente.");
        }
    }

    // 1. Busca inicial da API
    React.useEffect(() => {
        axios
            .get(baseURL)
            .then((response) => setDados(response.data ?? []))
            .catch(() => {
                mensagemErro("Erro ao carregar os clientes.");
                setDados([]);
            });
    }, []);

    // 2. Monitora e intercepta o cliente inserido ou editado via navegação

        React.useEffect(() => {
        axios
            .get(baseURL)
            .then((response) => {
                let listaDoBanco = response.data ?? [];
                
                // Captura se há algum item vindo da tela de cadastro/edição
                const item = location.state?.item;
                const acao = location.state?.acao;

                if (item && acao) {
                    if (acao === "CADASTRAR") {
                        const jaExiste = listaDoBanco.some((dado) => String(dado.id) === String(item.id));
                        if (!jaExiste) {
                            listaDoBanco = [item, ...listaDoBanco];
                        }
                    } else if (acao === "EDITAR") {
                        listaDoBanco = listaDoBanco.map((dado) => 
                            String(dado.id) === String(item.id) ? item : dado
                        );
                    }

                    // Limpa o estado da rota imediatamente para evitar loops ou re-execuções indesejadas
                    window.history.replaceState({}, document.title);
                    navigate(location.pathname, { replace: true, state: {} });
                }

                // Salva tudo atualizado no estado de uma vez só
                setDados(listaDoBanco);
            })
            .catch(() => {
                mensagemErro("Erro ao carregar os clientes.");
                setDados([]);
            });
    }, []);

    return (
        <>
            <PageHeader
                trail={["Clientes"]}
                title="Clientes"
                subtitle="Compradores cadastrados no marketplace."
                // CORREÇÃO AQUI: Protege o length caso dados seja null no primeiro render
                count={`${dados?.length || 0}`} 
            >
                <button type="button" className="btn btn-warning btn-sm" onClick={cadastrar}>
                    Novo Cliente
                </button>
            </PageHeader>

            {/* Renderiza a tabela apenas quando os dados não forem mais null */}
            {dados !== null ? (
                <TabelaListagem
                    colunas={COLUNAS}
                    linhas={dados}
                    onEditar={editar}
                    onExcluir={excluir}
                    vazio="Nenhum cliente cadastrado."
                />
            ) : (
                <div className="text-center my-4">Carregando clientes...</div>
            )}
        </>
    );
}
