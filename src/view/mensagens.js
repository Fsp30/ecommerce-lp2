
import React from "react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../components/page-header";
import TabelaListagem from "../components/tabela-listagem";
import { mensagemErro } from "../components/toastr";
import { listar, porId } from "../utils/api";
import { formatarDataHora, resumir } from "../utils/formatar";

const COLUNAS = [
    {
        titulo: "Contraparte",
        render: (c) => c.contraparte,
    },
    {
        titulo: "Assunto",
        render: (c) => c.vinculo,
    },
    {
        titulo: "Última mensagem",
        render: (c) => resumir(c.ultimaMensagem, 60),
    },
    {
        titulo: "Data",
        render: (c) => formatarDataHora(c.dataUltima),
    },
    {
        titulo: "Não lidas",
        render: (c) =>
            c.naoLidas > 0 ? <strong>{c.naoLidas}</strong> : "—",
    },
];

export default function Mensagens() {
    const navigate = useNavigate();

    const [conversas, setConversas] = React.useState(null);

    React.useEffect(() => {
        async function carregarConversas() {
            try {
                const [
                    todasConversas,
                    mensagens,
                    clientes,
                    empresas,
                    produtos,
                    subpedidos,
                ] = await Promise.all([
                    listar("conversas"),
                    listar("mensagens"),
                    listar("clientes"),
                    listar("empresas"),
                    listar("produtos"),
                    listar("subpedidos"),
                ]);

                const clientesPorId = porId(clientes);
                const empresasPorId = porId(empresas);
                const produtosPorId = porId(produtos);
                const subpedidosPorId = porId(subpedidos);

                const resultado = todasConversas
                    .map((c) => {
                        const msgs = mensagens
                            .filter(
                                (m) =>
                                    String(m.idConversa) === String(c.id)
                            )
                            .sort((a, b) =>
                                (a.dataEnvio ?? "").localeCompare(
                                    b.dataEnvio ?? ""
                                )
                            );

                        const ultima = msgs[msgs.length - 1];

                        const produto = c.idProduto
                            ? produtosPorId.get(String(c.idProduto))
                            : null;

                        const subpedido = c.idSubpedido
                            ? subpedidosPorId.get(String(c.idSubpedido))
                            : null;

                        const cliente = clientesPorId.get(
                            String(c.idCliente)
                        );

                        const empresa = empresasPorId.get(
                            String(c.idEmpresa)
                        );

                        return {
                            id: c.id,

                            contraparte:
                                empresa?.nomeFantasia ??
                                cliente?.nomeCompleto ??
                                "—",

                            vinculo: produto
                                ? produto.titulo
                                : subpedido
                                    ? `Pedido #${subpedido.idPedido}`
                                    : "Conversa geral",

                            ultimaMensagem: ultima?.texto ?? "",
                            dataUltima: ultima?.dataEnvio,

                            naoLidas: msgs.filter(
                                (m) => !m.lida
                            ).length,
                        };
                    })
                    .sort((a, b) =>
                        (b.dataUltima ?? "").localeCompare(
                            a.dataUltima ?? ""
                        )
                    );

                setConversas(resultado);
            } catch {
                mensagemErro("Erro ao carregar as conversas.");
                setConversas([]);
            }
        }

        carregarConversas();
    }, []);

    if (conversas === null) {
        return <p>Carregando conversas...</p>;
    }

    return (
        <>
            <PageHeader
                trail={["Mensagens"]}
                title="Mensagens"
                subtitle="Conversas sobre produtos e pedidos."
                count={`${conversas.length}`}
            />

            <TabelaListagem
                colunas={COLUNAS}
                linhas={conversas}
                vazio="Nenhuma conversa iniciada."
                renderAcoes={(c) => (
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() =>
                            navigate(`/mensagens/${c.id}`)
                        }
                    >
                        Abrir
                    </button>
                )}
            />
        </>
    );
}
