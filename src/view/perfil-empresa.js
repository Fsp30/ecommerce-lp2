import React from "react";
import axios from "axios";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

import ContaLayout from "../components/conta-layout";
import { mensagemErro, mensagemSucesso } from "../components/toastr";
import { BASE_URL } from "../config/axios";
import { obterSessao } from "../config/sessao";
import { UFS } from "../utils/endereco";
import { lerImagem } from "../utils/imagem";

const ITENS_MENU = [
    { href: "/", label: "Visão Geral", icone: "📊" },
    { href: "/listagem-produtos", label: "Gestão de Estoque", icone: "📦" },
    { href: "/cadastro-produto", label: "Cadastrar Produto", icone: "➕" },
    { href: "/pedidos-recebidos", label: "Pedidos Recebidos", icone: "📑" },
    { href: "/notificacoes", label: "Notificações", icone: "🔔" },
    { href: "/mensagens", label: "Mensagens", icone: "💬" },
    { href: "/perfil", label: "Perfil da Empresa", icone: "🏬" },
];

const CABECALHO_JSON = { headers: { "Content-Type": "application/json" } };

const formDe = (e) => ({
    nomeFantasia: e.nomeFantasia ?? "",
    telefone: e.telefone ?? "",
    cep: e.cep ?? "",
    logradouro: e.logradouro ?? "",
    numeroResidencial: e.numeroResidencial ?? "",
    bairro: e.bairro ?? "",
    cidade: e.cidade ?? "",
    uf: e.uf ?? "",
    descricao: e.descricao ?? "",
    logoUrl: e.logoUrl ?? "",
});

export default function PerfilEmpresa() {
    const { empresaId } = obterSessao();
    const inputLogo = React.useRef(null);

    const [empresa, setEmpresa] = React.useState(null);
    const [form, setForm] = React.useState(null);
    const [salvando, setSalvando] = React.useState(false);

    React.useEffect(() => {
        if (!empresaId) {
            mensagemErro("Sessão inválida. Faça login novamente.");
            return;
        }

        axios
            .get(`${BASE_URL}/empresas/${empresaId}`)
            .then((res) => {
                setEmpresa(res.data);
                setForm(formDe(res.data));
            })
            .catch(() => mensagemErro("Erro ao carregar os dados da loja."));
    }, [empresaId]);

    const alterar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

    async function trocarLogo(e) {
        const arquivo = e.target.files?.[0];
        e.target.value = "";
        if (!arquivo) return;

        try {
            const dataUrl = await lerImagem(arquivo);
            setForm((f) => ({ ...f, logoUrl: dataUrl }));
        } catch (error) {
            mensagemErro(error.message);
        }
    }

    function descartar() {
        setForm(formDe(empresa));
    }

    async function salvar() {
        if (!form.nomeFantasia.trim()) {
            mensagemErro("O campo Nome Fantasia é obrigatório.");
            return;
        }

        const payload = { ...empresa, ...form, nomeFantasia: form.nomeFantasia.trim() };

        setSalvando(true);
        try {
            await axios.put(`${BASE_URL}/empresas/${empresa.id}`, payload, CABECALHO_JSON);
            setEmpresa(payload);
            mensagemSucesso("Dados da loja atualizados com sucesso!");
        } catch (error) {
            mensagemErro(error.response?.data || "Erro ao salvar os dados da loja.");
        } finally {
            setSalvando(false);
        }
    }

    if (!form) {
        return <div className="text-center my-4">Carregando dados da loja...</div>;
    }

    return (
        <ContaLayout titulo="Painel Lojista" itens={ITENS_MENU}>
            <div className="mk-form-card">
                <h1>Configurações da Loja e Perfil Público</h1>
                <p className="mk-form-card__sub">
                    Atualize os dados comerciais da sua vitrine pública no marketplace
                </p>

                <div className="mk-avatar-row">
                    <span className="mk-avatar mk-avatar--logo">
                        {form.logoUrl ? (
                            <img src={form.logoUrl} alt={form.nomeFantasia} />
                        ) : (
                            form.nomeFantasia?.charAt(0)?.toUpperCase() || "?"
                        )}
                    </span>

                    <div>
                        <button
                            type="button"
                            className="btn btn-warning mk-pill-btn"
                            onClick={() => inputLogo.current?.click()}
                        >
                            Alterar Logotipo
                        </button>
                        <input
                            ref={inputLogo}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/avif"
                            hidden
                            onChange={trocarLogo}
                        />
                        <small className="mk-avatar-row__hint">JPG, PNG, WebP ou AVIF até 5MB</small>
                    </div>
                </div>

                <div className="row g-3">
                    <div className="col-md-6">
                        <label className="form-label" htmlFor="inputRazaoSocial">
                            Razão Social (Não editável) <LockOutlinedIcon sx={{ fontSize: 14 }} />
                        </label>
                        <input id="inputRazaoSocial" className="form-control" value={empresa.razaoSocial ?? ""} disabled />
                    </div>

                    <div className="col-md-6">
                        <label className="form-label" htmlFor="inputCnpj">
                            CNPJ (Não editável) <LockOutlinedIcon sx={{ fontSize: 14 }} />
                        </label>
                        <input id="inputCnpj" className="form-control" value={empresa.cnpj ?? ""} disabled />
                    </div>

                    <div className="col-md-6">
                        <label className="form-label" htmlFor="inputNomeFantasia">
                            Nome Fantasia (Exibido na Vitrine Pública)
                        </label>
                        <input
                            id="inputNomeFantasia"
                            className="form-control"
                            value={form.nomeFantasia}
                            onChange={alterar("nomeFantasia")}
                        />
                    </div>

                    <div className="col-md-6">
                        <label className="form-label" htmlFor="inputTelefone">Telefone Comercial / WhatsApp</label>
                        <input id="inputTelefone" className="form-control" value={form.telefone} onChange={alterar("telefone")} />
                    </div>

                    <div className="col-md-3">
                        <label className="form-label" htmlFor="inputCep">CEP Comercial</label>
                        <input id="inputCep" className="form-control" value={form.cep} onChange={alterar("cep")} />
                    </div>

                    <div className="col-md-6">
                        <label className="form-label" htmlFor="inputLogradouro">Logradouro</label>
                        <input
                            id="inputLogradouro"
                            className="form-control"
                            value={form.logradouro}
                            onChange={alterar("logradouro")}
                        />
                    </div>

                    <div className="col-md-3">
                        <label className="form-label" htmlFor="inputNumero">Número</label>
                        <input
                            id="inputNumero"
                            className="form-control"
                            value={form.numeroResidencial}
                            onChange={alterar("numeroResidencial")}
                        />
                    </div>

                    <div className="col-md-4">
                        <label className="form-label" htmlFor="inputBairro">Bairro</label>
                        <input id="inputBairro" className="form-control" value={form.bairro} onChange={alterar("bairro")} />
                    </div>

                    <div className="col-md-6">
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

                    <div className="col-12">
                        <label className="form-label" htmlFor="inputDescricao">
                            Descrição Institucional da Empresa (Exibida aos Clientes na Vitrine)
                        </label>
                        <textarea
                            id="inputDescricao"
                            className="form-control"
                            rows={4}
                            value={form.descricao}
                            onChange={alterar("descricao")}
                        />
                    </div>
                </div>

                <div className="mk-form-card__actions">
                    <div className="d-flex gap-2">
                        <button type="button" className="btn btn-warning mk-pill-btn" onClick={salvar} disabled={salvando}>
                            {salvando ? "Salvando..." : "Salvar Alterações da Loja"}
                        </button>
                        <button type="button" className="btn btn-outline-secondary mk-pill-btn" onClick={descartar}>
                            Descartar
                        </button>
                    </div>
                </div>
            </div>
        </ContaLayout>
    );
}