import React from "react";

import PageHeader from "../components/page-header";
import TabelaListagem from "../components/tabela-listagem";
import { mensagemErro, mensagemSucesso } from "../components/toastr";
import { atualizar, listar, porId } from "../utils/api";
import { formatarData, resumir } from "../utils/formatar";

const PROXIMO_STATUS = { ABERTA: "EM_ANALISE", EM_ANALISE: "RESOLVIDA" };

const ROTULO_STATUS = { ABERTA: "Aberta", EM_ANALISE: "Em análise", RESOLVIDA: "Resolvida" };

const ROTULO_ALVO = { PRODUTO: "Produto", EMPRESA: "Empresa", USUARIO: "Usuário", AVALIACAO: "Avaliação" };

const OPCOES_STATUS = Object.keys(ROTULO_STATUS);

// Resolve os nomes do denunciante e do alvo a partir das listas carregadas.
function resolverNomes(d, mapas) {
    const idDenunciante = String(d.idDenunciante);
    const denunciante =
        d.denuncianteTipo === "CLIENTE"
            ? mapas.clientes.get(idDenunciante)?.nomeCompleto
            : d.denuncianteTipo === "EMPRESA"
                ? mapas.empresas.get(idDenunciante)?.nomeFantasia
                : null;

    const idAlvo = String(d.idAlvo);
    const alvo =
        d.tipoAlvo === "PRODUTO"
            ? mapas.produtos.get(idAlvo)?.titulo
            : d.tipoAlvo === "EMPRESA"
                ? mapas.empresas.get(idAlvo)?.nomeFantasia
                : d.tipoAlvo === "USUARIO"
                    ? mapas.usuarios.get(idAlvo)?.nome
                    : d.tipoAlvo === "AVALIACAO"
                        ? `Avaliação #${d.idAlvo}`
                        : null;

    return { denunciante: denunciante ?? "—", alvo: alvo ?? "—" };
}

const COLUNAS = [
    { titulo: "Denunciante", render: (d) => d.denunciante },
    { titulo: "Alvo", render: (d) => `${ROTULO_ALVO[d.tipoAlvo] ?? d.tipoAlvo}: ${d.alvo}` },
    { titulo: "Motivo", render: (d) => resumir(d.motivo, 90) },
    { titulo: "Status", render: (d) => ROTULO_STATUS[d.status] ?? d.status },
    { titulo: "Data", render: (d) => formatarData(d.data) },
];

export default function ModeracaoDenuncias() {
    const [linhas, setLinhas] = React.useState(null);
    const [filtro, setFiltro] = React.useState("");

    React.useEffect(() => {
        Promise.all([
            listar("denuncias"),
            listar("clientes"),
            listar("empresas"),
            listar("produtos"),
            listar("usuarios"),
        ])
            .then(([denuncias, clientes, empresas, produtos, usuarios]) => {
                const mapas = {
                    clientes: porId(clientes),
                    empresas: porId(empresas),
                    produtos: porId(produtos),
                    usuarios: porId(usuarios),
                };

                setLinhas(
                    denuncias
                        .map((d) => ({ ...d, ...resolverNomes(d, mapas) }))
                        .sort((a, b) => (b.data ?? "").localeCompare(a.data ?? ""))
                );
            })
            .catch(() => {
                mensagemErro("Erro ao carregar as denúncias.");
                setLinhas([]);
            });
    }, []);

    const visiveis = React.useMemo(
        () => (linhas ?? []).filter((d) => !filtro || d.status === filtro),
        [linhas, filtro]
    );

    async function avancar(denuncia) {
        const novo = PROXIMO_STATUS[denuncia.status];
        if (!novo) return;

        try {
            await atualizar("denuncias", denuncia.id, { status: novo });
            setLinhas((atual) =>
                atual.map((d) => (d.id === denuncia.id ? { ...d, status: novo } : d))
            );
            mensagemSucesso(`Denúncia #${denuncia.id} atualizada: ${ROTULO_STATUS[novo]}.`);
        } catch {
            mensagemErro("Erro ao atualizar a denúncia.");
        }
    }

    if (!linhas) return null;

    return (
        <>
            <PageHeader
                trail={["Moderação", "Denúncias"]}
                title="Denúncias"
                subtitle="Analise as denúncias recebidas de produtos, empresas, usuários e avaliações."
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
                            {ROTULO_STATUS[s]}
                        </option>
                    ))}
                </select>
            </div>

            <TabelaListagem
                colunas={COLUNAS}
                linhas={visiveis}
                vazio={filtro ? "Nenhuma denúncia com este status." : "Nenhuma denúncia registrada."}
                renderAcoes={(d) =>
                    PROXIMO_STATUS[d.status] ? (
                        <button
                            type="button"
                            className="btn btn-sm btn-warning"
                            onClick={() => avancar(d)}
                        >
                            Avançar para {ROTULO_STATUS[PROXIMO_STATUS[d.status]]}
                        </button>
                    ) : (
                        <span>Concluída</span>
                    )
                }
            />
        </>
    );
}