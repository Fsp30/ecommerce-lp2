import React from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import PageHeader from "../components/page-header";
import TabelaListagem from "../components/tabela-listagem";
import { mensagemSucesso, mensagemErro } from "../components/toastr";
import { BASE_URL } from "../config/axios";

const baseURL = `${BASE_URL}/usuarios`;

const formatarData = (valor) => {
    if (!valor) return "—";
    const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(valor));
    if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? String(valor) : data.toLocaleDateString("pt-BR");
};

const COLUNAS = [
    { titulo: "Nome", render: (d) => d.nome },
    { titulo: "E-mail", render: (d) => d.email },
    { titulo: "Data de Cadastro", render: (d) => formatarData(d.dataCadastro) },
];

export default function ListagemUsuarios() {
    const navigate = useNavigate();
    const [dados, setDados] = React.useState(null);

    const cadastrar = () => navigate(`/cadastro-usuarios`);
    const editar = (id) => navigate(`/cadastro-usuarios/${id}`);

    async function excluir(id) {
        try {
            await axios.delete(`${baseURL}/${id}`);
            mensagemSucesso("listagem-usuarios0");
            setDados((atual) => atual.filter((dado) => dado.id !== id));
        } catch (error) {
            mensagemErro("listagem-usuarios1");
        }
    }

    React.useEffect(() => {
        axios.get(baseURL).then((response) => setDados(response.data));
    }, []);

    if (!dados) return null;

    return (
        <>
            <PageHeader trail={["Usuários"]} title="Usuários" subtitle="Contas cadastradas na plataforma." count={`${dados.length}`}>
                <button type="button" className="btn btn-warning btn-sm" onClick={cadastrar}>
                    Novo Usuário
                </button>
            </PageHeader>

            <TabelaListagem colunas={COLUNAS} linhas={dados} onEditar={editar} onExcluir={excluir} />
        </>
    );
}
