import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import Stack from "@mui/material/Stack";

import Card from "../components/card";
import FormGroup from "../components/form-group";
import { mensagemSucesso, mensagemErro } from "../components/toastr";
import { BASE_URL } from "../config/axios";

const UFS = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
    "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
    "SP", "SE", "TO",
];

function CadastroCliente() {
    const { idParam } = useParams();
    const navigate = useNavigate();
    const baseURL = `${BASE_URL}/clientes`;

    const [nomeCompleto, setNomeCompleto] = useState("");
    const [cpf, setCpf] = useState("");
    const [telefone, setTelefone] = useState("");
    const [cep, setCep] = useState("");
    const [logradouro, setLogradouro] = useState("");
    const [numeroResidencial, setNumeroResidencial] = useState("");
    const [complemento, setComplemento] = useState("");
    const [bairro, setBairro] = useState("");
    const [cidade, setCidade] = useState("");
    const [uf, setUf] = useState("");

    useEffect(() => {
        if (!idParam) return;

        axios
            .get(`${baseURL}/${idParam}`)
            .then((res) => {
                const c = res.data;
                setNomeCompleto(c.nomeCompleto || "");
                setCpf(c.cpf || "");
                setTelefone(c.telefone || "");
                setCep(c.cep || "");
                setLogradouro(c.logradouro || "");
                setNumeroResidencial(c.numeroResidencial || "");
                setComplemento(c.complemento || "");
                setBairro(c.bairro || "");
                setCidade(c.cidade || "");
                setUf(c.uf || "");
            })
            .catch(() => mensagemErro("Erro ao carregar os dados do cliente."));
    }, [idParam, baseURL]);

    function limpar() {
        setNomeCompleto("");
        setCpf("");
        setTelefone("");
        setCep("");
        setLogradouro("");
        setNumeroResidencial("");
        setComplemento("");
        setBairro("");
        setCidade("");
        setUf("");
    }

    function cancelar() {
        navigate("/listagem-clientes");
    }

       async function salvar() {
        if (!nomeCompleto.trim()) {
            mensagemErro("O campo Nome Completo é obrigatório.");
            return;
        }
        if (!cpf.trim()) {
            mensagemErro("O campo CPF é obrigatório.");
            return;
        }

        const data = {
            id: idParam ? Number(idParam) : null,
            nomeCompleto: nomeCompleto.trim(),
            cpf,
            telefone,
            cep,
            logradouro,
            numeroResidencial,
            complemento,
            bairro,
            cidade,
            uf,
            fotoUrl: "",
            status: "ATIVO",
        };

        try {
            let itemSalvo = { ...data };

            if (!idParam) {
                const response = await axios.post(baseURL, data, {
                    headers: { "Content-Type": "application/json" },
                });
                // Se a API retorna o objeto criado com o ID gerado pelo banco, usamos ele
                if (response.data && response.data.id) {
                    itemSalvo = response.data;
                }
                mensagemSucesso(`Cliente "${nomeCompleto}" cadastrado com sucesso!`);
            } else {
                await axios.put(`${baseURL}/${idParam}`, data, {
                    headers: { "Content-Type": "application/json" },
                });
                mensagemSucesso(`Cliente "${nomeCompleto}" alterado com sucesso!`);
            }
            
            // Passa o item salvo e o tipo de operação (cadastro ou edição) para a listagem
            navigate("/listagem-clientes", { 
                state: { 
                    item: itemSalvo, 
                    acao: idParam ? "EDITAR" : "CADASTRAR" 
                } 
            });

        } catch (error) {
            mensagemErro(error.response?.data || "Erro ao salvar o cliente.");
        }
    }
    return (
        <div className="container">
            <Card title={idParam ? "Editar Cliente" : "Cadastro de Cliente"}>
                <div className="row">
                    <div className="col-lg-12">
                        <div className="bs-component">
                            <FormGroup label="Nome Completo: *" htmlFor="inputNomeCompleto">
                                <input
                                    type="text"
                                    id="inputNomeCompleto"
                                    value={nomeCompleto}
                                    className="form-control"
                                    onChange={(e) => setNomeCompleto(e.target.value)}
                                />
                            </FormGroup>

                            <FormGroup label="CPF: *" htmlFor="inputCpf">
                                <input
                                    type="text"
                                    id="inputCpf"
                                    value={cpf}
                                    className="form-control"
                                    onChange={(e) => setCpf(e.target.value)}
                                />
                            </FormGroup>

                            <FormGroup label="Telefone / WhatsApp:" htmlFor="inputTelefone">
                                <input
                                    type="text"
                                    id="inputTelefone"
                                    value={telefone}
                                    className="form-control"
                                    onChange={(e) => setTelefone(e.target.value)}
                                />
                            </FormGroup>

                            <div className="row">
                                <div className="col-md-4">
                                    <FormGroup label="CEP:" htmlFor="inputCep">
                                        <input
                                            type="text"
                                            id="inputCep"
                                            value={cep}
                                            className="form-control"
                                            onChange={(e) => setCep(e.target.value)}
                                        />
                                    </FormGroup>
                                </div>
                                <div className="col-md-8">
                                    <FormGroup label="Logradouro:" htmlFor="inputLogradouro">
                                        <input
                                            type="text"
                                            id="inputLogradouro"
                                            value={logradouro}
                                            className="form-control"
                                            onChange={(e) => setLogradouro(e.target.value)}
                                        />
                                    </FormGroup>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-4">
                                    <FormGroup label="Número:" htmlFor="inputNumero">
                                        <input
                                            type="text"
                                            id="inputNumero"
                                            value={numeroResidencial}
                                            className="form-control"
                                            onChange={(e) => setNumeroResidencial(e.target.value)}
                                        />
                                    </FormGroup>
                                </div>
                                <div className="col-md-4">
                                    <FormGroup label="Complemento:" htmlFor="inputComplemento">
                                        <input
                                            type="text"
                                            id="inputComplemento"
                                            value={complemento}
                                            className="form-control"
                                            onChange={(e) => setComplemento(e.target.value)}
                                        />
                                    </FormGroup>
                                </div>
                                <div className="col-md-4">
                                    <FormGroup label="Bairro:" htmlFor="inputBairro">
                                        <input
                                            type="text"
                                            id="inputBairro"
                                            value={bairro}
                                            className="form-control"
                                            onChange={(e) => setBairro(e.target.value)}
                                        />
                                    </FormGroup>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-8">
                                    <FormGroup label="Cidade:" htmlFor="inputCidade">
                                        <input
                                            type="text"
                                            id="inputCidade"
                                            value={cidade}
                                            className="form-control"
                                            onChange={(e) => setCidade(e.target.value)}
                                        />
                                    </FormGroup>
                                </div>
                                <div className="col-md-4">
                                    <FormGroup label="UF:" htmlFor="selectUf">
                                        <select
                                            id="selectUf"
                                            value={uf}
                                            className="form-control"
                                            onChange={(e) => setUf(e.target.value)}
                                        >
                                            <option value="">Selecione</option>
                                            {UFS.map((sigla) => (
                                                <option key={sigla} value={sigla}>
                                                    {sigla}
                                                </option>
                                            ))}
                                        </select>
                                    </FormGroup>
                                </div>
                            </div>

                            <Stack spacing={1} padding={1} direction="row">
                                <button onClick={salvar} type="button" className="btn btn-warning">
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

export default CadastroCliente;
