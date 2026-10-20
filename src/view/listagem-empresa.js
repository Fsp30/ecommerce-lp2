import React from "react";
import { useNavigate } from "react-router-dom";
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
    const [dados, setDados] = React.useState(null);

    const cadastrar = () => navigate(`/cadastro-empresa`);
    const editar = (id) => navigate(`/cadastro-empresa/${id}`);

    async function excluir(id) {
        try {
            await axios.delete(`${baseURL}/${id}`);
            mensagemSucesso("listagem-empresa0");
            setDados((atual) => atual.filter((dado) => dado.id !== id));
        } catch (error) {
            mensagemErro("listagem-empresa1");
        }
    }

    React.useEffect(() => {
        axios.get(baseURL).then((response) => setDados(response.data));
    }, []);

    if (!dados) return null;

    return (
        <>
            <PageHeader trail={["Empresas"]} title="Empresas" subtitle="Lojas parceiras do marketplace." count={`${dados.length}`}>
                <button type="button" className="btn btn-warning btn-sm" onClick={cadastrar}>
                    Nova Empresa
                </button>
            </PageHeader>

            <TabelaListagem colunas={COLUNAS} linhas={dados} onEditar={editar} onExcluir={excluir} />
        </>
    );
}
