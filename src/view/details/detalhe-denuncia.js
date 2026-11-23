import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import AdminLayout from "../../components/admin-layout";
import PageHeader from "../../components/page-header";
import { mensagemErro, mensagemSucesso } from "../../components/toastr";
import { salvarRegistro } from "../../utils/admin-api";
import { listar, porId } from "../../utils/api";
import { formatarCnpj } from "../../utils/documentos";
import { formatarData, formatarMoeda } from "../../utils/formatar";

const ROTULO_ALVO = { PRODUTO: "Produto", EMPRESA: "Empresa", USUARIO: "Usuário", AVALIACAO: "Avaliação" };
const ROTULO_QUEM = { CLIENTE: "Cliente", EMPRESA: "Empresa" };

function Campo({ rotulo, valor, largo = false }) {
    return (
        <div className={largo ? "mk-detail__wide" : ""}>
            <dt>{rotulo}</dt>
            <dd>{valor || valor === 0 ? valor : "—"}</dd>
        </div>
    );
}

function Selo({ texto, ok }) {
    return <span className={`mk-pill ${ok ? "mk-pill--ok" : "mk-pill--soft-danger"}`}>{texto}</span>;
}

export default function DetalheDenuncia() {
    const { idParam } = useParams();
    const navigate = useNavigate();
    const [dados, setDados] = React.useState(null);

    React.useEffect(() => {
        Promise.all([
            listar("denuncias"),
            listar("produtos"),
            listar("clientes"),
            listar("empresas"),
            listar("usuarios"),
            listar("avaliacoes"),
        ])
            .then(([denuncias, produtos, clientes, empresas, usuarios, avaliacoes]) =>
                setDados({ denuncias, produtos, clientes, empresas, usuarios, avaliacoes })
            )
            .catch(() => {
                mensagemErro("Erro ao carregar a denúncia.");
                setDados({ denuncias: [], produtos: [], clientes: [], empresas: [], usuarios: [], avaliacoes: [] });
            });
    }, []);

    const mapas = React.useMemo(
        () =>
            dados && {
                produtos: porId(dados.produtos),
                clientes: porId(dados.clientes),
                empresas: porId(dados.empresas),
                usuarios: porId(dados.usuarios),
                avaliacoes: porId(dados.avaliacoes),
            },
        [dados]
    );

    const denuncia = dados ? dados.denuncias.find((d) => String(d.id) === String(idParam)) : null;
    const produto = denuncia?.tipoAlvo === "PRODUTO" ? mapas.produtos.get(String(denuncia.idAlvo)) : null;

    async function inativarProduto() {
        try {
            const atualizado = { ...produto, status: "INATIVO" };
            await salvarRegistro("produtos", atualizado);
            setDados((atual) => ({
                ...atual,
                produtos: atual.produtos.map((p) => (String(p.id) === String(produto.id) ? atualizado : p)),
            }));
            mensagemSucesso("Produto inativado.");
        } catch {
            mensagemErro("Erro ao inativar o produto.");
        }
    }

    async function marcarResolvida() {
        try {
            await salvarRegistro("denuncias", { ...denuncia, status: "RESOLVIDA" });
            mensagemSucesso("Denúncia marcada como resolvida.");
            navigate("/admin/moderacao");
        } catch {
            mensagemErro("Erro ao resolver a denúncia.");
        }
    }

    function nomeDenunciante() {
        const id = String(denuncia.idDenunciante);
        const nome =
            denuncia.denuncianteTipo === "CLIENTE"
                ? mapas.clientes.get(id)?.nomeCompleto
                : mapas.empresas.get(id)?.nomeFantasia;
        return `${nome ?? "—"} (${ROTULO_QUEM[denuncia.denuncianteTipo] ?? "—"})`;
    }

    function dadosDoAlvo() {
        const id = String(denuncia.idAlvo);

        if (denuncia.tipoAlvo === "PRODUTO") {
            if (!produto) return <Campo rotulo="Produto" valor="Produto removido" />;
            return (
                <>
                    <Campo rotulo="Produto" valor={produto.titulo} />
                    <Campo rotulo="Loja" valor={mapas.empresas.get(String(produto.empresa))?.nomeFantasia} />
                    <Campo rotulo="Descrição" valor={produto.descricao} largo />
                    <Campo rotulo="Preço" valor={formatarMoeda(produto.preco)} />
                    <Campo rotulo="Estoque" valor={`${produto.estoqueQuantidade} un`} />
                    <Campo rotulo="Condição" valor={produto.condicao} />
                    <Campo rotulo="Frete grátis" valor={produto.freteGratis ? "Sim" : "Não"} />
                    <Campo rotulo="Status" valor={<Selo texto={produto.status} ok={produto.status === "ATIVO"} />} />
                </>
            );
        }

        if (denuncia.tipoAlvo === "EMPRESA") {
            const empresa = mapas.empresas.get(id);
            if (!empresa) return <Campo rotulo="Empresa" valor="Empresa removida" />;
            return (
                <>
                    <Campo rotulo="Razão social" valor={empresa.razaoSocial} />
                    <Campo rotulo="Nome fantasia" valor={empresa.nomeFantasia} />
                    <Campo rotulo="CNPJ" valor={formatarCnpj(empresa.cnpj)} />
                    <Campo rotulo="Responsável legal" valor={empresa.responsavelLegal} />
                    <Campo rotulo="Status" valor={<Selo texto={empresa.status} ok={empresa.status === "ATIVO"} />} />
                    <Campo rotulo="Verificação" valor={empresa.statusVerificacao} />
                </>
            );
        }

        if (denuncia.tipoAlvo === "USUARIO") {
            const usuario = mapas.usuarios.get(id);
            if (!usuario) return <Campo rotulo="Usuário" valor="Usuário removido" />;
            return (
                <>
                    <Campo rotulo="Nome" valor={usuario.nome} />
                    <Campo rotulo="E-mail" valor={usuario.email} />
                    <Campo rotulo="Data de cadastro" valor={formatarData(usuario.dataCadastro)} />
                </>
            );
        }

        const avaliacao = mapas.avaliacoes.get(id);
        if (!avaliacao) return <Campo rotulo="Avaliação" valor="Avaliação removida" />;
        return (
            <>
                <Campo rotulo="Autor" valor={mapas.clientes.get(String(avaliacao.idCliente))?.nomeCompleto} />
                <Campo rotulo="Nota" valor={`★ ${Number(avaliacao.nota).toFixed(1)}`} />
                <Campo rotulo="Comentário" valor={avaliacao.comentario} largo />
                <Campo rotulo="Status" valor={avaliacao.status} />
            </>
        );
    }

    return (
        <AdminLayout>
            <PageHeader
                trail={["Administração", "Moderação", "Denúncia"]}
                title={denuncia ? `Denúncia #DEN-${denuncia.id}` : "Denúncia"}
                subtitle="Analise os detalhes da denúncia e modere o alvo denunciado"
            />

            {dados === null ? (
                <div className="text-center my-4">Carregando denúncia...</div>
            ) : !denuncia ? (
                <>
                    <div className="mk-empty">Denúncia não encontrada.</div>
                    <div className="mk-detail-actions mt-3">
                        <button type="button" className="btn btn-outline-secondary" onClick={() => navigate("/admin/moderacao")}>
                            Voltar
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <section className="mk-section-card">
                        <h2>Dados da denúncia</h2>
                        <dl className="mk-detail">
                            <Campo rotulo="Alvo" valor={ROTULO_ALVO[denuncia.tipoAlvo] ?? denuncia.tipoAlvo} />
                            <Campo rotulo="Data" valor={formatarData(denuncia.data)} />
                            <Campo rotulo="Denunciante" valor={nomeDenunciante()} />
                            <Campo
                                rotulo="Status"
                                valor={<Selo texto={denuncia.status.replace("_", " ")} ok={denuncia.status === "RESOLVIDA"} />}
                            />
                            <Campo rotulo="Ação tomada" valor={denuncia.acaoTomada} />
                            <Campo rotulo="Motivo" valor={denuncia.motivo} largo />
                        </dl>
                    </section>

                    <section className="mk-section-card">
                        <h2>{`Dados do alvo (${ROTULO_ALVO[denuncia.tipoAlvo] ?? denuncia.tipoAlvo})`}</h2>
                        <dl className="mk-detail">{dadosDoAlvo()}</dl>
                    </section>

                    <div className="mk-detail-actions">
                        <button type="button" className="btn btn-outline-secondary" onClick={() => navigate("/admin/moderacao")}>
                            Voltar
                        </button>
                        {produto && (
                            <button
                                type="button"
                                className="btn btn-danger"
                                disabled={produto.status === "INATIVO"}
                                onClick={inativarProduto}
                            >
                                🛑 Inativar Produto
                            </button>
                        )}
                        <button
                            type="button"
                            className="btn btn-dark"
                            disabled={denuncia.status === "RESOLVIDA"}
                            onClick={marcarResolvida}
                        >
                            ✓ Marcar Resolvida
                        </button>
                    </div>
                </>
            )}
        </AdminLayout>
    );
}