import React from "react";

import PageHeader from "../components/page-header";
import TabelaListagem from "../components/tabela-listagem";
import { mensagemErro, mensagemSucesso } from "../components/toastr";
import { obterSessao } from "../config/sessao";
import { atualizar, listar, porId } from "../utils/api";
import {
    formatarData,
    formatarMoeda,
    hoje,
    rotuloStatus,
} from "../utils/formatar";

// Próximo status permitido em cada etapa. Não há retorno nem pulo de etapa.
const PROXIMO_STATUS = {
    PEDIDO_CONFIRMADO: "EM_PREPARACAO",
    EM_SEPARACAO: "ENVIADO",
    EM_PREPARACAO: "ENVIADO",
    ENVIADO: "ENTREGUE",
};

const OPCOES_STATUS = ["PEDIDO_CONFIRMADO", "EM_SEPARACAO", "EM_PREPARACAO", "ENVIADO", "ENTREGUE"];

const COLUNAS = [
    { titulo: "Pedido", render: (s) => `#${s.idPedido}` },
    { titulo: "Cliente", render: (s) => s.nomeCliente },
    { titulo: "Data", render: (s) => formatarData(s.dataPedido) },
    { titulo: "Status", render: (s) => rotuloStatus(s.statusOperacional) },
    { titulo: "Valor", render: (s) => formatarMoeda(s.valorTotal) },
];

export default function PedidosRecebidos() {
    const [linhas, setLinhas] = React.useState(null);
    const [filtro, setFiltro] = React.useState("");

    React.useEffect(() => {
        const { empresaId } = obterSessao();

        Promise.all([listar("subpedidos"), listar("pedidos"), listar("clientes")])
            .then(([subpedidos, pedidos, clientes]) => {
                const pedidosPorId = porId(pedidos);
                const clientesPorId = porId(clientes);

                setLinhas(
                    subpedidos
                        .filter((s) => String(s.idEmpresa) === String(empresaId))
                        .map((s) => {
                            const pedido = pedidosPorId.get(String(s.idPedido)) ?? {};
                            return {
                                ...s,
                                dataPedido: pedido.dataPedido,
                                nomeCliente:
                                    clientesPorId.get(String(pedido.idCliente))?.nomeCompleto ?? "—",
                            };
                        })
                        .sort((a, b) => (b.dataPedido ?? "").localeCompare(a.dataPedido ?? ""))
                );
            })
            .catch(() => {
                mensagemErro("Erro ao carregar os pedidos recebidos.");
                setLinhas([]);
            });
    }, []);

    const visiveis = React.useMemo(
        () => (linhas ?? []).filter((s) => !filtro || s.statusOperacional === filtro),
        [linhas, filtro]
    );

    async function avancar(subpedido) {
        const novo = PROXIMO_STATUS[subpedido.statusOperacional];
        if (!novo) return;

        const dados =
            novo === "ENVIADO"
                ? { statusOperacional: novo, dataEnvio: hoje() }
                : { statusOperacional: novo };

        try {
            await atualizar("subpedidos", subpedido.id, dados);
            setLinhas((atual) =>
                atual.map((s) => (s.id === subpedido.id ? { ...s, ...dados } : s))
            );
            mensagemSucesso(`Pedido #${subpedido.idPedido} atualizado: ${rotuloStatus(novo)}.`);
        } catch {
            mensagemErro("Erro ao atualizar o status do pedido.");
        }
    }

    if (!linhas) return null;

    return (
        <>
            <PageHeader
                trail={["Minha conta", "Pedidos recebidos"]}
                title="Pedidos Recebidos"
                subtitle="Acompanhe e atualize os pedidos que contêm os seus produtos."
                count={`${linhas.length}`}
            />

            <div className="mb-3" style={{ maxWidth: 280 }}>
                <select
                    className="form-control"
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                >
                    <option value="">Todos os status</option>
                    {OPCOES_STATUS.map((s) => (
                        <option key={s} value={s}>
                            {rotuloStatus(s)}
                        </option>
                    ))}
                </select>
            </div>

            <TabelaListagem
                colunas={COLUNAS}
                linhas={visiveis}
                vazio={filtro ? "Nenhum pedido com este status." : "Nenhum pedido recebido ainda."}
                renderAcoes={(s) =>
                    PROXIMO_STATUS[s.statusOperacional] ? (
                        <button
                            type="button"
                            className="btn btn-sm btn-warning"
                            onClick={() => avancar(s)}
                        >
                            Avançar para {rotuloStatus(PROXIMO_STATUS[s.statusOperacional])}
                        </button>
                    ) : (
                        <span>Concluído</span>
                    )
                }
            />
        </>
    );
}