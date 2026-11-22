import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Stack from "@mui/material/Stack";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

import Card from "../components/card";
import FormGroup from "../components/form-group";
import { mensagemSucesso, mensagemErro } from "../components/toastr";
import { BASE_URL } from "../config/axios";

function Login() {
    const navigate = useNavigate();
    const baseURL = `${BASE_URL}/usuarios`;

    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [mostrarSenha, setMostrarSenha] = useState(false);

    function limpar() {
        setEmail("");
        setSenha("");
    }

    async function entrar() {
        if (!email.trim() || !senha) {
            mensagemErro("Informe o e-mail e a senha.");
            return;
        }

        try {
            const resposta = await axios.get(baseURL);
            const usuario = (resposta.data || []).find(
                (u) =>
                    u.email?.toLowerCase() === email.trim().toLowerCase() &&
                    (u.senha ?? u.senhaHash) === senha
            );

            if (!usuario) {
                mensagemErro("E-mail ou senha inválidos.");
                return;
            }

            if (usuario.status === "SUSPENSO") {
                mensagemErro("Conta suspensa. Entre em contato com o suporte.");
                return;
            }

            localStorage.setItem(
                "sessao",
                JSON.stringify({
                    usuarioId: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    tipo: usuario.tipo,
                    clienteId: usuario.clienteId,
                    empresaId: usuario.empresaId,
                })
            );

            mensagemSucesso(`Bem-vindo, ${usuario.nome}!`);
            navigate("/");
        } catch (error) {
            mensagemErro(error.response?.data || "Erro ao realizar o login.");
        }
    }

    return (
        <div className="container">
            <Card title="Acesse sua conta">
                <div className="row">
                    <div className="col-lg-12">
                        <div className="bs-component">
                            <FormGroup label="E-mail: *" htmlFor="inputEmail">
                                <input
                                    type="email"
                                    id="inputEmail"
                                    placeholder="usuario@exemplo.com"
                                    value={email}
                                    className="form-control"
                                    name="email"
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </FormGroup>

                            <FormGroup label="Senha: *" htmlFor="inputSenha">
                                <div className="input-group">
                                    <input
                                        type={mostrarSenha ? "text" : "password"}
                                        id="inputSenha"
                                        value={senha}
                                        className="form-control"
                                        name="senha"
                                        onChange={(e) => setSenha(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && entrar()}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                                        onClick={() => setMostrarSenha((v) => !v)}
                                    >
                                        {mostrarSenha ? (
                                            <VisibilityOffOutlinedIcon fontSize="small" />
                                        ) : (
                                            <VisibilityOutlinedIcon fontSize="small" />
                                        )}
                                    </button>
                                </div>
                            </FormGroup>

                            <Stack spacing={1} padding={1} direction="row">
                                <button onClick={entrar} type="button" className="btn btn-warning">
                                    Entrar
                                </button>
                                <button onClick={limpar} type="button" className="btn btn-danger">
                                    Cancelar
                                </button>
                            </Stack>

                            <Stack spacing={1} padding={1} direction="row">
                                <button
                                    onClick={() => navigate("/cadastro-cliente")}
                                    type="button"
                                    className="btn btn-secondary"
                                >
                                    Criar conta como Cliente
                                </button>
                                <button
                                    onClick={() => navigate("/cadastro-empresa")}
                                    type="button"
                                    className="btn btn-secondary"
                                >
                                    Quero vender (Conta Empresa)
                                </button>
                            </Stack>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}

export default Login;