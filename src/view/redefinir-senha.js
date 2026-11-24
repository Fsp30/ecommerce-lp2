import React from "react";
import { Link, useNavigate } from "react-router-dom";

import { mensagemSucesso } from "../components/toastr";

export default function RedefinirSenha() {
    const navigate = useNavigate();

    const [token, setToken] = React.useState("");
    const [nova, setNova] = React.useState("");
    const [confirmacao, setConfirmacao] = React.useState("");

    const requisitosOk =
        nova.length >= 8 && nova.length <= 16 && /[A-Z]/.test(nova) && /\d/.test(nova);
    const divergem = confirmacao !== "" && nova !== confirmacao;

    function redefinir(e) {
        e.preventDefault();
        mensagemSucesso("Senha redefinida com sucesso!");
        navigate("/login");
    }

    return (
        <main className="mk-auth">
            <span className="mk-auth__blob mk-auth__blob--left" aria-hidden="true" />
            <span className="mk-auth__blob mk-auth__blob--right" aria-hidden="true" />

            <section className="mk-auth__card is-left">
                <span className="mk-auth__badge is-2">Etapa 2</span>
                <h1>Criar Nova Senha</h1>
                <p className="mk-auth__sub">Insira o token recebido por e-mail e sua nova senha.</p>

                <form className="mk-auth__form" onSubmit={redefinir} noValidate>
                    <div className="mk-auth__field">
                        <label htmlFor="token">Código / Token de Validação</label>
                        <input
                            id="token"
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            className="mk-auth__input mk-auth__token"
                            value={token}
                            onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
                        />
                    </div>

                    <div className="mk-auth__field">
                        <label htmlFor="novaSenha">Nova Senha</label>
                        <input
                            id="novaSenha"
                            type="password"
                            className="mk-auth__input"
                            value={nova}
                            onChange={(e) => setNova(e.target.value)}
                        />
                    </div>

                    <div className="mk-auth__field">
                        <label htmlFor="confirmarSenha">Confirmar Nova Senha</label>
                        <input
                            id="confirmarSenha"
                            type="password"
                            className="mk-auth__input"
                            value={confirmacao}
                            onChange={(e) => setConfirmacao(e.target.value)}
                        />
                    </div>

                    <p className={`mk-auth__hint ${requisitosOk ? "is-ok" : ""}`}>
                        {requisitosOk ? "✓ " : ""}8-16 dígitos com maiúscula e número
                    </p>

                    {divergem && <p className="mk-auth__hint is-erro">As senhas não coincidem.</p>}

                    <button type="submit" className="mk-auth__submit">
                        Redefinir Senha e Entrar
                    </button>
                </form>

                <p className="mk-auth__back">
                    Lembrou da senha? <Link to="/login">Voltar ao Login</Link>
                </p>
            </section>
        </main>
    );
}