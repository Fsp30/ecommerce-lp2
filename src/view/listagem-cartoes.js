import React from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/Delete";

import PageHeader from "../components/page-header";
import { mensagemSucesso, mensagemErro } from "../components/toastr";
import { BASE_URL } from "../config/axios";

const baseURL = `${BASE_URL}/cartoes`;

const PALETA = [
    { fundo: "#5b0a7d", destaque: "#ffe066" },
    { fundo: "#ffa500", destaque: "#1d1dff" },
    { fundo: "#111827", destaque: "#ffc800" },
    { fundo: "#0b6b4f", destaque: "#a7f3d0" },
    { fundo: "#1e3a8a", destaque: "#93c5fd" },
];

const validade = (cartao) => {
    if (!cartao.validadeMes || !cartao.validadeAno) return "--/--";
    return `${String(cartao.validadeMes).padStart(2, "0")}/${String(cartao.validadeAno).slice(-2)}`;
};

function CartaoVisual({ cartao, indice, onEditar, onExcluir }) {
    const { fundo, destaque } = PALETA[indice % PALETA.length];
    const finalCartao = cartao.ultimosDigitos ?? "••••";

    return (
        <div>
            <div className="mk-credit" style={{ background: fundo, "--accent": destaque }}>
                <div className="mk-credit__row">
                    <span className="mk-credit__alias">{cartao.apelido || "Cartão"}</span>
                    <span>{cartao.bandeira}</span>
                </div>
                <div className="mk-credit__number">•••• •••• •••• {finalCartao}</div>
                <div className="mk-credit__row">
                    <div>
                        <small>Titular</small>
                        <b>{String(cartao.nomeTitular ?? "").toUpperCase()}</b>
                    </div>
                    <div>
                        <small>Validade</small>
                        <b>{validade(cartao)}</b>
                    </div>
                </div>
            </div>
            <div className="mk-credit__actions">
                <button type="button" className="mk-credit__edit" onClick={() => onEditar(cartao.id)}>
                    <EditOutlinedIcon fontSize="inherit" /> Editar apelido/validade
                </button>
                <button type="button" className="mk-credit__delete" onClick={() => onExcluir(cartao.id)}>
                    <DeleteOutlineIcon fontSize="inherit" /> Excluir Cartão
                </button>
                {cartao.status && <span className="mk-credit__status">{String(cartao.status).toLowerCase()}</span>}
            </div>
        </div>
    );
}

export default function ListagemCartoes() {
    const navigate = useNavigate();
    const [dados, setDados] = React.useState(null);

    const cadastrar = () => navigate(`/cadastro-cartoes`);
    const editar = (id) => navigate(`/cadastro-cartoes/${id}`);

    async function excluir(id) {
        try {
            await axios.delete(`${baseURL}/${id}`);
            mensagemSucesso("Cartão excluído com sucesso!");
            setDados((atual) => atual.filter((dado) => dado.id !== id));
        } catch (error) {
            mensagemErro("Erro ao excluir o cartão");
        }
    }

    React.useEffect(() => {
        axios.get(baseURL).then((response) => setDados(response.data));
    }, []);

    if (!dados) return null;

    return (
        <>
            <PageHeader trail={["Meus Cartões"]} title="Cartões" />
            <section className="mk-panel">
                <h1>Meus Cartões Salvos</h1>
                <p>Dados protegidos por criptografia e tokenização de segurança.</p>

                <div className="mk-cards">
                    {dados.length === 0 ? (
                        <div className="mk-empty">Nenhum cartão salvo.</div>
                    ) : (
                        dados.map((cartao, i) => (
                            <CartaoVisual key={cartao.id} cartao={cartao} indice={i} onEditar={editar} onExcluir={excluir} />
                        ))
                    )}
                </div>

                <div className="mk-subpanel">
                    <h2>+ Cadastrar Novo Cartão</h2>
                    <p>O número do cartão é validado pelo algoritmo de Luhn antes de ser salvo.</p>
                    <button type="button" className="btn btn-warning" onClick={cadastrar}>
                        Novo Cartão
                    </button>
                </div>
            </section>
        </>
    );
}
