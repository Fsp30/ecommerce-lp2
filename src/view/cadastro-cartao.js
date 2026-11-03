import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Stack from "@mui/material/Stack";

import Card from "../components/card";
import FormGroup from "../components/form-group";
import { mensagemSucesso, mensagemErro } from "../components/toastr";
import { obterSessao } from "../config/sessao";
import { BASE_URL } from "../config/axios";

// Algoritmo de Luhn (RN06)
function validoPorLuhn(numero) {
    const digitos = numero.replace(/\D/g, "");
    if (digitos.length < 13) return false;

    let soma = 0;
    let dobrar = false;

    for (let i = digitos.length - 1; i >= 0; i--) {
        let d = Number(digitos[i]);
        if (dobrar) {
            d *= 2;
            if (d > 9) d -= 9;
        }
        soma += d;
        dobrar = !dobrar;
    }

    return soma % 10 === 0;
}

const BANDEIRAS = ["VISA", "MASTERCARD", "ELO", "AMEX", "HIPERCARD"];

function CadastroCartao() {
    const navigate = useNavigate();
    const baseURL = `${BASE_URL}/cartoes`;
    const { clienteId } = obterSessao();

    const [numeroCartao, setNumeroCartao] = useState("");
    const [bandeira, setBandeira] = useState("VISA");
    const [validadeMes, setValidadeMes] = useState("");
    const [validadeAno, setValidadeAno] = useState("");
    const [cvv, setCvv] = useState("");
    const [apelido, setApelido] = useState("");
    const [nomeTitular, setNomeTitular] = useState("");

    const numeroLimpo = numeroCartao.replace(/\D/g, "");
    const numeroValido = numeroLimpo.length >= 13 && validoPorLuhn(numeroLimpo);

    function limpar() {
        setNumeroCartao("");
        setBandeira("VISA");
        setValidadeMes("");
        setValidadeAno("");
        setCvv("");
        setApelido("");
        setNomeTitular("");
    }

    // function cancelar() {
    //     navigate("/listagem-cartoes");
    // }

    async function salvar() {
        if (!numeroValido) {
            mensagemErro("Número do cartão inválido.");
            return;
        }
        if (!validadeMes || !validadeAno) {
            mensagemErro("Informe o mês e o ano de validade.");
            return;
        }
        if (!cvv.trim()) {
            mensagemErro("O campo CVV é obrigatório.");
            return;
        }
        if (!nomeTitular.trim()) {
            mensagemErro("O campo Nome Gravado no Cartão é obrigatório.");
            return;
        }

        const primeiros4 = numeroLimpo.slice(0, 4);
        const ultimos4 = numeroLimpo.slice(-4);

        const data = {
            idCliente: clienteId ? Number(clienteId) : null,
            numeroHash: `hash_${primeiros4}********${ultimos4}`,
            paymentToken: `tok_${Math.random().toString(36).slice(2, 10)}`,
            bandeira,
            nomeTitular: nomeTitular.trim().toUpperCase(),
            validadeMes: Number(validadeMes),
            validadeAno: Number(validadeAno),
            apelido: apelido.trim(),
            status: "ATIVO",
        };

        try {
            await axios.post(baseURL, data, {
                headers: { "Content-Type": "application/json" },
            });
            mensagemSucesso("Cartão cadastrado com sucesso!");
            navigate("/listagem-cartoes");
        } catch (error) {
            mensagemErro(error.response?.data || "Erro ao salvar o cartão.");
        }
    }

    return (
        <div className="container">
            <Card title="Cadastrar Novo Cartão">
                <div className="row">
                    <div className="col-lg-12">
                        <div className="bs-component">
                            <FormGroup label="Número do Cartão: *" htmlFor="inputNumero">
                                <input
                                    type="text"
                                    id="inputNumero"
                                    placeholder="xxxx xxxx xxxx xxxx"
                                    value={numeroCartao}
                                    className="form-control"
                                    onChange={(e) => setNumeroCartao(e.target.value)}
                                />
                                {numeroLimpo.length >= 13 && (
                                    <small style={{ color: numeroValido ? "var(--success)" : "var(--danger)" }}>
                                        {numeroValido ? "✓ Válido" : "Número inválido"}
                                    </small>
                                )}
                            </FormGroup>

                            <FormGroup label="Bandeira:" htmlFor="selectBandeira">
                                <select
                                    id="selectBandeira"
                                    value={bandeira}
                                    className="form-control"
                                    onChange={(e) => setBandeira(e.target.value)}
                                >
                                    {BANDEIRAS.map((b) => (
                                        <option key={b} value={b}>
                                            {b}
                                        </option>
                                    ))}
                                </select>
                            </FormGroup>

                            <div className="row">
                                <div className="col-md-3">
                                    <FormGroup label="Mês:" htmlFor="inputMes">
                                        <input
                                            type="number"
                                            min="1"
                                            max="12"
                                            id="inputMes"
                                            value={validadeMes}
                                            className="form-control"
                                            onChange={(e) => setValidadeMes(e.target.value)}
                                        />
                                    </FormGroup>
                                </div>
                                <div className="col-md-3">
                                    <FormGroup label="Ano:" htmlFor="inputAno">
                                        <input
                                            type="number"
                                            min={new Date().getFullYear()}
                                            id="inputAno"
                                            value={validadeAno}
                                            className="form-control"
                                            onChange={(e) => setValidadeAno(e.target.value)}
                                        />
                                    </FormGroup>
                                </div>
                                <div className="col-md-3">
                                    <FormGroup label="CVV: *" htmlFor="inputCvv">
                                        <input
                                            type="password"
                                            maxLength={4}
                                            id="inputCvv"
                                            value={cvv}
                                            className="form-control"
                                            onChange={(e) => setCvv(e.target.value)}
                                        />
                                    </FormGroup>
                                </div>
                                <div className="col-md-3">
                                    <FormGroup label="Apelido:" htmlFor="inputApelido">
                                        <input
                                            type="text"
                                            placeholder="Ex: Cartão Principal"
                                            id="inputApelido"
                                            value={apelido}
                                            className="form-control"
                                            onChange={(e) => setApelido(e.target.value)}
                                        />
                                    </FormGroup>
                                </div>
                            </div>

                            <FormGroup label="Nome Gravado no Cartão: *" htmlFor="inputNomeTitular">
                                <input
                                    type="text"
                                    id="inputNomeTitular"
                                    value={nomeTitular}
                                    className="form-control"
                                    onChange={(e) => setNomeTitular(e.target.value)}
                                />
                            </FormGroup>

                            <Stack spacing={1} padding={1} direction="row">
                                <button onClick={salvar} type="button" className="btn btn-warning">
                                    Salvar Cartão
                                </button>
                                <button onClick={limpar} type="button" className="btn btn-danger">
                                    Cancelar
                                </button>
                            </Stack>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}

export default CadastroCartao;