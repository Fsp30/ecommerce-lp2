import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function RecuperarSenha() {
    const navigate = useNavigate();
    const [email, setEmail] = React.useState("");

    function enviar(e) {
        e.preventDefault();
        navigate("/redefinir-senha", { state: { email } });
    }

    return (
        <main className="mk-auth">
            <span className="mk-auth__blob mk-auth__blob--left" aria-hidden="true" />
            <span className="mk-auth__blob mk-auth__blob--right" aria-hidden="true" />

            <section className="mk-auth__card is-left">
                <span className="mk-auth__badge">Etapa 1</span>
                <h1>Recuperar Senha</h1>
                <p className="mk-auth__sub">Informe seu e-mail para enviarmos um token.</p>

                <form className="mk-auth__form" onSubmit={enviar} noValidate>
                    <div className="mk-auth__field">
                        <label htmlFor="emailRecuperacao">E-mail Cadastrado</label>
                        <input
                            id="emailRecuperacao"
                            type="email"
                            className="mk-auth__input"
                            placeholder="seuemail@exemplo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="mk-auth__submit">
                        Enviar Código de Acesso
                    </button>
                </form>

                <p className="mk-auth__back">
                    Lembrou da senha? <Link to="/login">Voltar ao Login</Link>
                </p>
            </section>
        </main>
    );
}