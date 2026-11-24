import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";

import { mensagemErro, mensagemSucesso } from "../components/toastr";
import { BASE_URL } from "../config/axios";
import { UFS } from "../utils/endereco";
import { lerImagem } from "../utils/imagem";
import { hoje } from "../utils/formatar";
import { regrasSenha, senhaValida, termosDe } from "../utils/senha";

const CABECALHO = { headers: { "Content-Type": "application/json" } };
const EMAIL_VALIDO = /^\S+@\S+\.\S+$/;

const VAZIO = {
    nomeCompleto: "",
    cpf: "",
    telefone: "",
    cep: "",
    logradouro: "",
    numeroResidencial: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    fotoUrl: "",
    email: "",
    senha: "",
    confirmacao: "",
};

function Campo({ id, label, className, children }) {
    return (
        <div className={`mk-cad__field ${className}`}>
            <label htmlFor={id}>{label}</label>
            {children}
        </div>
    );
}

export default function CadastroCliente() {
    const { idParam } = useParams();
    const navigate = useNavigate();
    const editando = Boolean(idParam);
    const inputFoto = useRef(null);

    const [form, setForm] = useState(VAZIO);
    const [aceite, setAceite] = useState(false);

    useEffect(() => {
        if (!idParam) return;

        axios
            .get(`${BASE_URL}/clientes/${idParam}`)
            .then((res) => {
                const c = res.data;
                setForm((f) => ({
                    ...f,
                    nomeCompleto: c.nomeCompleto || "",
                    cpf: c.cpf || "",
                    telefone: c.telefone || "",
                    cep: c.cep || "",
                    logradouro: c.logradouro || "",
                    numeroResidencial: c.numeroResidencial || "",
                    complemento: c.complemento || "",
                    bairro: c.bairro || "",
                    cidade: c.cidade || "",
                    uf: c.uf || "",
                    fotoUrl: c.fotoUrl || "",
                }));
            })
            .catch(() => mensagemErro("Erro ao carregar os dados do cliente."));
    }, [idParam]);

    const alterar = (campo) => (e) => {
        const valor = e.target.value;
        setForm((f) => ({ ...f, [campo]: valor }));
    };

    async function escolherFoto(e) {
        const arquivo = e.target.files?.[0];
        e.target.value = "";
        if (!arquivo) return;

        try {
            const fotoUrl = await lerImagem(arquivo);
            setForm((f) => ({ ...f, fotoUrl }));
        } catch (erro) {
            mensagemErro(erro.message);
        }
    }

    const termos = termosDe(form.nomeCompleto, form.email.split("@")[0]);
    const regras = regrasSenha(form.senha, termos);
    const divergem = form.confirmacao !== "" && form.senha !== form.confirmacao;

    async function salvar(e) {
        e.preventDefault();

        const nome = form.nomeCompleto.trim();
        if (!nome) return mensagemErro("O campo Nome Completo é obrigatório.");
        if (!form.cpf.trim()) return mensagemErro("O campo CPF é obrigatório.");

        if (!editando) {
            if (!EMAIL_VALIDO.test(form.email))
                return mensagemErro("Informe um e-mail válido.");
            if (!senhaValida(form.senha, termos))
                return mensagemErro("A senha não atende aos requisitos.");
            if (form.senha !== form.confirmacao)
                return mensagemErro("As senhas não coincidem.");
            if (!aceite)
                return mensagemErro("Aceite os termos de uso para continuar.");
        }

        const dadosCliente = {
            id: editando ? Number(idParam) : null,
            nomeCompleto: nome,
            cpf: form.cpf,
            telefone: form.telefone,
            cep: form.cep,
            logradouro: form.logradouro,
            numeroResidencial: form.numeroResidencial,
            complemento: form.complemento,
            bairro: form.bairro,
            cidade: form.cidade,
            uf: form.uf,
            fotoUrl: form.fotoUrl,
            status: "ATIVO",
        };

        try {
            let itemSalvo = { ...dadosCliente };

            if (!editando) {
                const resUsuario = await axios.post(
                    `${BASE_URL}/usuarios`,
                    {
                        nome,
                        email: form.email.trim(),
                        senhaHash: form.senha,
                        dataCadastro: hoje(),
                    },
                    CABECALHO,
                );
                const idUsuario = resUsuario.data?.id;

                const resCliente = await axios.post(
                    `${BASE_URL}/clientes`,
                    { ...dadosCliente, idUsuario },
                    CABECALHO,
                );
                itemSalvo = resCliente.data?.id
                    ? resCliente.data
                    : { ...dadosCliente, idUsuario };
                mensagemSucesso(
                    `Conta criada com sucesso! Bem-vindo, ${nome}.`,
                );
            } else {
                await axios.put(
                    `${BASE_URL}/clientes/${idParam}`,
                    dadosCliente,
                    CABECALHO,
                );
                mensagemSucesso(`Cliente "${nome}" alterado com sucesso!`);
            }

            navigate(editando ? "/listagem-clientes" : "/login", {
                state: editando
                    ? { item: itemSalvo, acao: "EDITAR" }
                    : undefined,
            });
        } catch (erro) {
            mensagemErro(erro.response?.data || "Erro ao salvar o cadastro.");
        }
    }

    const campo = (
        id,
        label,
        chave,
        { classe = "c-6", placeholder = "", type = "text" } = {},
    ) => (
        <Campo id={id} label={label} className={classe}>
            <input
                id={id}
                type={type}
                className="mk-auth__input"
                placeholder={placeholder}
                value={form[chave]}
                onChange={alterar(chave)}
            />
        </Campo>
    );

    return (
        <main className="mk-auth mk-cad-page">
            <span
                className="mk-auth__blob mk-auth__blob--left"
                aria-hidden="true"
            />
            <span
                className="mk-auth__blob mk-auth__blob--right"
                aria-hidden="true"
            />

            <section className="mk-cad__card">
                <header className="mk-cad__head">
                    <h1>
                        {editando ? "Editar Cliente" : "Criar Conta de Cliente"}
                    </h1>
                    <p>
                        {editando
                            ? "Atualize os dados cadastrais do cliente"
                            : "Preencha seus dados para começar a comprar"}
                    </p>
                </header>

                <form className="mk-cad__form" onSubmit={salvar} noValidate>
                    <div className="mk-cad__photo">
                        <button
                            type="button"
                            className="mk-cad__photo-circle"
                            aria-label="Enviar foto"
                            onClick={() => inputFoto.current?.click()}
                        >
                            {form.fotoUrl ? (
                                <img src={form.fotoUrl} alt="Foto do cliente" />
                            ) : (
                                <PersonOutlinedIcon sx={{ fontSize: 34 }} />
                            )}
                        </button>
                        <input
                            ref={inputFoto}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            hidden
                            onChange={escolherFoto}
                        />
                        <small>
                            + Enviar foto (JPG, PNG ou WebP - máx 5MB)
                        </small>
                    </div>

                    <div className="mk-cad__grid">
                        {campo("nome", "Nome Completo", "nomeCompleto", {
                            classe: "c-12",
                            placeholder: "Ex: João da Silva",
                        })}

                        {campo("cpf", "CPF", "cpf", {
                            placeholder: "xxx.xxx.xxx-xx",
                        })}
                        {campo("telefone", "Telefone / WhatsApp", "telefone", {
                            placeholder: "(xx) 9xxxx-xxxx",
                        })}

                        {campo("cep", "CEP", "cep", {
                            classe: "c-4",
                            placeholder: "00000-000",
                        })}
                        {campo(
                            "logradouro",
                            "Logradouro (Rua/Avenida)",
                            "logradouro",
                            {
                                classe: "c-8",
                                placeholder: "Rua das Flores",
                            },
                        )}

                        {campo("numero", "Número", "numeroResidencial", {
                            classe: "c-3",
                            placeholder: "123",
                        })}
                        {campo("complemento", "Complemento", "complemento", {
                            classe: "c-4",
                            placeholder: "Apto 402",
                        })}
                        {campo("bairro", "Bairro", "bairro", {
                            classe: "c-5",
                            placeholder: "Jardim Paulista",
                        })}

                        {campo("cidade", "Cidade", "cidade", {
                            classe: "c-9",
                            placeholder: "Uberaba",
                        })}
                        <Campo id="uf" label="UF" className="c-3">
                            <select
                                id="uf"
                                className="mk-auth__input"
                                value={form.uf}
                                onChange={alterar("uf")}
                            >
                                <option value="">Selecione</option>
                                {UFS.map((sigla) => (
                                    <option key={sigla} value={sigla}>
                                        {sigla}
                                    </option>
                                ))}
                            </select>
                        </Campo>

                        {!editando && (
                            <>
                                {campo("email", "E-mail", "email", {
                                    classe: "c-12",
                                    placeholder: "xxxxxx@exemplo.com",
                                    type: "email",
                                })}

                                {campo("senha", "Senha", "senha", {
                                    type: "password",
                                })}
                                {campo(
                                    "confirmacao",
                                    "Confirmar Senha",
                                    "confirmacao",
                                    {
                                        type: "password",
                                    },
                                )}

                                <ul className="mk-cad__rules c-12">
                                    {regras.map((r) => (
                                        <li
                                            key={r.rotulo}
                                            className={r.ok ? "is-ok" : ""}
                                        >
                                            <span>{r.ok ? "✓" : ""}</span>
                                            {r.rotulo}
                                        </li>
                                    ))}
                                </ul>

                                {divergem && (
                                    <p className="mk-cad__erro c-12">
                                        As senhas não coincidem.
                                    </p>
                                )}
                            </>
                        )}
                    </div>

                    {!editando && (
                        <label className="mk-cad__terms">
                            <input
                                type="checkbox"
                                checked={aceite}
                                onChange={(e) => setAceite(e.target.checked)}
                            />
                            Aceitar os <a href="/contato">termos de uso</a>.
                        </label>
                    )}

                    <div className="mk-cad__actions">
                        <button type="submit" className="mk-auth__submit">
                            {editando
                                ? "Salvar Alterações"
                                : "Criar Minha Conta"}
                        </button>
                    </div>

                    {editando ? (
                        <p className="mk-cad__foot">
                            <button
                                type="button"
                                className="mk-cad__cancel"
                                onClick={() => navigate("/listagem-clientes")}
                            >
                                Cancelar
                            </button>
                        </p>
                    ) : (
                        <p className="mk-cad__foot">
                            Já possui uma conta?{" "}
                            <Link to="/login">Fazer login</Link>
                        </p>
                    )}
                </form>
            </section>
        </main>
    );
}
