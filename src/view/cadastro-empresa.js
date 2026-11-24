import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";

import { mensagemErro, mensagemSucesso } from "../components/toastr";
import { BASE_URL } from "../config/axios";
import { UFS } from "../utils/endereco";
import { lerImagem } from "../utils/imagem";
import { hoje } from "../utils/formatar";
import { regrasSenha, senhaValida, termosDe } from "../utils/senha";

const CABECALHO = { headers: { "Content-Type": "application/json" } };
const EMAIL_VALIDO = /^\S+@\S+\.\S+$/;

const VAZIO = {
    razaoSocial: "",
    nomeFantasia: "",
    cnpj: "",
    inscricaoEstadual: "",
    inscricaoMunicipal: "",
    responsavelLegal: "",
    telefone: "",
    cep: "",
    logradouro: "",
    numeroResidencial: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    descricao: "",
    logoUrl: "",
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

export default function CadastroEmpresa() {
    const { idParam } = useParams();
    const navigate = useNavigate();
    const editando = Boolean(idParam);
    const inputLogo = useRef(null);

    const [form, setForm] = useState(VAZIO);
    const [aceite, setAceite] = useState(false);

    useEffect(() => {
        if (!idParam) return;

        axios
            .get(`${BASE_URL}/empresas/${idParam}`)
            .then((res) => {
                const e = res.data;
                setForm((f) => ({
                    ...f,
                    razaoSocial: e.razaoSocial || "",
                    nomeFantasia: e.nomeFantasia || "",
                    cnpj: e.cnpj || "",
                    inscricaoEstadual: e.inscricaoEstadual || "",
                    inscricaoMunicipal: e.inscricaoMunicipal || "",
                    responsavelLegal: e.responsavelLegal || "",
                    telefone: e.telefone || "",
                    cep: e.cep || "",
                    logradouro: e.logradouro || "",
                    numeroResidencial: e.numeroResidencial || "",
                    complemento: e.complemento || "",
                    bairro: e.bairro || "",
                    cidade: e.cidade || "",
                    uf: e.uf || "",
                    descricao: e.descricao || "",
                    logoUrl: e.logoUrl || "",
                }));
            })
            .catch(() => mensagemErro("Erro ao carregar os dados da empresa."));
    }, [idParam]);

    const alterar = (campo) => (e) => {
        const valor = e.target.value;
        setForm((f) => ({ ...f, [campo]: valor }));
    };

    async function escolherLogo(e) {
        const arquivo = e.target.files?.[0];
        e.target.value = "";
        if (!arquivo) return;

        try {
            const logoUrl = await lerImagem(arquivo);
            setForm((f) => ({ ...f, logoUrl }));
        } catch (erro) {
            mensagemErro(erro.message);
        }
    }

    const termos = termosDe(form.nomeFantasia, form.razaoSocial, form.email.split("@")[0]);
    const regras = regrasSenha(form.senha, termos);
    const divergem = form.confirmacao !== "" && form.senha !== form.confirmacao;

    async function salvar(e) {
        e.preventDefault();

        if (!form.razaoSocial.trim()) return mensagemErro("O campo Razão Social é obrigatório.");
        if (!form.nomeFantasia.trim()) return mensagemErro("O campo Nome Fantasia é obrigatório.");
        if (!form.cnpj.trim()) return mensagemErro("O campo CNPJ é obrigatório.");

        if (!editando) {
            if (!EMAIL_VALIDO.test(form.email)) return mensagemErro("Informe um e-mail corporativo válido.");
            if (!senhaValida(form.senha, termos)) return mensagemErro("A senha não atende aos requisitos.");
            if (form.senha !== form.confirmacao) return mensagemErro("As senhas não coincidem.");
            if (!aceite) return mensagemErro("Aceite os termos de uso para continuar.");
        }

        const dadosEmpresa = {
            id: editando ? Number(idParam) : null,
            razaoSocial: form.razaoSocial.trim(),
            nomeFantasia: form.nomeFantasia.trim(),
            cnpj: form.cnpj,
            inscricaoEstadual: form.inscricaoEstadual,
            inscricaoMunicipal: form.inscricaoMunicipal,
            responsavelLegal: form.responsavelLegal,
            telefone: form.telefone,
            cep: form.cep,
            logradouro: form.logradouro,
            numeroResidencial: form.numeroResidencial,
            complemento: form.complemento,
            bairro: form.bairro,
            cidade: form.cidade,
            uf: form.uf,
            logoUrl: form.logoUrl,
            descricao: form.descricao,
            status: "ATIVO",
        };

        try {
            let itemSalvo = { ...dadosEmpresa };

            if (!editando) {
                // Cria o login da loja e vincula a empresa a ele (idUsuario).
                const resUsuario = await axios.post(
                    `${BASE_URL}/usuarios`,
                    {
                        nome: form.nomeFantasia.trim(),
                        email: form.email.trim(),
                        senhaHash: form.senha,
                        dataCadastro: hoje(),
                    },
                    CABECALHO
                );
                const idUsuario = resUsuario.data?.id;

                const resEmpresa = await axios.post(
                    `${BASE_URL}/empresas`,
                    { ...dadosEmpresa, idUsuario, statusVerificacao: "NAO_VERIFICADA" },
                    CABECALHO
                );
                itemSalvo = resEmpresa.data?.id
                    ? resEmpresa.data
                    : { ...dadosEmpresa, idUsuario, statusVerificacao: "NAO_VERIFICADA" };
                mensagemSucesso(`Cadastro enviado! Bem-vinda, ${form.nomeFantasia.trim()}.`);
            } else {
                await axios.put(`${BASE_URL}/empresas/${idParam}`, dadosEmpresa, CABECALHO);
                mensagemSucesso(`Empresa "${form.nomeFantasia}" alterada com sucesso!`);
            }

            navigate(editando ? "/listagem-empresa" : "/login", {
                state: editando ? { item: itemSalvo, acao: "EDITAR" } : undefined,
            });
        } catch (erro) {
            mensagemErro(erro.response?.data || "Erro ao salvar a empresa.");
        }
    }

    const campo = (id, label, chave, { classe = "c-6", placeholder = "", type = "text" } = {}) => (
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
            <span className="mk-auth__blob mk-auth__blob--left" aria-hidden="true" />
            <span className="mk-auth__blob mk-auth__blob--right" aria-hidden="true" />

            <section className="mk-cad__card is-wide">
                <header className="mk-cad__head">
                    <h1>{editando ? "Editar Empresa" : "Cadastro de Empresa Parceira"}</h1>
                    <p>
                        {editando
                            ? "Atualize os dados comerciais da loja"
                            : "Venda seus produtos no maior marketplace"}
                    </p>
                </header>

                <form className="mk-cad__form" onSubmit={salvar} noValidate>
                    <div className="mk-cad__photo">
                        <button
                            type="button"
                            className="mk-cad__photo-circle is-logo"
                            aria-label="Enviar logotipo"
                            onClick={() => inputLogo.current?.click()}
                        >
                            {form.logoUrl ? (
                                <img src={form.logoUrl} alt="Logotipo da loja" />
                            ) : (
                                <StorefrontOutlinedIcon sx={{ fontSize: 30 }} />
                            )}
                        </button>
                        <input
                            ref={inputLogo}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/avif"
                            hidden
                            onChange={escolherLogo}
                        />
                        <small>+ Upload do Logotipo (máx 5MB)</small>
                    </div>

                    <div className="mk-cad__grid">
                        {campo("razao", "Razão Social", "razaoSocial", {
                            placeholder: "Empresa LTDA",
                        })}
                        {campo("nomeFantasia", "Nome Fantasia (Vitrine Pública)", "nomeFantasia", {
                            placeholder: "Ricardo Eletro",
                        })}

                        {campo("cnpj", "CNPJ", "cnpj", { placeholder: "00.000.000/0001-00" })}
                        {campo("responsavel", "Responsável Legal", "responsavelLegal", {
                            placeholder: "Fulano de Beltrano",
                        })}

                        {campo("ie", "Inscrição Estadual", "inscricaoEstadual", {
                            placeholder: "123.456.789.000",
                        })}
                        {campo("im", "Inscrição Municipal", "inscricaoMunicipal", {
                            placeholder: "987654-0",
                        })}

                        {campo("telefone", "Telefone Comercial", "telefone", {
                            placeholder: "(xx) 0000-0000",
                        })}
                        {campo("email", "E-mail Corporativo", "email", {
                            type: "email",
                            placeholder: "contato@exemplo.com",
                        })}

                        {campo("cep", "CEP Comercial", "cep", {
                            classe: "c-4",
                            placeholder: "00000-000",
                        })}
                        {campo("logradouro", "Logradouro", "logradouro", {
                            classe: "c-8",
                            placeholder: "Av. Paulista",
                        })}

                        {campo("numero", "Número", "numeroResidencial", {
                            classe: "c-3",
                            placeholder: "1000",
                        })}
                        {campo("complemento", "Complemento", "complemento", {
                            classe: "c-4",
                            placeholder: "Conjunto 52",
                        })}
                        {campo("bairro", "Bairro", "bairro", {
                            classe: "c-5",
                            placeholder: "Bela Vista",
                        })}

                        {campo("cidade", "Cidade", "cidade", {
                            classe: "c-9",
                            placeholder: "Juiz de Fora",
                        })}
                        <Campo id="uf" label="UF" className="c-3">
                            <select id="uf" className="mk-auth__input" value={form.uf} onChange={alterar("uf")}>
                                <option value="">Selecione</option>
                                {UFS.map((sigla) => (
                                    <option key={sigla} value={sigla}>
                                        {sigla}
                                    </option>
                                ))}
                            </select>
                        </Campo>

                        <Campo id="descricao" label="Descrição Pública da Empresa (Vitrine)" className="c-12">
                            <textarea
                                id="descricao"
                                className="mk-auth__input mk-cad__textarea"
                                rows={4}
                                placeholder="Especialistas em eletrodomésticos com mais de 10 anos de tradição..."
                                value={form.descricao}
                                onChange={alterar("descricao")}
                            />
                        </Campo>

                        {!editando && (
                            <>
                                {campo("senha", "Senha", "senha", { type: "password" })}
                                {campo("confirmacao", "Confirmar Senha", "confirmacao", {
                                    type: "password",
                                })}

                                <ul className="mk-cad__rules c-12">
                                    {regras.map((r) => (
                                        <li key={r.rotulo} className={r.ok ? "is-ok" : ""}>
                                            <span>{r.ok ? "✓" : ""}</span>
                                            {r.rotulo}
                                        </li>
                                    ))}
                                </ul>

                                {divergem && (
                                    <p className="mk-cad__erro c-12">As senhas não coincidem.</p>
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
                            {editando ? "Salvar Alterações da Loja" : "Cadastrar Empresa"}
                        </button>
                    </div>

                    {editando ? (
                        <p className="mk-cad__foot">
                            <button type="button" className="mk-cad__cancel" onClick={() => navigate("/listagem-empresa")}>
                                Cancelar
                            </button>
                        </p>
                    ) : (
                        <p className="mk-cad__foot">
                            Já possui cadastro corporativo? <Link to="/login">Entrar no painel</Link>
                        </p>
                    )}
                </form>
            </section>
        </main>
    );
}