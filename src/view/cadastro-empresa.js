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

function CadastroEmpresa() {
    const { idParam } = useParams();
    const navigate = useNavigate();
    const baseURL = `${BASE_URL}/empresas`;

    const [razaoSocial, setRazaoSocial] = useState("");
    const [nomeFantasia, setNomeFantasia] = useState("");
    const [cnpj, setCnpj] = useState("");
    const [inscricaoEstadual, setInscricaoEstadual] = useState("");
    const [inscricaoMunicipal, setInscricaoMunicipal] = useState("");
    const [responsavelLegal, setResponsavelLegal] = useState("");
    const [telefone, setTelefone] = useState("");
    const [cep, setCep] = useState("");
    const [logradouro, setLogradouro] = useState("");
    const [numeroResidencial, setNumeroResidencial] = useState("");
    const [complemento, setComplemento] = useState("");
    const [bairro, setBairro] = useState("");
    const [cidade, setCidade] = useState("");
    const [uf, setUf] = useState("");
    const [descricao, setDescricao] = useState("");

    useEffect(() => {
        if (!idParam) return;

        axios
            .get(`${baseURL}/${idParam}`)
            .then((res) => {
                const e = res.data;
                setRazaoSocial(e.razaoSocial || "");
                setNomeFantasia(e.nomeFantasia || "");
                setCnpj(e.cnpj || "");
                setInscricaoEstadual(e.inscricaoEstadual || "");
                setInscricaoMunicipal(e.inscricaoMunicipal || "");
                setResponsavelLegal(e.responsavelLegal || "");
                setTelefone(e.telefone || "");
                setCep(e.cep || "");
                setLogradouro(e.logradouro || "");
                setNumeroResidencial(e.numeroResidencial || "");
                setComplemento(e.complemento || "");
                setBairro(e.bairro || "");
                setCidade(e.cidade || "");
                setUf(e.uf || "");
                setDescricao(e.descricao || "");
            })
            .catch(() => mensagemErro("Erro ao carregar os dados da empresa."));
    }, [idParam, baseURL]);

    function limpar() {
        setRazaoSocial("");
        setNomeFantasia("");
        setCnpj("");
        setInscricaoEstadual("");
        setInscricaoMunicipal("");
        setResponsavelLegal("");
        setTelefone("");
        setCep("");
        setLogradouro("");
        setNumeroResidencial("");
        setComplemento("");
        setBairro("");
        setCidade("");
        setUf("");
        setDescricao("");
    }

    function cancelar() {
        navigate("/listagem-empresa");
    }

    async function salvar() {
        if (!razaoSocial.trim()) {
            mensagemErro("O campo Razão Social é obrigatório.");
            return;
        }
        if (!nomeFantasia.trim()) {
            mensagemErro("O campo Nome Fantasia é obrigatório.");
            return;
        }
        if (!cnpj.trim()) {
            mensagemErro("O campo CNPJ é obrigatório.");
            return;
        }

        const data = {
            id: idParam ? Number(idParam) : null,
            razaoSocial: razaoSocial.trim(),
            nomeFantasia: nomeFantasia.trim(),
            cnpj,
            inscricaoEstadual,
            inscricaoMunicipal,
            responsavelLegal,
            telefone,
            cep,
            logradouro,
            numeroResidencial,
            complemento,
            bairro,
            cidade,
            uf,
            logoUrl: "",
            descricao,
            status: "ATIVO",
            statusVerificacao: idParam ? undefined : "NAO_VERIFICADA",
        };

        try {
            let itemSalvo = { ...data };

            if (!idParam) {
                const response = await axios.post(baseURL, data, {
                    headers: { "Content-Type": "application/json" },
                });
                // Garante pegar o ID gerado pelo back-end se ele retornar na response
                if (response.data && response.data.id) {
                    itemSalvo = response.data;
                }
                mensagemSucesso(`Empresa "${nomeFantasia}" cadastrada com sucesso!`);
            } else {
                await axios.put(`${baseURL}/${idParam}`, data, {
                    headers: { "Content-Type": "application/json" },
                });
                mensagemSucesso(`Empresa "${nomeFantasia}" alterada com sucesso!`);
            }

            // Redireciona enviando o item atualizado no state da rota
            navigate("/listagem-empresa", {
                state: {
                    item: itemSalvo,
                    acao: idParam ? "EDITAR" : "CADASTRAR"
                }
            });
        } catch (error) {
            mensagemErro(error.response?.data || "Erro ao salvar a empresa.");
        }
    }

    return (
        <div className="container">
            <Card title={idParam ? "Editar Empresa" : "Cadastro de Empresa"}>
                <div className="row">
                    <div className="col-lg-12">
                        <div className="bs-component">
                            <div className="row">
                                <div className="col-md-8">
                                    <FormGroup label="Razão Social: *" htmlFor="inputRazaoSocial">
                                        <input
                                            type="text"
                                            id="inputRazaoSocial"
                                            value={razaoSocial}
                                            className="form-control"
                                            onChange={(e) => setRazaoSocial(e.target.value)}
                                        />
                                    </FormGroup>
                                </div>
                                <div className="col-md-4">
                                    <FormGroup label="Nome Fantasia: *" htmlFor="inputNomeFantasia">
                                        <input
                                            type="text"
                                            id="inputNomeFantasia"
                                            value={nomeFantasia}
                                            className="form-control"
                                            onChange={(e) => setNomeFantasia(e.target.value)}
                                        />
                                    </FormGroup>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-4">
                                    <FormGroup label="CNPJ: *" htmlFor="inputCnpj">
                                        <input
                                            type="text"
                                            id="inputCnpj"
                                            value={cnpj}
                                            className="form-control"
                                            onChange={(e) => setCnpj(e.target.value)}
                                        />
                                    </FormGroup>
                                </div>
                                <div className="col-md-4">
                                    <FormGroup label="Inscrição Estadual:" htmlFor="inputIe">
                                        <input
                                            type="text"
                                            id="inputIe"
                                            value={inscricaoEstadual}
                                            className="form-control"
                                            onChange={(e) => setInscricaoEstadual(e.target.value)}
                                        />
                                    </FormGroup>
                                </div>
                                <div className="col-md-4">
                                    <FormGroup label="Inscrição Municipal:" htmlFor="inputIm">
                                        <input
                                            type="text"
                                            id="inputIm"
                                            value={inscricaoMunicipal}
                                            className="form-control"
                                            onChange={(e) => setInscricaoMunicipal(e.target.value)}
                                        />
                                    </FormGroup>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-6">
                                    <FormGroup label="Responsável Legal:" htmlFor="inputResponsavel">
                                        <input
                                            type="text"
                                            id="inputResponsavel"
                                            value={responsavelLegal}
                                            className="form-control"
                                            onChange={(e) => setResponsavelLegal(e.target.value)}
                                        />
                                    </FormGroup>
                                </div>
                                <div className="col-md-6">
                                    <FormGroup label="Telefone Comercial:" htmlFor="inputTelefone">
                                        <input
                                            type="text"
                                            id="inputTelefone"
                                            value={telefone}
                                            className="form-control"
                                            onChange={(e) => setTelefone(e.target.value)}
                                        />
                                    </FormGroup>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-4">
                                    <FormGroup label="CEP Comercial:" htmlFor="inputCep">
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

                            <FormGroup label="Descrição Institucional (Vitrine):" htmlFor="inputDescricao">
                                <textarea
                                    id="inputDescricao"
                                    value={descricao}
                                    className="form-control"
                                    rows={4}
                                    onChange={(e) => setDescricao(e.target.value)}
                                />
                            </FormGroup>

                            <Stack spacing={1} padding={1} direction="row mt-3">
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

export default CadastroEmpresa;