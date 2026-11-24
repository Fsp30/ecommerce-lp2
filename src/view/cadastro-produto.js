import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";

import { mensagemErro, mensagemSucesso } from "../components/toastr";
import { obterSessao } from "../config/sessao";
import { BASE_URL } from "../config/axios";
import { lerImagem } from "../utils/imagem";

const MAX_FOTOS = 6;

const FORM_VAZIO = {
    titulo: "",
    descricao: "",
    preco: "",
    precoPromocional: "",
    custo: "",
    estoque: "",
    condicao: "NOVO",
    freteGratis: false,
};

const moeda = (valor) =>
    Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function CadastroProduto() {
    const { idParam } = useParams();
    const navigate = useNavigate();
    const baseURL = `${BASE_URL}/produtos`;
    const { empresaId } = obterSessao();

    const [form, setForm] = useState(FORM_VAZIO);
    const [fotos, setFotos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [categoriasDisponiveis, setCategoriasDisponiveis] = useState([]);
    const [salvando, setSalvando] = useState(false);

    const inputFoto = useRef(null);

    useEffect(() => {
        axios
            .get(`${BASE_URL}/categorias`)
            .then((res) => setCategoriasDisponiveis(res.data || []))
            .catch(() => mensagemErro("Erro ao carregar as categorias."));

        if (!idParam) return;

        axios
            .get(`${baseURL}/${idParam}`)
            .then((res) => {
                const p = res.data;
                setForm({
                    titulo: p.titulo || "",
                    descricao: p.descricao || "",
                    preco: p.preco ?? "",
                    precoPromocional: p.precoPromocional ?? "",
                    custo: p.custo ?? "",
                    estoque: p.estoqueQuantidade ?? "",
                    condicao: p.condicao || "NOVO",
                    freteGratis: Boolean(p.freteGratis),
                });
                setFotos(Array.isArray(p.fotos) ? p.fotos.filter(Boolean) : []);
                setCategorias(
                    Array.isArray(p.categorias)
                        ? p.categorias.map((c) => (typeof c === "object" ? c.id : c))
                        : []
                );
            })
            .catch(() => mensagemErro("Erro ao carregar os dados do produto."));
    }, [idParam, baseURL]);

    const alterar = (campo) => (e) => {
        const valor = e.target.type === "checkbox" ? e.target.checked : e.target.value;
        setForm((f) => ({ ...f, [campo]: valor }));
    };

    // Nome com o pai, ex.: "Informática › Placas de Vídeo"
    const nomeCategoria = (cat) => {
        const pai = categoriasDisponiveis.find(
            (c) => String(c.id) === String(cat.idCategoriaPai)
        );
        return pai ? `${pai.nome} › ${cat.nome}` : cat.nome;
    };

    const categoriasEscolhidas = useMemo(
        () =>
            categorias
                .map((id) => categoriasDisponiveis.find((c) => String(c.id) === String(id)))
                .filter(Boolean),
        [categorias, categoriasDisponiveis]
    );

    const categoriasRestantes = categoriasDisponiveis.filter(
        (c) => !categorias.some((id) => String(id) === String(c.id))
    );

    function adicionarCategoria(e) {
        const id = e.target.value;
        if (!id) return;
        setCategorias((atual) => [...atual, Number(id)]);
    }

    function removerCategoria(id) {
        setCategorias((atual) => atual.filter((c) => String(c) !== String(id)));
    }

    async function adicionarFoto(e) {
        const arquivo = e.target.files?.[0];
        e.target.value = "";
        if (!arquivo) return;

        try {
            const dataUrl = await lerImagem(arquivo);
            setFotos((atual) => [...atual, dataUrl].slice(0, MAX_FOTOS));
        } catch (error) {
            mensagemErro(error.message);
        }
    }

    function removerFoto(indice) {
        setFotos((atual) => atual.filter((_, i) => i !== indice));
    }

    function limpar() {
        setForm(FORM_VAZIO);
        setFotos([]);
        setCategorias([]);
    }

    async function salvar(status) {
        if (!form.titulo.trim()) {
            mensagemErro("O campo Título é obrigatório.");
            return;
        }

        if (status === "ATIVO") {
            if (!form.preco) {
                mensagemErro("O campo Preço de Venda é obrigatório.");
                return;
            }
            if (categorias.length === 0) {
                mensagemErro("Selecione ao menos uma categoria.");
                return;
            }
        }

        const data = {
            id: idParam ? Number(idParam) : null,
            empresa: empresaId ? Number(empresaId) : null,
            titulo: form.titulo.trim(),
            descricao: form.descricao,
            preco: Number(form.preco) || 0,
            precoPromocional: form.precoPromocional ? Number(form.precoPromocional) : null,
            dataPromocaoInicio: null,
            dataPromocaoFim: null,
            custo: form.custo ? Number(form.custo) : 0,
            estoqueQuantidade: Number(form.estoque) || 0,
            estoqueReservado: 0,
            condicao: form.condicao,
            freteGratis: form.freteGratis,
            status,
            fotos: fotos.length ? fotos : [""],
            categorias,
            notaMedia: idParam ? undefined : 0,
            percentualRecomendacao: idParam ? undefined : 0,
            dataCadastro: idParam ? undefined : new Date().toISOString().slice(0, 10),
        };

        setSalvando(true);
        try {
            const cabecalho = { headers: { "Content-Type": "application/json" } };

            if (!idParam) {
                await axios.post(baseURL, data, cabecalho);
            } else {
                await axios.put(`${baseURL}/${idParam}`, data, cabecalho);
            }

            if (status === "INATIVO") {
                mensagemSucesso(`Produto "${form.titulo}" salvo como rascunho.`);
            } else if (idParam) {
                mensagemSucesso(`Produto "${form.titulo}" alterado com sucesso!`);
            } else {
                mensagemSucesso(`Produto "${form.titulo}" cadastrado com sucesso!`);
            }

            navigate("/listagem-produtos");
        } catch (error) {
            mensagemErro(error.response?.data || "Erro ao salvar o produto.");
            setSalvando(false);
        }
    }

    const preco = Number(form.preco);
    const custo = Number(form.custo);
    const lucro = form.preco && form.custo ? preco - custo : null;
    const margem = lucro !== null && custo > 0 ? (lucro / custo) * 100 : null;

    const slots = Array.from({ length: MAX_FOTOS }, (_, i) => i);

    return (
        <>
            <button type="button" className="mk-back" onClick={() => navigate("/listagem-produtos")}>
                <ArrowBackIosNewIcon sx={{ fontSize: 14 }} />
                Voltar
            </button>

            <section className="mk-form-card">
                <h1>{idParam ? "Editar Produto (RF12)" : "Cadastrar Novo Produto (RF12)"}</h1>
                <p className="mk-form-card__sub">
                    Preencha os dados e fotos do produto para disponibilizá-lo na plataforma
                </p>

                <div className="mk-field">
                    <span className="form-label">Fotos do Produto (Máximo 6 imagens - RN25)</span>

                    <div className="mk-photos">
                        {slots.map((i) => {
                            const foto = fotos[i];
                            const proximo = i === fotos.length && fotos.length < MAX_FOTOS;

                            if (foto) {
                                return (
                                    <div key={i} className={`mk-photo ${i === 0 ? "is-capa" : ""}`}>
                                        <img src={foto} alt={`Foto ${i + 1} do produto`} />
                                        {i === 0 && <span className="mk-photo__label">Capa</span>}
                                        <button
                                            type="button"
                                            className="mk-photo__remove"
                                            aria-label={`Remover foto ${i + 1}`}
                                            onClick={() => removerFoto(i)}
                                        >
                                            <CloseIcon sx={{ fontSize: 14 }} />
                                        </button>
                                    </div>
                                );
                            }

                            return (
                                <button
                                    key={i}
                                    type="button"
                                    className={`mk-photo mk-photo--add ${i === 0 ? "is-capa" : ""}`}
                                    disabled={!proximo}
                                    onClick={() => inputFoto.current?.click()}
                                >
                                    <AddIcon sx={{ fontSize: 18 }} />
                                    <small>{i === 0 ? "Foto 1 (Capa)" : `Foto ${i + 1}`}</small>
                                </button>
                            );
                        })}
                    </div>

                    <input
                        ref={inputFoto}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        hidden
                        onChange={adicionarFoto}
                    />
                </div>

                <div className="mk-field">
                    <label className="form-label" htmlFor="inputTitulo">Título do Produto</label>
                    <input
                        id="inputTitulo"
                        type="text"
                        className="form-control"
                        value={form.titulo}
                        onChange={alterar("titulo")}
                    />
                </div>

                <div className="mk-field">
                    <span className="form-label">Categorias Associadas (Selecione ao menos uma - RN03)</span>

                    <div className="mk-chips">
                        {categoriasEscolhidas.map((cat) => (
                            <span key={cat.id} className="mk-chip">
                                {nomeCategoria(cat)}
                                <button
                                    type="button"
                                    aria-label={`Remover ${cat.nome}`}
                                    onClick={() => removerCategoria(cat.id)}
                                >
                                    <CloseIcon sx={{ fontSize: 12 }} />
                                </button>
                            </span>
                        ))}

                        <select
                            className="mk-chips__select"
                            value=""
                            onChange={adicionarCategoria}
                            aria-label="Adicionar outra categoria"
                        >
                            <option value="">+ Adicionar outra categoria...</option>
                            {categoriasRestantes.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {nomeCategoria(cat)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mk-prod-row">
                    <div>
                        <label className="form-label" htmlFor="inputPreco">Preço de Venda (R$)</label>
                        <input
                            id="inputPreco"
                            type="number"
                            step="0.01"
                            className="form-control"
                            value={form.preco}
                            onChange={alterar("preco")}
                        />
                    </div>

                    <div>
                        <label className="form-label" htmlFor="inputCusto">Custo Unitário (R$)</label>
                        <input
                            id="inputCusto"
                            type="number"
                            step="0.01"
                            className="form-control"
                            value={form.custo}
                            onChange={alterar("custo")}
                        />
                    </div>

                    <div>
                        <span className="form-label">Margem Estimada</span>
                        <div className={`mk-margin ${margem === null ? "is-empty" : ""}`}>
                            {margem === null
                                ? "Informe preço e custo"
                                : `Lucro de ${moeda(lucro)} (Margem: ${margem >= 0 ? "+" : ""}${margem.toFixed(1)}%)`}
                        </div>
                    </div>
                </div>

                <div className="mk-prod-row">
                    <div>
                        <label className="form-label" htmlFor="inputEstoque">Quantidade em Estoque</label>
                        <input
                            id="inputEstoque"
                            type="number"
                            className="form-control"
                            value={form.estoque}
                            onChange={alterar("estoque")}
                        />
                    </div>

                    <div>
                        <label className="form-label" htmlFor="selectCondicao">Condição do Produto</label>
                        <select
                            id="selectCondicao"
                            className="form-control"
                            value={form.condicao}
                            onChange={alterar("condicao")}
                        >
                            <option value="NOVO">Novo</option>
                            <option value="USADO">Usado</option>
                        </select>
                    </div>

                    <div>
                        <label className="form-label" htmlFor="inputPrecoPromocional">Preço Promocional (R$)</label>
                        <input
                            id="inputPrecoPromocional"
                            type="number"
                            step="0.01"
                            className="form-control"
                            value={form.precoPromocional}
                            onChange={alterar("precoPromocional")}
                        />
                    </div>
                </div>

                <label className="mk-check">
                    <input type="checkbox" checked={form.freteGratis} onChange={alterar("freteGratis")} />
                    Oferecer Frete Grátis neste produto
                </label>

                <div className="mk-field" style={{ marginTop: 20 }}>
                    <label className="form-label" htmlFor="inputDescricao">
                        Descrição Completa e Especificações Técnicas
                    </label>
                    <textarea
                        id="inputDescricao"
                        className="form-control"
                        rows={6}
                        value={form.descricao}
                        onChange={alterar("descricao")}
                    />
                </div>

                <div className="mk-prod-actions">
                    {idParam ? (
                        <>
                            <button
                                type="button"
                                className="btn btn-warning mk-pill-btn"
                                onClick={() => salvar("ATIVO")}
                                disabled={salvando}
                            >
                                {salvando ? "Salvando..." : "Salvar Alterações"}
                            </button>
                            <button type="button" className="btn btn-outline-secondary mk-pill-btn" onClick={limpar}>
                                Limpar Campos
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                className="btn btn-warning mk-pill-btn"
                                onClick={() => salvar("ATIVO")}
                                disabled={salvando}
                            >
                                {salvando ? "Publicando..." : "Publicar Produto no Catálogo"}
                            </button>
                            <button
                                type="button"
                                className="mk-link-btn"
                                onClick={() => salvar("INATIVO")}
                                disabled={salvando}
                            >
                                Salvar como Rascunho
                            </button>
                        </>
                    )}
                </div>
            </section>
        </>
    );
}