import React from "react";
import axios from "axios";

import AdminLayout from "../../components/admin-layout";
import FormGroup from "../../components/form-group";
import PageHeader from "../../components/page-header";
import { mensagemAlert, mensagemErro, mensagemSucesso } from "../../components/toastr";
import { BASE_URL } from "../../config/axios";
import { listar } from "../../utils/api";

const baseURL = `${BASE_URL}/categorias`;
const FORM_VAZIO = { id: null, nome: "", descricao: "", idCategoriaPai: "" };
const CABECALHO_JSON = { headers: { "Content-Type": "application/json" } };

function montarArvore(categorias) {
    const ids = new Set(categorias.map((c) => String(c.id)));
    const filhasDe = new Map();
    const raizes = [];

    for (const c of categorias) {
        const pai = c.idCategoriaPai === null || c.idCategoriaPai === undefined ? null : String(c.idCategoriaPai);
        if (pai === null || !ids.has(pai)) {
            raizes.push(c);
        } else {
            filhasDe.set(pai, [...(filhasDe.get(pai) ?? []), c]);
        }
    }

    const linhas = [];
    const percorrer = (categoria, profundidade) => {
        linhas.push({ categoria, profundidade });
        (filhasDe.get(String(categoria.id)) ?? []).forEach((f) => percorrer(f, profundidade + 1));
    };
    raizes.forEach((r) => percorrer(r, 0));

    return { linhas, filhasDe };
}

function idsDaSubarvore(filhasDe, id) {
    const resultado = [String(id)];
    (filhasDe.get(String(id)) ?? []).forEach((f) => resultado.push(...idsDaSubarvore(filhasDe, f.id)));
    return resultado;
}

const plural = (n, singular, plurais) => `${n} ${n === 1 ? singular : plurais}`;

export default function CategoriasGlobais() {
    const [categorias, setCategorias] = React.useState(null);
    const [vinculos, setVinculos] = React.useState([]);
    const [form, setForm] = React.useState(FORM_VAZIO);

    React.useEffect(() => {
        Promise.all([listar("categorias"), listar("produtoCategoria")])
            .then(([cats, ligacoes]) => {
                setCategorias(cats);
                setVinculos(ligacoes);
            })
            .catch(() => {
                mensagemErro("Erro ao carregar as categorias.");
                setCategorias([]);
            });
    }, []);

    const { linhas, filhasDe } = React.useMemo(() => montarArvore(categorias ?? []), [categorias]);

    function resumo(categoria) {
        const ids = new Set(idsDaSubarvore(filhasDe, categoria.id));
        const produtosDe = (condicao) =>
            new Set(vinculos.filter((v) => condicao(String(v.idCategoria))).map((v) => String(v.idProduto))).size;

        return {
            produtosDiretos: produtosDe((idCategoria) => idCategoria === String(categoria.id)),
            produtosDaArvore: produtosDe((idCategoria) => ids.has(idCategoria)),
            subcategorias: ids.size - 1,
        };
    }

    const novaCategoria = (idPai = "") => setForm({ ...FORM_VAZIO, idCategoriaPai: String(idPai) });

    const editar = (c) =>
        setForm({
            id: c.id,
            nome: c.nome ?? "",
            descricao: c.descricao ?? "",
            idCategoriaPai: c.idCategoriaPai === null || c.idCategoriaPai === undefined ? "" : String(c.idCategoriaPai),
        });

    async function excluir(categoria) {
        const r = resumo(categoria);

        if (r.produtosDaArvore > 0) {
            mensagemAlert(
                `Exclusão bloqueada: a categoria possui ${plural(r.produtosDaArvore, "produto vinculado", "produtos vinculados")}.`
            );
            return;
        }
        if (r.subcategorias > 0) {
            mensagemAlert(
                `Exclusão bloqueada: a categoria possui ${plural(r.subcategorias, "subcategoria", "subcategorias")}.`
            );
            return;
        }
        if (!window.confirm(`Excluir a categoria "${categoria.nome}"?`)) return;

        try {
            await axios.delete(`${baseURL}/${categoria.id}`);
            setCategorias((atual) => atual.filter((c) => String(c.id) !== String(categoria.id)));
            if (String(form.id) === String(categoria.id)) setForm(FORM_VAZIO);
            mensagemSucesso("Categoria excluída com sucesso!");
        } catch {
            mensagemErro("Erro ao excluir a categoria.");
        }
    }

    async function salvar() {
        if (!form.nome.trim()) {
            mensagemErro("O campo Nome é obrigatório.");
            return;
        }

        const dados = {
            id: form.id,
            nome: form.nome.trim(),
            descricao: form.descricao,
            idCategoriaPai: form.idCategoriaPai ? Number(form.idCategoriaPai) : null,
        };

        try {
            if (form.id === null) {
                const resposta = await axios.post(baseURL, dados, CABECALHO_JSON);
                const proximoId = Math.max(0, ...categorias.map((c) => Number(c.id))) + 1;
                setCategorias((atual) => [...atual, { ...dados, id: proximoId, ...(resposta.data ?? {}) }]);
                setForm(FORM_VAZIO);
                mensagemSucesso(`Categoria "${dados.nome}" cadastrada com sucesso!`);
            } else {
                await axios.put(`${baseURL}/${form.id}`, dados, CABECALHO_JSON);
                setCategorias((atual) =>
                    atual.map((c) => (String(c.id) === String(form.id) ? { ...c, ...dados } : c))
                );
                mensagemSucesso(`Categoria "${dados.nome}" alterada com sucesso!`);
            }
        } catch {
            mensagemErro("Erro ao salvar a categoria.");
        }
    }

    const bloqueadosComoPai = new Set(form.id !== null ? idsDaSubarvore(filhasDe, form.id) : []);
    const emEdicao = form.id !== null ? (categorias ?? []).find((c) => String(c.id) === String(form.id)) : null;
    const regra = emEdicao ? resumo(emEdicao) : null;

    return (
        <AdminLayout>
            <PageHeader
                trail={["Administração", "Categorias"]}
                title="Gestão Global da Árvore de Categorias"
                subtitle="Crie categorias raiz, subcategorias e gerencie exclusões com proteção de integridade"
            />

            <div className="mk-tree-grid">
                <section className="mk-tree-card">
                    <div className="mk-tree-card__head">
                        <h2>Estrutura de Categorias</h2>
                        <button type="button" className="btn btn-warning btn-sm" onClick={() => novaCategoria()}>
                            + Nova Categoria Raiz
                        </button>
                    </div>

                    {categorias === null && <div className="text-center my-4">Carregando categorias...</div>}
                    {categorias !== null && linhas.length === 0 && <div className="mk-empty">Nenhuma categoria cadastrada.</div>}

                    {linhas.map(({ categoria: c, profundidade }) => {
                        const r = resumo(c);
                        const bloqueada = r.produtosDaArvore > 0 || r.subcategorias > 0;
                        const raiz = profundidade === 0;

                        return (
                            <div
                                key={c.id}
                                className={`mk-tree-row ${raiz ? "is-root" : ""} ${String(form.id) === String(c.id) ? "is-selected" : ""}`}
                                style={{ marginLeft: profundidade * 20 }}
                            >
                                <span className="mk-tree-row__name">
                                    {raiz ? "📁 " : "└ 📄 "}
                                    {c.nome}{" "}
                                    {raiz ? "(Categoria Raiz)" : `(${plural(r.produtosDiretos, "produto", "produtos")})`}
                                </span>
                                <button type="button" className="mk-tree-btn" aria-label={`Editar ${c.nome}`} onClick={() => editar(c)}>
                                    ✏️
                                </button>
                                <button type="button" className="mk-tree-sub" onClick={() => novaCategoria(c.id)}>
                                    + Sub
                                </button>
                                <button
                                    type="button"
                                    className="mk-tree-btn"
                                    aria-label={bloqueada ? `Exclusão bloqueada de ${c.nome}` : `Excluir ${c.nome}`}
                                    onClick={() => excluir(c)}
                                >
                                    {bloqueada ? "🔒" : "🗑️"}
                                </button>
                            </div>
                        );
                    })}
                </section>

                <section className="mk-tree-card">
                    <h2>Criar / Editar Categoria</h2>

                    <FormGroup label="Nome da Categoria" htmlFor="inputNome">
                        <input
                            type="text"
                            id="inputNome"
                            className="form-control"
                            value={form.nome}
                            onChange={(e) => setForm({ ...form, nome: e.target.value })}
                        />
                    </FormGroup>

                    <FormGroup label="Categoria Pai (Deixe vazio para Categoria Raiz)" htmlFor="selectCategoriaPai">
                        <select
                            id="selectCategoriaPai"
                            className="form-control"
                            value={form.idCategoriaPai}
                            onChange={(e) => setForm({ ...form, idCategoriaPai: e.target.value })}
                        >
                            <option value="">Nenhuma (Categoria Raiz)</option>
                            {(categorias ?? [])
                                .filter((c) => !bloqueadosComoPai.has(String(c.id)))
                                .map((c) => (
                                    <option key={c.id} value={String(c.id)}>
                                        {`${c.nome} (ID #${c.id})`}
                                    </option>
                                ))}
                        </select>
                    </FormGroup>

                    <FormGroup label="Descrição" htmlFor="inputDescricao">
                        <textarea
                            id="inputDescricao"
                            rows={4}
                            className="form-control"
                            value={form.descricao}
                            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                        />
                    </FormGroup>

                    {regra && (
                        <div className="mk-rule">
                            <strong>🔒 Regra de Exclusão Segura</strong>
                            <p>
                                {regra.produtosDaArvore > 0
                                    ? `Esta categoria possui ${plural(regra.produtosDaArvore, "produto vinculado", "produtos vinculados")}. A exclusão fica bloqueada até que os produtos sejam remanejados.`
                                    : regra.subcategorias > 0
                                    ? `Esta categoria possui ${plural(regra.subcategorias, "subcategoria", "subcategorias")}. A exclusão fica bloqueada até que sejam removidas ou remanejadas.`
                                    : "Esta categoria não possui produtos vinculados. A exclusão está liberada."}
                            </p>
                        </div>
                    )}

                    <button type="button" className="btn btn-warning w-100" onClick={salvar}>
                        Salvar Alterações
                    </button>
                </section>
            </div>
        </AdminLayout>
    );
}