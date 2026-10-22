import React from "react";

import PageHeader from "../components/page-header";
import TabelaListagem from "../components/tabela-listagem";
import { mensagemErro, mensagemSucesso } from "../components/toastr";
import { atualizar, listar, porId } from "../utils/api";
import { formatarData, resumir } from "../utils/formatar";

const COLUNAS = [
    { titulo: "Alvo", render: (a) => a.alvo },
    { titulo: "Tipo", render: (a) => a.tipoAlvo },
    { titulo: "Cliente", render: (a) => a.nomeCliente },
    { titulo: "Nota", render: (a) => `${a.nota}/5` },
    { titulo: "Comentário", render: (a) => resumir(a.comentario, 70) },
    { titulo: "Data", render: (a) => formatarData(a.data) },
    { titulo: "Status", render: (a) => (a.status === "PUBLICADA" ? "Publicada" : "Removida") },
];

export default function ModeracaoAvaliacoes() {
    const [linhas, setLinhas] = React.useState(null);

    React.useEffect(() => {
        Promise.all([listar("avaliacoes"), listar("clientes"), listar("produtos"), listar("empresas")])
            .then(([avaliacoes, clientes, produtos, empresas]) => {
                const clientesPorId = porId(clientes);
                const produtosPorId = porId(produtos);
                const empresasPorId = porId(empresas);

                setLinhas(
                    avaliacoes
                        .map((a) => {
                            const ehProduto = Boolean(a.idProduto);
                            return {
                                ...a,
                                tipoAlvo: ehProduto ? "Produto" : "Empresa",
                                alvo: ehProduto
                                    ? produtosPorId.get(String(a.idProduto))?.titulo ?? "Produto removido"
                                    : empresasPorId.get(String(a.idEmpresa))?.nomeFantasia ?? "—",
                                nomeCliente: clientesPorId.get(String(a.idCliente))?.nomeCompleto ?? "—",
                            };
                        })
                        .sort((x, y) => (y.data ?? "").localeCompare(x.data ?? ""))
                );
            })
            .catch(() => {
                mensagemErro("Erro ao carregar as avaliações.");
                setLinhas([]);
            });
    }, []);

    async function alternarStatus(a) {
        const novo = a.status === "PUBLICADA" ? "REMOVIDA" : "PUBLICADA";

        if (novo === "REMOVIDA" && !window.confirm("Remover esta avaliação da plataforma?")) return;

        try {
            await atualizar("avaliacoes", a.id, { status: novo });
            setLinhas((atual) => atual.map((x) => (x.id === a.id ? { ...x, status: novo } : x)));
            mensagemSucesso(novo === "REMOVIDA" ? "Avaliação removida." : "Avaliação republicada.");
        } catch {
            mensagemErro("Erro ao alterar o status da avaliação.");
        }
    }

    if (!linhas) return null;

    return (
        <>
            <PageHeader
                trail={["Moderação", "Avaliações"]}
                title="Moderação de Avaliações"
                subtitle="Remova avaliações que violem as regras ou republique as que foram removidas por engano."
                count={`${linhas.length}`}
            />

            <TabelaListagem
                colunas={COLUNAS}
                linhas={linhas}
                vazio="Nenhuma avaliação cadastrada."
                renderAcoes={(a) =>
                    a.status === "PUBLICADA" ? (
                        <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => alternarStatus(a)}
                        >
                            Remover
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="btn btn-sm btn-success"
                            onClick={() => alternarStatus(a)}
                        >
                            Republicar
                        </button>
                    )
                }
            />
        </>
    );
}