import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import Stack from "@mui/material/Stack";

import Card from "../components/card";
import FormGroup from "../components/form-group";
import { mensagemSucesso, mensagemErro } from "../components/toastr";
import { obterSessao } from "../config/sessao";
import { BASE_URL } from "../config/axios";

function CadastroProduto() {
    const { idParam } = useParams();
    const navigate = useNavigate();
    const baseURL = `${BASE_URL}/produtos`;
    const { empresaId } = obterSessao();

    const [titulo, setTitulo] = useState("");
    const [descricao, setDescricao] = useState("");
    const [preco, setPreco] = useState("");
    const [precoPromocional, setPrecoPromocional] = useState("");
    const [custo, setCusto] = useState("");
    const [estoqueQuantidade, setEstoqueQuantidade] = useState("");
    const [condicao, setCondicao] = useState("NOVO");
    const [freteGratis, setFreteGratis] = useState(false);
    const [categoriasDisponiveis, setCategoriasDisponiveis] = useState([]);
    const [categoriasSelecionadas, setCategoriasSelecionadas] = useState([]);

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
                setTitulo(p.titulo || "");
                setDescricao(p.descricao || "");
                setPreco(p.preco ?? "");
                setPrecoPromocional(p.precoPromocional ?? "");
                setCusto(p.custo ?? "");
                setEstoqueQuantidade(p.estoqueQuantidade ?? "");
                setCondicao(p.condicao || "NOVO");
                setFreteGratis(Boolean(p.freteGratis));
                setCategoriasSelecionadas(
                    Array.isArray(p.categorias)
                        ? p.categorias.map((c) => (typeof c === "object" ? c.id : c))
                        : []
                );
            })
            .catch(() => mensagemErro("Erro ao carregar os dados do produto."));
    }, [idParam, baseURL]);

    function alternarCategoria(id) {
        setCategoriasSelecionadas((atual) =>
            atual.includes(id) ? atual.filter((c) => c !== id) : [...atual, id]
        );
    }

    function limpar() {
        setTitulo("");
        setDescricao("");
        setPreco("");
        setPrecoPromocional("");
        setCusto("");
        setEstoqueQuantidade("");
        setCondicao("NOVO");
        setFreteGratis(false);
        setCategoriasSelecionadas([]);
    }

    function cancelar() {
        navigate("/listagem-produtos");
    }

    async function salvar() {
        if (!titulo.trim()) {
            mensagemErro("O campo Título é obrigatório.");
            return;
        }
        if (!preco) {
            mensagemErro("O campo Preço de Venda é obrigatório.");
            return;
        }
        if (categoriasSelecionadas.length === 0) {
            mensagemErro("Selecione ao menos uma categoria.");
            return;
        }

        const data = {
            id: idParam ? Number(idParam) : null,
            empresa: empresaId ? Number(empresaId) : null,
            titulo: titulo.trim(),
            descricao,
            preco: Number(preco),
            precoPromocional: precoPromocional ? Number(precoPromocional) : null,
            dataPromocaoInicio: null,
            dataPromocaoFim: null,
            custo: custo ? Number(custo) : 0,
            estoqueQuantidade: Number(estoqueQuantidade) || 0,
            estoqueReservado: 0,
            condicao,
            freteGratis,
            status: "ATIVO",
            fotos: [""],
            categorias: categoriasSelecionadas,
            notaMedia: idParam ? undefined : 0,
            percentualRecomendacao: idParam ? undefined : 0,
            dataCadastro: idParam ? undefined : new Date().toISOString().slice(0, 10),
        };

        try {
            if (!idParam) {
                await axios.post(baseURL, data, {
                    headers: { "Content-Type": "application/json" },
                });
                mensagemSucesso(`Produto "${titulo}" cadastrado com sucesso!`);
            } else {
                await axios.put(`${baseURL}/${idParam}`, data, {
                    headers: { "Content-Type": "application/json" },
                });
                mensagemSucesso(`Produto "${titulo}" alterado com sucesso!`);
            }
            navigate("/listagem-produtos");
        } catch (error) {
            mensagemErro(error.response?.data || "Erro ao salvar o produto.");
        }
    }

    const lucro = preco && custo ? Number(preco) - Number(custo) : null;
    const margem = lucro !== null && Number(custo) > 0 ? (lucro / Number(custo)) * 100 : null;

    return (
        <div className="container">
            <Card title={idParam ? "Editar Produto" : "Cadastrar Novo Produto"}>
                <div className="row">
                    <div className="col-lg-12">
                        <div className="bs-component">
                            <FormGroup label="Título do Produto: *" htmlFor="inputTitulo">
                                <input
                                    type="text"
                                    id="inputTitulo"
                                    value={titulo}
                                    className="form-control"
                                    onChange={(e) => setTitulo(e.target.value)}
                                />
                            </FormGroup>

                            <FormGroup label="Categorias Associadas: *" htmlFor="categorias">
                                <div id="categorias" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                    {categoriasDisponiveis.map((cat) => (
                                        <label
                                            key={cat.id}
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: 4,
                                                border: "1px solid var(--line)",
                                                borderRadius: 999,
                                                padding: "4px 10px",
                                                fontSize: "0.78rem",
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={categoriasSelecionadas.includes(cat.id)}
                                                onChange={() => alternarCategoria(cat.id)}
                                            />
                                            {cat.nome}
                                        </label>
                                    ))}
                                </div>
                            </FormGroup>

                            <div className="row">
                                <div className="col-md-6">
                                    <FormGroup label="Preço de Venda (R$): *" htmlFor="inputPreco">
                                        <input
                                            type="number"
                                            step="0.01"
                                            id="inputPreco"
                                            value={preco}
                                            className="form-control"
                                            onChange={(e) => setPreco(e.target.value)}
                                        />
                                    </FormGroup>
                                </div>
                                <div className="col-md-6">
                                    <FormGroup label="Custo Unitário (R$):" htmlFor="inputCusto">
                                        <input
                                            type="number"
                                            step="0.01"
                                            id="inputCusto"
                                            value={custo}
                                            className="form-control"
                                            onChange={(e) => setCusto(e.target.value)}
                                        />
                                    </FormGroup>
                                </div>
                            </div>

                            {margem !== null && (
                                <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: -8 }}>
                                    Margem Estimada: lucro de{" "}
                                    {lucro.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}{" "}
                                    (+{margem.toFixed(1)}%)
                                </p>
                            )}

                            <FormGroup label="Preço Promocional (R$):" htmlFor="inputPrecoPromocional">
                                <input
                                    type="number"
                                    step="0.01"
                                    id="inputPrecoPromocional"
                                    value={precoPromocional}
                                    className="form-control"
                                    onChange={(e) => setPrecoPromocional(e.target.value)}
                                />
                            </FormGroup>

                            <div className="row">
                                <div className="col-md-6">
                                    <FormGroup label="Quantidade em Estoque:" htmlFor="inputEstoque">
                                        <input
                                            type="number"
                                            id="inputEstoque"
                                            value={estoqueQuantidade}
                                            className="form-control"
                                            onChange={(e) => setEstoqueQuantidade(e.target.value)}
                                        />
                                    </FormGroup>
                                </div>
                                <div className="col-md-6">
                                    <FormGroup label="Condição do Produto:" htmlFor="selectCondicao">
                                        <select
                                            id="selectCondicao"
                                            value={condicao}
                                            className="form-control"
                                            onChange={(e) => setCondicao(e.target.value)}
                                        >
                                            <option value="NOVO">Novo</option>
                                            <option value="USADO">Usado</option>
                                        </select>
                                    </FormGroup>
                                </div>
                            </div>

                            <FormGroup label="Descrição Completa e Especificações Técnicas:" htmlFor="inputDescricao">
                                <textarea
                                    id="inputDescricao"
                                    value={descricao}
                                    className="form-control"
                                    rows={4}
                                    onChange={(e) => setDescricao(e.target.value)}
                                />
                            </FormGroup>

                            <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                <input
                                    type="checkbox"
                                    checked={freteGratis}
                                    onChange={(e) => setFreteGratis(e.target.checked)}
                                />
                                Oferecer Frete Grátis neste produto
                            </label>

                            <Stack spacing={1} padding={1} direction="row">
                                <button onClick={salvar} type="button" className="btn btn-warning">
                                    {idParam ? "Salvar" : "Publicar Produto no Catálogo"}
                                </button>
                                <button
                                    onClick={idParam ? limpar : cancelar}
                                    type="button"
                                    className="btn btn-danger"
                                >
                                    {idParam ? "Limpar Campos" : "Cancelar"}
                                </button>
                            </Stack>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}

export default CadastroProduto;