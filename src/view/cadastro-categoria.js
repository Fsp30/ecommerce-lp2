import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Stack from "@mui/material/Stack";

import Card from "../components/card";
import FormGroup from "../components/form-group";

import { mensagemSucesso, mensagemErro } from "../components/toastr";

import "../custom.css";

import axios from "axios";
import { BASE_URL } from "../config/axios";

// Lê o id do pai aceitando os formatos já vistos no backend.
function idDoPai(categoria) {
  const valor =
    categoria.categoriaPai?.id ??
    categoria.categoriaPai ??
    categoria.categoriaPaiId ??
    categoria.idCategoriaPai;
  if (valor === undefined || valor === null || valor === "") return null;
  return String(valor);
}

// Retorna os ids de uma categoria e de todos os seus descendentes.
function idsDescendentes(categorias, raizId) {
  const resultado = new Set([String(raizId)]);
  let mudou = true;
  while (mudou) {
    mudou = false;
    for (const c of categorias) {
      const pai = idDoPai(c);
      if (pai !== null && resultado.has(pai) && !resultado.has(String(c.id))) {
        resultado.add(String(c.id));
        mudou = true;
      }
    }
  }
  return resultado;
}

function CadastroCategoria() {
  const { idParam } = useParams();
  const navigate = useNavigate();
  const baseURL = `${BASE_URL}/categorias`;

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [idCategoriaPai, setIdCategoriaPai] = useState("");
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState([]);

  useEffect(() => {
    async function carregarDados() {
      try {
        const resListagem = await axios.get(baseURL);
        setCategoriasDisponiveis(resListagem.data || []);

        if (idParam) {
          const resCategoria = await axios.get(`${baseURL}/${idParam}`);
          const categoria = resCategoria.data;

          setNome(categoria.nome || "");
          setDescricao(categoria.descricao || "");
          setIdCategoriaPai(idDoPai(categoria) ?? "");
        }
      } catch (error) {
        mensagemErro(error.response?.data || "Erro ao carregar os dados.");
      }
    }

    carregarDados();
  }, [idParam, baseURL]);

  // Ids que não podem ser escolhidos como pai: a própria categoria e seus descendentes.
  const bloqueados = idParam
    ? idsDescendentes(categoriasDisponiveis, idParam)
    : new Set();

  function limpar() {
    setNome("");
    setDescricao("");
    setIdCategoriaPai("");
  }

  function cancelar() {
    navigate("/listagem-categorias");
  }

  async function salvar() {
    if (!nome.trim()) {
      mensagemErro("O campo Nome é obrigatório.");
      return;
    }

    const data = {
      id: idParam ? Number(idParam) : null,
      nome: nome.trim(),
      descricao,
      idCategoriaPai: idCategoriaPai ? Number(idCategoriaPai) : null,
    };

    try {
      if (!idParam) {
        await axios.post(baseURL, data, {
          headers: { "Content-Type": "application/json" },
        });
        mensagemSucesso(`Categoria "${nome}" cadastrada com sucesso!`);
      } else {
        await axios.put(`${baseURL}/${idParam}`, data, {
          headers: { "Content-Type": "application/json" },
        });
        mensagemSucesso(`Categoria "${nome}" alterada com sucesso!`);
      }
      navigate("/listagem-categorias");
    } catch (error) {
      mensagemErro(error.response?.data || "Erro ao salvar a categoria.");
    }
  }

  return (
    <div className="container">
      <Card title={idParam ? "Editar Categoria" : "Cadastro de Categoria"}>
        <div className="row">
          <div className="col-lg-12">
            <div className="bs-component">
              <FormGroup label="Nome: *" htmlFor="inputNome">
                <input
                  type="text"
                  id="inputNome"
                  value={nome}
                  className="form-control"
                  name="nome"
                  onChange={(e) => setNome(e.target.value)}
                />
              </FormGroup>

              <FormGroup label="Descrição:" htmlFor="inputDescricao">
                <input
                  type="text"
                  id="inputDescricao"
                  value={descricao}
                  className="form-control"
                  name="descricao"
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </FormGroup>

              <FormGroup label="Categoria Pai:" htmlFor="selectCategoriaPai">
                <select
                  id="selectCategoriaPai"
                  value={idCategoriaPai}
                  className="form-control"
                  name="idCategoriaPai"
                  onChange={(e) => setIdCategoriaPai(e.target.value)}
                >
                  <option value="">Nenhuma (Esta será uma categoria principal)</option>
                  {categoriasDisponiveis
                    .filter((cat) => !bloqueados.has(String(cat.id)))
                    .map((cat) => (
                      <option key={cat.id} value={String(cat.id)}>
                        {cat.nome}
                      </option>
                    ))}
                </select>
              </FormGroup>

              <Stack spacing={1} padding={1} direction="row">
                <button onClick={salvar} type="button" className="btn btn-success">
                  Salvar
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

export default CadastroCategoria;