import React from "react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../components/page-header";
import TabelaListagem from "../components/tabela-listagem";
import { mensagemErro } from "../components/toastr";
import { obterSessao } from "../config/sessao";
import { listar } from "../utils/api";
import {
    ORDEM_STATUS_PEDIDO,
    ROTULO_STATUS_PEDIDO,
    formatarData,
    formatarMoeda,
    rotuloStatus,
} from "../utils/formatar";

// O status do pedido vem dos subpedidos (um por empresa).
// Se todos foram entregues, o pedido está entregue; senão, mostra o estágio mais atrasado.
function statusDoPedido(subpedidos) {
    if (subpedidos.length === 0) return "SEM_SUBPEDIDOS";
    if (subpedidos.every((s) => s.statusOperacional === "ENTREGUE")) return "ENTREGUE";
    return subpedidos.reduce((menor, s) =>
        (ORDEM_STATUS_PEDIDO[s.statusOperacional] ?? 0) <
        (ORDEM_STATUS_PEDIDO[menor.statusOperacional] ?? 0)
            ? s
            : menor
    ).statusOperacional;
}

const OPCOES_STATUS = Object.keys(ROTULO_STATUS_PEDIDO).filter((s) => s !== "SEM_SUBPEDIDOS");

const COLUNAS = [
    { titulo: "Pedido", render: (p) => `#${p.id}` },
    { titulo: "Data", render: (p) => formatarData(p.dataPedido) },
    { titulo: "Status", render: (p) => rotuloStatus(p.status) },
    { titulo: "Total", render: (p) => formatarMoeda(p.totalGeral) },
];

export default function MeusPedidos() {
    const navigate = useNavigate();
    const [pedidos, setPedidos] = React.useState(null);
    const [filtro, setFiltro] = React.useState("");

    React.useEffect(() => {
        const { clienteId } = obterSessao();

        Promise.all([listar("pedidos"), listar("subpedidos")])
            .then(([todosPedidos, subpedidos]) => {
                const meus = todosPedidos
                    .filter((p) => String(p.idCliente) === String(clienteId))
                    .map((p) => ({
                        ...p,
                        status: statusDoPedido(
                            subpedidos.filter((s) => String(s.idPedido) === String(p.id))
                        ),
                    }))
                    .sort((a, b) => (b.dataPedido ?? "").localeCompare(a.dataPedido ?? ""));
                setPedidos(meus);
            })
            .catch(() => {
                mensagemErro("Erro ao carregar seus pedidos.");
                setPedidos([]);
            });
    }, []);

    const visiveis = React.useMemo(
        () => (pedidos ?? []).filter((p) => !filtro || p.status === filtro),
        [pedidos, filtro]
    );

    if (!pedidos) return null;

    return (
        <>
            <PageHeader
                trail={["Minha conta", "Meus pedidos"]}
                title="Meus Pedidos"
                subtitle="Acompanhe o andamento das suas compras."
                count={`${pedidos.length}`}
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
                vazio={filtro ? "Nenhum pedido com este status." : "Você ainda não fez nenhum pedido."}
                renderAcoes={(p) => (
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => navigate(`/pedidos/${p.id}`)}
                    >
                        Ver detalhes
                    </button>
                )}
            />
        </>
    );
}