import React from "react";
import { useNavigate } from "react-router-dom";

import AdminLayout from "../../components/admin-layout";
import PageHeader from "../../components/page-header";
import { mensagemErro, mensagemSucesso } from "../../components/toastr";
import { salvarRegistro } from "../../utils/admin-api";
import { listar, porId } from "../../utils/api";
import { formatarCnpj, formatarCpf, soDigitos } from "../../utils/documentos";
import { formatarData } from "../../utils/formatar";

const ABAS = [
    { id: "TODOS", label: "Todos" },
    { id: "CLIENTE", label: "Clientes" },
    { id: "EMPRESA", label: "Empresas" },
    { id: "SUSPENSO", label: "Suspensos" },
];

const CONFIRMACOES = {
    SUSPENDER: {
        status: "SUSPENSO",
        botao: "Confirmar Suspensão",
        mensagem:
            "Tem certeza que deseja suspender este usuário? Se for uma Empresa, seu catálogo será ocultado e pedidos pendentes serão afetados.",
    },
    REMOVER: {
        status: "REMOVIDO",
        botao: "Confirmar Remoção",
        mensagem:
            "Tem certeza que deseja remover este usuário? A conta será removida logicamente e o histórico será preservado.",
    },
};

const MENSAGEM_STATUS = {
    SUSPENSO: "Conta suspensa.",
    ATIVO: "Conta reativada.",
    REMOVIDO: "Conta removida.",
};

function montarLinhas({ clientes, empresas, usuarios }) {
    const usuariosPorId = porId(usuarios);
    const doUsuario = (idUsuario) => usuariosPorId.get(String(idUsuario));

    const deClientes = clientes.map((c) => ({
        chave: `cliente-${c.id}`,
        recurso: "clientes",
        id: c.id,
        registro: c,
        idUsuario: c.idUsuario,
        tipo: "CLIENTE",
        nome: c.nomeCompleto,
        documento: c.cpf,
        rotuloDocumento: `CPF: ${formatarCpf(c.cpf)}`,
        email: doUsuario(c.idUsuario)?.email ?? "—",
        dataCadastro: doUsuario(c.idUsuario)?.dataCadastro,
        status: c.status ?? "ATIVO",
    }));

    const deEmpresas = empresas.map((e) => ({
        chave: `empresa-${e.id}`,
        recurso: "empresas",
        id: e.id,
        registro: e,
        idUsuario: e.idUsuario,
        tipo: "EMPRESA",
        nome: e.razaoSocial,
        documento: e.cnpj,
        rotuloDocumento: `CNPJ: ${formatarCnpj(e.cnpj)}`,
        email: doUsuario(e.idUsuario)?.email ?? "—",
        dataCadastro: doUsuario(e.idUsuario)?.dataCadastro,
        status: e.status ?? "ATIVO",
    }));

    return [...deClientes, ...deEmpresas].filter((l) => l.status !== "REMOVIDO");
}

export default function GestaoUsuarios() {
    const navigate = useNavigate();
    const [linhas, setLinhas] = React.useState(null);
    const [aba, setAba] = React.useState("TODOS");
    const [busca, setBusca] = React.useState("");
    const [confirmacao, setConfirmacao] = React.useState(null);

    React.useEffect(() => {
        Promise.all([listar("clientes"), listar("empresas"), listar("usuarios")])
            .then(([clientes, empresas, usuarios]) => setLinhas(montarLinhas({ clientes, empresas, usuarios })))
            .catch(() => {
                mensagemErro("Erro ao carregar os usuários.");
                setLinhas([]);
            });
    }, []);

    const visiveis = React.useMemo(() => {
        const termo = busca.trim().toLowerCase();
        const digitos = soDigitos(termo);
        const naAba = (l) => aba === "TODOS" || (aba === "SUSPENSO" ? l.status === "SUSPENSO" : l.tipo === aba);

        return (linhas ?? []).filter((l) => {
            if (!naAba(l)) return false;
            if (!termo) return true;
            return (
                `${l.nome} ${l.email}`.toLowerCase().includes(termo) ||
                (digitos !== "" && soDigitos(l.documento).includes(digitos))
            );
        });
    }, [linhas, aba, busca]);

    async function alterarStatus(linha, novoStatus) {
        try {
            const atualizado = { ...linha.registro, status: novoStatus };
            await salvarRegistro(linha.recurso, atualizado);
            setLinhas((atual) =>
                novoStatus === "REMOVIDO"
                    ? atual.filter((l) => l.chave !== linha.chave)
                    : atual.map((l) =>
                          l.chave === linha.chave ? { ...l, status: novoStatus, registro: atualizado } : l
                      )
            );
            mensagemSucesso(MENSAGEM_STATUS[novoStatus]);
        } catch {
            mensagemErro("Erro ao atualizar a conta.");
        }
    }

    function confirmar() {
        alterarStatus(confirmacao.linha, CONFIRMACOES[confirmacao.acao].status);
        setConfirmacao(null);
    }

    const editar = (l) => navigate(l.tipo === "CLIENTE" ? `/cadastro-cliente/${l.id}` : `/cadastro-empresa/${l.id}`);

    return (
        <AdminLayout>
            <PageHeader
                trail={["Administração", "Usuários"]}
                title="Gerenciamento de Usuários"
                subtitle="Acesso irrestrito para gerenciar, editar dados cadastrais, suspender ou remover contas"
            />

            <div className="mk-toolbar">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar por nome, e-mail ou CPF/CNPJ..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                />

                <div className="mk-tabs">
                    {ABAS.map((a) => (
                        <button
                            key={a.id}
                            type="button"
                            className={aba === a.id ? "is-active" : ""}
                            onClick={() => setAba(a.id)}
                        >
                            {a.label}
                        </button>
                    ))}
                </div>
            </div>

            {linhas === null ? (
                <div className="text-center my-4">Carregando usuários...</div>
            ) : (
                <div className="mk-table-card">
                    <div className="mk-table-scroll">
                        <table className="mk-table">
                            <thead>
                                <tr>
                                    <th scope="col">Usuário</th>
                                    <th scope="col">Tipo de perfil</th>
                                    <th scope="col">Data cadastro</th>
                                    <th scope="col">Status</th>
                                    <th scope="col">Ações do administrador</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visiveis.map((l) => (
                                    <tr key={l.chave} className={l.status === "SUSPENSO" ? "is-suspended" : ""}>
                                        <td>
                                            {l.tipo === "EMPRESA" ? (
                                                <button
                                                    type="button"
                                                    className="mk-user__name mk-user__name--link"
                                                    onClick={() => navigate("/admin/lojas", { state: { empresaId: l.id } })}
                                                >
                                                    {l.nome}
                                                </button>
                                            ) : (
                                                <strong className="mk-user__name">{l.nome}</strong>
                                            )}
                                            <span className="mk-cell-sub">
                                                {l.email} • {l.rotuloDocumento}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`mk-pill ${l.tipo === "EMPRESA" ? "mk-pill--warn" : ""}`}>{l.tipo}</span>
                                        </td>
                                        <td>{formatarData(l.dataCadastro)}</td>
                                        <td>
                                            <span className={`mk-pill ${l.status === "SUSPENSO" ? "mk-pill--soft-danger" : "mk-pill--ok"}`}>
                                                {l.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="mk-acts">
                                                <button type="button" className="mk-act" onClick={() => editar(l)}>
                                                    ✏️ Editar
                                                </button>
                                                {l.status === "SUSPENSO" ? (
                                                    <button type="button" className="mk-act mk-act--ok" onClick={() => alterarStatus(l, "ATIVO")}>
                                                        ▶️ Reativar
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="mk-act"
                                                        onClick={() => setConfirmacao({ acao: "SUSPENDER", linha: l })}
                                                    >
                                                        ⏸️ Suspender
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    className="mk-act mk-act--danger"
                                                    onClick={() => setConfirmacao({ acao: "REMOVER", linha: l })}
                                                >
                                                    🗑️ Remover
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {visiveis.length === 0 && <div className="mk-table-empty">Nenhum usuário encontrado.</div>}
                </div>
            )}

            {confirmacao && (
                <div className="mk-modal" role="dialog" aria-modal="true" onClick={() => setConfirmacao(null)}>
                    <div className="mk-modal__box" onClick={(e) => e.stopPropagation()}>
                        <h2>❗ Confirmação de Ação</h2>
                        <p>{CONFIRMACOES[confirmacao.acao].mensagem}</p>
                        <div className="mk-modal__actions">
                            <button type="button" className="btn btn-danger" onClick={confirmar}>
                                {CONFIRMACOES[confirmacao.acao].botao}
                            </button>
                            <button type="button" className="btn btn-outline-secondary" onClick={() => setConfirmacao(null)}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}