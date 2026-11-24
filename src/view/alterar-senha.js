import React from "react";

import { mensagemSucesso } from "../components/toastr";
import { obterSessao } from "../config/sessao";

function regrasDaSenha(senha, nome) {
    const primeiroNome = String(nome ?? "").trim().split(/\s+/)[0]?.toLowerCase() ?? "";

    return [
        {
            rotulo: "8 a 16 caracteres",
            ok: senha.length >= 8 && senha.length <= 16,
        },
        {
            rotulo: "Maiúscula e Minúscula",
            ok: /[a-z]/.test(senha) && /[A-Z]/.test(senha),
        },
        {
            rotulo: "Número",
            ok: /\d/.test(senha),
        },
        {
            rotulo: "Sem dados pessoais",
            ok: senha.length > 0 && (!primeiroNome || !senha.toLowerCase().includes(primeiroNome)),
        },
    ];
}

export default function AlterarSenha() {
    const { nome } = obterSessao();

    const [atual, setAtual] = React.useState("");
    const [nova, setNova] = React.useState("");
    const [confirmacao, setConfirmacao] = React.useState("");

    const regras = regrasDaSenha(nova, nome);
    const divergem = confirmacao !== "" && nova !== confirmacao;

    function salvar(e) {
        e.preventDefault();
        mensagemSucesso("Senha alterada com sucesso!");
        setAtual("");
        setNova("");
        setConfirmacao("");
    }

    return (
        <div className="mk-senha-page">
            <section className="mk-auth__card">
                <h1>Alterar Senha de Acesso</h1>
                <p className="mk-auth__sub">Atualize sua credencial de segurança</p>

                <form className="mk-auth__form" onSubmit={salvar} noValidate>
                    <div className="mk-auth__field">
                        <label htmlFor="senhaAtual">Senha Atual</label>
                        <input
                            id="senhaAtual"
                            type="password"
                            className="mk-auth__input"
                            value={atual}
                            onChange={(e) => setAtual(e.target.value)}
                        />
                    </div>

                    <div className="mk-auth__row">
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
                    </div>

                    <ul className="mk-auth__rules">
                        {regras.map((r) => (
                            <li key={r.rotulo} className={r.ok ? "is-ok" : ""}>
                                {r.rotulo}
                            </li>
                        ))}
                    </ul>

                    {divergem && <p className="mk-auth__hint is-erro">As senhas não coincidem.</p>}

                    <button type="submit" className="mk-auth__submit">
                        Salvar Nova Senha
                    </button>
                </form>
            </section>
        </div>
    );
}