import React from "react";
import { useNavigate } from "react-router-dom";

import AdminLayout from "../../components/admin-layout";
import PageHeader from "../../components/page-header";
import { mensagemErro } from "../../components/toastr";
import { listar } from "../../utils/api";
import { formatarMoeda } from "../../utils/formatar";

function notaDaEmpresa(avaliacoes, idEmpresa) {
    const notas = avaliacoes
        .filter((a) => String(a.idEmpresa) === String(idEmpresa) && a.status === "PUBLICADA")
        .map((a) => Number(a.nota));

    if (notas.length === 0) return null;
    return notas.reduce((soma, n) => soma + n, 0) / notas.length;
}

function EmpresaCard({ empresa, produtos, nota, aberta, onAlternar, onVitrine, onModerar }) {
    const ativos = produtos.filter((p) => p.status === "ATIVO").length;

    return (
        <article className={`mk-store ${aberta ? "is-open" : ""}`}>
            <div className="mk-store__head">
                <span className="mk-store__logo">
                    {empresa.logoUrl ? (
                        <img src={empresa.logoUrl} alt={empresa.nomeFantasia} />
                    ) : (
                        empresa.nomeFantasia?.charAt(0)
                    )}
                </span>

                <div className="mk-store__info">
                    <h2>{empresa.nomeFantasia}</h2>
                    <p>
                        CNPJ: {empresa.cnpj} •{" "}
                        {aberta ? `${ativos} Produtos Ativos` : `${produtos.length} Produtos Cadastrados`}
                        {aberta && nota !== null && ` • Nota Média: ★ ${nota.toFixed(1)}`}
                    </p>
                </div>

                {aberta && (
                    <button type="button" className="btn btn-dark btn-sm" onClick={onVitrine}>
                        Ver Vitrine
                    </button>
                )}
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onAlternar}>
                    {aberta ? "Recolher ⌃" : "Abrir Catálogo ⌄"}
                </button>
            </div>

            {aberta && (
                <div className="mk-store__table mk-table-scroll">
                    <table className="mk-table">
                        <thead>
                            <tr>
                                <th scope="col">Produto no catálogo</th>
                                <th scope="col">Preço</th>
                                <th scope="col">Custo</th>
                                <th scope="col">Estoque</th>
                                <th scope="col">Status</th>
                                <th scope="col">Ação admin</th>
                            </tr>
                        </thead>
                        <tbody>
                            {produtos.map((p) => (
                                <tr key={p.id}>
                                    <td>
                                        <strong>{p.titulo}</strong>
                                    </td>
                                    <td>{formatarMoeda(p.preco)}</td>
                                    <td className={Number(p.custo) > Number(p.preco) ? "mk-negative" : "mk-muted"}>
                                        {formatarMoeda(p.custo)}
                                    </td>
                                    <td>{p.estoqueQuantidade} un</td>
                                    <td>
                                        <span className={`mk-pill ${p.status === "ATIVO" ? "mk-pill--ok" : "mk-pill--soft-danger"}`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button type="button" className="mk-link-danger" onClick={onModerar}>
                                            Moderar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {produtos.length === 0 && <div className="mk-table-empty">Nenhum produto cadastrado.</div>}
                </div>
            )}
        </article>
    );
}

export default function LojasCatalogos() {
    const navigate = useNavigate();
    const [dados, setDados] = React.useState(null);
    const [abertaId, setAbertaId] = React.useState(null);

    React.useEffect(() => {
        Promise.all([listar("empresas"), listar("produtos"), listar("avaliacoes")])
            .then(([empresas, produtos, avaliacoes]) => {
                setDados({ empresas, produtos, avaliacoes });
                setAbertaId(empresas.length > 0 ? String(empresas[0].id) : null);
            })
            .catch(() => {
                mensagemErro("Erro ao carregar as empresas e catálogos.");
                setDados({ empresas: [], produtos: [], avaliacoes: [] });
            });
    }, []);

    const alternar = (id) => setAbertaId((atual) => (atual === String(id) ? null : String(id)));

    return (
        <AdminLayout>
            <PageHeader
                trail={["Administração", "Lojas & Catálogos"]}
                title="Visualização Geral de Empresas e Catálogos"
                subtitle="Inspecione o inventário e a oferta de produtos de cada empresa cadastrada"
            />

            {dados === null ? (
                <div className="text-center my-4">Carregando empresas...</div>
            ) : dados.empresas.length === 0 ? (
                <div className="mk-empty">Nenhuma empresa cadastrada.</div>
            ) : (
                dados.empresas.map((empresa) => (
                    <EmpresaCard
                        key={empresa.id}
                        empresa={empresa}
                        produtos={dados.produtos.filter((p) => String(p.empresa) === String(empresa.id))}
                        nota={notaDaEmpresa(dados.avaliacoes, empresa.id)}
                        aberta={abertaId === String(empresa.id)}
                        onAlternar={() => alternar(empresa.id)}
                        onVitrine={() => navigate("/listagem-produtos")}
                        onModerar={() => navigate("/admin/moderacao")}
                    />
                ))
            )}
        </AdminLayout>
    );
}