import React from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import PageHeader from "../components/page-header";
import TabelaListagem from "../components/tabela-listagem";
import { mensagemErro, mensagemSucesso } from "../components/toastr";
import { BASE_URL } from "../config/axios";
import { listar, porId } from "../utils/api";

function buscarNomeCliente(carrinho, mapaClientes) {
    const idCliente = String(carrinho.idCliente);
    const cliente = mapaClientes.get(idCliente);

    return {
        nomeCliente: cliente?.nomeCompleto,
    };
}

const COLUNAS = [
    { titulo: "Nome do cliente", render: (d) => d.nomeCliente },
];

export default function ListagemCarrinho() {
    const navigate = useNavigate();
    const [linhas, setLinhas] = React.useState(null);

    React.useEffect(() => {
        Promise.all([
            listar("carrinhos"),
            listar("clientes"),
        ])
            .then(([carrinhos, clientes]) => {
                const mapaClientes = porId(clientes);

                setLinhas(
                    carrinhos.map((c) => ({
                        ...c,
                        ...buscarNomeCliente(c, mapaClientes),
                    }))
                );
            })
            .catch(() => {
                mensagemErro("Erro ao carregar os carrinhos.");
                setLinhas([]);
            });
    }, []);

    async function excluir(id) {
        try {
            await axios.delete(`${BASE_URL}/carrinhos/${id}`);
            mensagemSucesso(`Carrinho #${id} deletado com sucesso.`);
            setLinhas((atual) => atual.filter((dado) => dado.id !== id));
        } catch {
            mensagemErro("Erro ao deletar o carrinho.");
        }
    }

    if (!linhas) return null;

    return (
        <>
            <PageHeader
                trail={["Carrinhos"]}
                title="Carrinhos"
                subtitle="Todos os carrinhos ativos"
                count={`${linhas.length}`}
            />

            <TabelaListagem
                colunas={COLUNAS}
                linhas={linhas}
                vazio="Nenhum carrinho ativo encontrado."
                onExcluir={excluir}
                renderAcoes={(d) => (
                    <button
                        type="button"
                        className="btn btn-sm btn-warning"
                        onClick={() => navigate(`/meu-carrinho/${d.id}`)}
                    >
                        Ver carrinho
                    </button>
                )}
            />
        </>
    );
}
