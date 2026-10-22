
import React from "react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../components/page-header";
import TabelaListagem from "../components/tabela-listagem";
import { mensagemErro } from "../components/toastr";
import { listar, atualizar, porId } from "../utils/api";
import { formatarDataHora } from "../utils/formatar";

const FILTROS = [
    { valor: "", rotulo: "Todas" },
    { valor: "pedido", rotulo: "Pedidos" },
    { valor: "conta", rotulo: "Conta" },
    { valor: "outros", rotulo: "Outros" },
];

const ROTULO_CATEGORIA = {
    pedido: "Pedido",
    conta: "Conta",
    outros: "Outros",
};

function categoriaDe(tipo = "") {
    if (
        tipo.startsWith("PEDIDO") ||
        tipo === "NOVO_PEDIDO" ||
        tipo.startsWith("REEMBOLSO")
    ) {
        return "pedido";
    }

    if (tipo.startsWith("CONTA") || tipo.startsWith("SENHA")) {
        return "conta";
    }

    return "outros";
}

function destinoDe(n) {
    if (!n.idSubpedido) return null;

    if (n.usuarioTipo === "CLIENTE") {
        return n.idPedido ? `/pedidos/${n.idPedido}` : null;
    }

    if (n.usuarioTipo === "EMPRESA") {
        return "/pedidos-recebidos";
    }

    return null;
}

export default function Notificacoes() {
    const navigate = useNavigate();

    const [linhas, setLinhas] = React.useState(null);
    const [filtro, setFiltro] = React.useState("");

    React.useEffect(() => {
        async function carregar() {
            try {
                const [notificacoes, subpedidos] = await Promise.all([
                    listar("notificacoes"),
                    listar("subpedidos"),
                ]);

                const subPorId = porId(subpedidos);

                const resultado = notificacoes
                    .map((n) => {
                        const subpedido = subPorId.get(
                            String(n.idSubpedido)
                        );

                        return {
                            ...n,
                            idPedido: subpedido?.idPedido ?? n.idPedido,
                        };
                    })
                    .sort((a, b) =>
                        (b.dataEnvio ?? "").localeCompare(
                            a.dataEnvio ?? ""
                        )
                    );

                setLinhas(resultado);
            } catch {
                mensagemErro("Erro ao carregar as notificações.");
                setLinhas([]);
            }
        }

        carregar();
    }, []);

    const visiveis = React.useMemo(
        () =>
            (linhas ?? []).filter(
                (n) =>
                    !filtro || categoriaDe(n.tipo) === filtro
            ),
        [linhas, filtro]
    );

    async function marcarComoLida(n) {
        if (n.lida) return;

        try {
            await atualizar("notificacoes", n.id, {
                lida: true,
            });

            setLinhas((atual) =>
                atual.map((x) =>
                    x.id === n.id ? { ...x, lida: true } : x
                )
            );
        } catch {
            mensagemErro(
                "Erro ao marcar a notificação como lida."
            );
        }
    }

    async function abrir(n) {
        await marcarComoLida(n);

        const destino = destinoDe(n);

        if (destino) {
            navigate(destino);
        }
    }

    const COLUNAS = [
        {
            titulo: "Categoria",
            render: (n) =>
                ROTULO_CATEGORIA[categoriaDe(n.tipo)],
        },
        {
            titulo: "Mensagem",
            render: (n) =>
                n.lida ? n.mensagem : <strong>{n.mensagem}</strong>,
        },
        {
            titulo: "Data",
            render: (n) => formatarDataHora(n.dataEnvio),
        },
        {
            titulo: "Situação",
            render: (n) => (n.lida ? "Lida" : "Não lida"),
        },
    ];

    if (linhas === null) {
        return <p>Carregando notificações...</p>;
    }

    return (
        <>
            <PageHeader
                trail={["Notificações"]}
                title="Notificações"
                subtitle="Avisos sobre pedidos e outras atividades."
                count={`${linhas.length}`}
            />

            <div
                className="mb-3"
                style={{ maxWidth: 280 }}
            >
                <select
                    className="form-control"
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                >
                    {FILTROS.map((f) => (
                        <option key={f.valor} value={f.valor}>
                            {f.rotulo}
                        </option>
                    ))}
                </select>
            </div>

            <TabelaListagem
                colunas={COLUNAS}
                linhas={visiveis}
                vazio="Não existem notificações."
                renderAcoes={(n) => (
                    <div className="mk-table__actions">
                        {!n.lida && (
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => marcarComoLida(n)}
                            >
                                Marcar como lida
                            </button>
                        )}

                        {destinoDe(n) && (
                            <button
                                type="button"
                                className="btn btn-sm btn-warning"
                                onClick={() => abrir(n)}
                            >
                                Abrir
                            </button>
                        )}
                    </div>
                )}
            />
        </>
    );
}