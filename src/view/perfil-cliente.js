import React from "react";
import axios from "axios";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useNavigate } from "react-router-dom";
import ContaLayout from "../components/conta-layout";
import { mensagemErro, mensagemSucesso } from "../components/toastr";
import { BASE_URL } from "../config/axios";
import { obterSessao } from "../config/sessao";
import { UFS } from "../utils/endereco";
import { lerImagem } from "../utils/imagem";

const ITENS_MENU = [
    { href: "/perfil", label: "Dados do Perfil", icone: "👤" },
    { href: "/listagem-cartoes", label: "Meus Cartões", icone: "💳" },
    { href: "/meus-pedidos", label: "Histórico de Pedidos", icone: "📦" },
    { href: "/mensagens", label: "Mensagens e Chat", icone: "💬" },
    { href: "/notificacoes", label: "Notificações", icone: "🔔" },
];

const CABECALHO_JSON = { headers: { "Content-Type": "application/json" } };

const iniciais = (nome = "") =>
    nome.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";

const formDe = (c) => ({
    nomeCompleto: c.nomeCompleto ?? "",
    cpf: c.cpf ?? "",
    telefone: c.telefone ?? "",
    cep: c.cep ?? "",
    logradouro: c.logradouro ?? "",
    numeroResidencial: c.numeroResidencial ?? "",
    complemento: c.complemento ?? "",
    bairro: c.bairro ?? "",
    cidade: c.cidade ?? "",
    uf: c.uf ?? "",
    fotoUrl: c.fotoUrl ?? "",
});

export default function PerfilCliente() {
    const navigate = useNavigate();
    const { clienteId, usuarioId } = obterSessao();
    const inputFoto = React.useRef(null);

    const [cliente, setCliente] = React.useState(null);
    const [email, setEmail] = React.useState("");
    const [form, setForm] = React.useState(null);
    const [salvando, setSalvando] = React.useState(false);

    React.useEffect(() => {
        if (!clienteId) {
            mensagemErro("Sessão inválida. Faça login novamente.");
            return;
        }

        Promise.all([
            axios.get(`${BASE_URL}/clientes/${clienteId}`),
            usuarioId ? axios.get(`${BASE_URL}/usuarios/${usuarioId}`) : Promise.resolve(null),
        ])
            .then(([resCliente, resUsuario]) => {
                setCliente(resCliente.data);
                setForm(formDe(resCliente.data));
                setEmail(resUsuario?.data?.email ?? "");
            })
            .catch(() => mensagemErro("Erro ao carregar seus dados."));
    }, [clienteId, usuarioId]);

    const alterar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

    async function trocarFoto(e) {
        const arquivo = e.target.files?.[0];
        e.target.value = "";
        if (!arquivo) return;

        try {
            const dataUrl = await lerImagem(arquivo);
            setForm((f) => ({ ...f, fotoUrl: dataUrl }));
        } catch (error) {
            mensagemErro(error.message);
        }
    }

    function descartar() {
        setForm(formDe(cliente));
    }

    async function salvar() {
        if (!form.nomeCompleto.trim()) {
            mensagemErro("O campo Nome Completo é obrigatório.");
            return;
        }

        const payload = { ...cliente, ...form, nomeCompleto: form.nomeCompleto.trim() };

        setSalvando(true);
        try {
            await axios.put(`${BASE_URL}/clientes/${cliente.id}`, payload, CABECALHO_JSON);
            setCliente(payload);
            mensagemSucesso("Dados atualizados com sucesso!");
        } catch (error) {
            mensagemErro(error.response?.data || "Erro ao salvar os dados.");
        } finally {
            setSalvando(false);
        }
    }

    if (!form) {
        return <div className="text-center my-4">Carregando seus dados...</div>;
    }

    return (
        <ContaLayout titulo="Minha Conta" itens={ITENS_MENU}>
            <div className="mk-form-card">
                <h1>Dados do Meu Perfil</h1>
                <p className="mk-form-card__sub">
                    Atualize suas informações pessoais e endereço de entrega
                </p>

                <div className="mk-avatar-row">
                    <span className="mk-avatar">
                        {form.fotoUrl ? <img src={form.fotoUrl} alt={form.nomeCompleto} /> : iniciais(form.nomeCompleto)}
                    </span>

                    <div>
                        <button
                            type="button"
                            className="btn btn-outline-warning btn-sm"
                            onClick={() => inputFoto.current?.click()}
                        >
                            Trocar Foto
                        </button>
                        <input
                            ref={inputFoto}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/avif"
                            hidden
                            onChange={trocarFoto}
                        />
                        <small className="mk-avatar-row__hint">JPG, PNG, WebP ou AVIF (máx 5MB)</small>
                    </div>
                </div>

                <div className="row g-3">
                    <div className="col-12">
                        <label className="form-label" htmlFor="inputNomeCompleto">Nome Completo</label>
                        <input
                            id="inputNomeCompleto"
                            className="form-control"
                            value={form.nomeCompleto}
                            onChange={alterar("nomeCompleto")}
                        />
                    </div>

                    <div className="col-md-6">
                        <label className="form-label" htmlFor="inputCpf">
                            CPF (Não editável) <LockOutlinedIcon sx={{ fontSize: 14 }} />
                        </label>
                        <input id="inputCpf" className="form-control" value={form.cpf} disabled />
                    </div>

                    <div className="col-md-6">
                        <label className="form-label" htmlFor="inputEmail">
                            E-mail de Cadastro (Não editável) <LockOutlinedIcon sx={{ fontSize: 14 }} />
                        </label>
                        <input id="inputEmail" className="form-control" value={email} disabled />
                    </div>

                    <div className="col-md-6">
                        <label className="form-label" htmlFor="inputTelefone">Telefone / WhatsApp</label>
                        <input
                            id="inputTelefone"
                            className="form-control"
                            value={form.telefone}
                            onChange={alterar("telefone")}
                        />
                    </div>

                    <div className="col-md-6">
                        <label className="form-label" htmlFor="inputCep">CEP</label>
                        <input id="inputCep" className="form-control" value={form.cep} onChange={alterar("cep")} />
                    </div>

                    <div className="col-md-8">
                        <label className="form-label" htmlFor="inputLogradouro">Logradouro (Rua/Avenida)</label>
                        <input
                            id="inputLogradouro"
                            className="form-control"
                            value={form.logradouro}
                            onChange={alterar("logradouro")}
                        />
                    </div>

                    <div className="col-md-2">
                        <label className="form-label" htmlFor="inputNumero">Número</label>
                        <input
                            id="inputNumero"
                            className="form-control"
                            value={form.numeroResidencial}
                            onChange={alterar("numeroResidencial")}
                        />
                    </div>

                    <div className="col-md-2">
                        <label className="form-label" htmlFor="inputComplemento">Complemento</label>
                        <input
                            id="inputComplemento"
                            className="form-control"
                            value={form.complemento}
                            onChange={alterar("complemento")}
                        />
                    </div>

                    <div className="col-md-5">
                        <label className="form-label" htmlFor="inputBairro">Bairro</label>
                        <input id="inputBairro" className="form-control" value={form.bairro} onChange={alterar("bairro")} />
                    </div>

                    <div className="col-md-5">
                        <label className="form-label" htmlFor="inputCidade">Cidade</label>
                        <input id="inputCidade" className="form-control" value={form.cidade} onChange={alterar("cidade")} />
                    </div>

                    <div className="col-md-2">
                        <label className="form-label" htmlFor="selectUf">UF</label>
                        <select id="selectUf" className="form-control" value={form.uf} onChange={alterar("uf")}>
                            <option value="">Selecione</option>
                            {UFS.map((sigla) => (
                                <option key={sigla} value={sigla}>{sigla}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mk-form-card__actions">
                    <div className="d-flex gap-2">
                        <button type="button" className="btn btn-warning mk-pill-btn" onClick={salvar} disabled={salvando}>
                            {salvando ? "Salvando..." : "Salvar Alterações"}
                        </button>
                        <button type="button" className="btn btn-outline-secondary mk-pill-btn" onClick={descartar}>
                            Descartar
                        </button>
                    </div>

                    <div className="mk-security">
                        <span className="mk-security__title">Segurança da Conta</span>
                        <button
                            type="button"
                            className="btn btn-outline-warning mk-pill-btn"
                            onClick={() => navigate("/alterar-senha")}
                        >
                            <LockOutlinedIcon sx={{ fontSize: 14 }} /> Alterar Senha
                        </button>
                    </div>
                </div>
            </div>
        </ContaLayout>
    );
}