import React, { useState } from "react";
import axios from "axios";

import Stack from "@mui/material/Stack";

import Card from "../components/card";
import FormGroup from "../components/form-group";
import { mensagemSucesso, mensagemErro } from "../components/toastr";
import { BASE_URL } from "../config/axios";

function FormContato() {
    const baseURL = `${BASE_URL}/contatos`;

    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [assunto, setAssunto] = useState("");
    const [mensagem, setMensagem] = useState("");

    function limpar() {
        setNome("");
        setEmail("");
        setAssunto("");
        setMensagem("");
    }

    async function enviar() {
        if (!nome.trim()) {
            mensagemErro("O campo Nome é obrigatório.");
            return;
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            mensagemErro("Informe um e-mail válido.");
            return;
        }
        if (!mensagem.trim()) {
            mensagemErro("O campo Mensagem é obrigatório.");
            return;
        }

        const data = {
            nome: nome.trim(),
            email: email.trim(),
            assunto: assunto.trim(),
            mensagem: mensagem.trim(),
            dataEnvio: new Date().toISOString(),
        };

        try {
            await axios.post(baseURL, data, {
                headers: { "Content-Type": "application/json" },
            });
            mensagemSucesso("Mensagem enviada com sucesso!");
            limpar();
        } catch (error) {
            mensagemErro(error.response?.data || "Erro ao enviar a mensagem.");
        }
    }

    return (
        <div className="container">
            <Card title="Fale Conosco">
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

                            <FormGroup label="E-mail: *" htmlFor="inputEmail">
                                <input
                                    type="email"
                                    id="inputEmail"
                                    value={email}
                                    className="form-control"
                                    name="email"
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </FormGroup>

                            <FormGroup label="Assunto:" htmlFor="inputAssunto">
                                <input
                                    type="text"
                                    id="inputAssunto"
                                    value={assunto}
                                    className="form-control"
                                    name="assunto"
                                    onChange={(e) => setAssunto(e.target.value)}
                                />
                            </FormGroup>

                            <FormGroup label="Mensagem: *" htmlFor="inputMensagem">
                                <textarea
                                    id="inputMensagem"
                                    rows="5"
                                    value={mensagem}
                                    className="form-control"
                                    name="mensagem"
                                    onChange={(e) => setMensagem(e.target.value)}
                                />
                            </FormGroup>

                            <Stack spacing={1} padding={1} direction="row">
                                <button onClick={enviar} type="button" className="btn btn-warning">
                                    Enviar
                                </button>
                                <button onClick={limpar} type="button" className="btn btn-danger">
                                    Limpar Campos
                                </button>
                            </Stack>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}

export default FormContato;