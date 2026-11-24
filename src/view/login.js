import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

import { mensagemErro, mensagemSucesso } from "../components/toastr";
import { listar } from "../utils/api";

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [entrando, setEntrando] = useState(false);

    async function entrar(e) {
        e.preventDefault();
    
        if (!email.trim() || !senha) {
            mensagemErro("Informe o e-mail e a senha.");
            return;
        }
    
        setEntrando(true);
        try {
            const [usuarios, clientes, empresas, administradores] = await Promise.all([
                listar("usuarios"),
                listar("clientes"),
                listar("empresas"),
                listar("administradores"),
            ]);
    
            const usuario = usuarios.find(
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
    
            const doUsuario = (lista) =>
                lista.find((r) => String(r.idUsuario) === String(usuario.id));
    
            const cliente = doUsuario(clientes);
            const empresa = doUsuario(empresas);
            const admin = doUsuario(administradores);
    
            const tipo =
                usuario.tipo ??
                (admin ? "ADMIN" : empresa ? "EMPRESA" : cliente ? "CLIENTE" : null);
    
            localStorage.setItem(
                "sessao",
                JSON.stringify({
                    usuarioId: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    tipo,
                    clienteId: cliente?.id ?? null,
                    empresaId: empresa?.id ?? null,
                })
            );
    
            mensagemSucesso(`Bem-vindo, ${usuario.nome}!`);
            navigate(tipo === "ADMIN" ? "/admin/metricas" : "/");
        } catch (error) {
            mensagemErro(error.response?.data || "Erro ao realizar o login.");
        } finally {
            setEntrando(false);
        }
    }
    return (
        <main className="mk-auth">
            <span className="mk-auth__blob mk-auth__blob--left" aria-hidden="true" />
            <span className="mk-auth__blob mk-auth__blob--right" aria-hidden="true" />

            <section className="mk-auth__card">
                <span className="mk-auth__logo" aria-hidden="true">
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 28 28"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                    >
                        <path d="M8 24 L20 4" />
                        <path d="M13 26 L25 10" />
                    </svg>
                </span>

                <h1>Acesse sua conta</h1>
                <p className="mk-auth__sub">Clientes, Lojistas e Administradores</p>

                <form className="mk-auth__form" onSubmit={entrar} noValidate>
                    <div className="mk-auth__field">
                        <label htmlFor="inputEmail">E-mail</label>
                        <input
                            id="inputEmail"
                            type="email"
                            name="email"
                            placeholder="seuemail@exemplo.com"
                            autoComplete="email"
                            className="mk-auth__input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="mk-auth__field">
                        <label htmlFor="inputSenha">Senha</label>
                        <div className="mk-auth__input-wrap">
                            <input
                                id="inputSenha"
                                type={mostrarSenha ? "text" : "password"}
                                name="senha"
                                placeholder="••••••••"
                                autoComplete="current-password"
                                className="mk-auth__input"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                            />
                            <button
                                type="button"
                                className="mk-auth__eye"
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

                        <button
                            type="button"
                            className="mk-auth__forgot"
                            onClick={() => navigate("/recuperar-senha")}
                        >
                            Esqueceu a senha?
                        </button>
                    </div>

                    <button type="submit" className="mk-auth__submit" disabled={entrando}>
                        {entrando ? "Entrando..." : "Entrar"}
                    </button>
                </form>

                <div className="mk-auth__divider">
                    <span>ou cadastre-se</span>
                </div>

                <button
                    type="button"
                    className="mk-auth__outline"
                    onClick={() => navigate("/cadastro-cliente")}
                >
                    Criar conta como Cliente
                </button>
                <button
                    type="button"
                    className="mk-auth__outline"
                    onClick={() => navigate("/cadastro-empresa")}
                >
                    Quero vender (Conta Empresa)
                </button>
            </section>
        </main>
    );
}

export default Login;