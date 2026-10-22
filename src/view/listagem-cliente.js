import React from "react";
import { useNavigate } from "react-router-dom";
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
    const [dados, setDados] = React.useState(null);

    const cadastrar = () => navigate("/cadastro-cliente");
    const editar = (id) => navigate(`/cadastro-cliente/${id}`);

    async function excluir(id) {
        try {
            await axios.delete(`${baseURL}/${id}`);
            mensagemSucesso("Cliente excluído com sucesso!");
            setDados((atual) => atual.filter((dado) => String(dado.id) !== String(id)));
        } catch (error) {
            mensagemErro(error.response?.data || "Erro ao excluir o cliente.");
        }
    }

    React.useEffect(() => {
        axios
            .get(baseURL)
            .then((response) => setDados(response.data ?? []))
            .catch(() => {
                mensagemErro("Erro ao carregar os clientes.");
                setDados([]);
            });
    }, []);

    if (!dados) return null;

    return (
        <>
            <PageHeader
                trail={["Clientes"]}
                title="Clientes"
                subtitle="Compradores cadastrados no marketplace."
                count={`${dados.length}`}
            >
                <button type="button" className="btn btn-warning btn-sm" onClick={cadastrar}>
                    Novo Cliente
                </button>
            </PageHeader>

            <TabelaListagem
                colunas={COLUNAS}
                linhas={dados}
                onEditar={editar}
                onExcluir={excluir}
                vazio="Nenhum cliente cadastrado."
            />
        </>
    );
}