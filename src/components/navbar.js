import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import PersonOutlineIcon from "@mui/icons-material/AccountCircleOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { obterSessao } from "../config/sessao";
import { loadSuggester } from "../utils/search/search-fix";
import Sidebar from "./sidebar";

const LISTAGENS = [
    { href: "/listagem-usuarios", label: "Usuários" },
    { href: "/listagem-empresa", label: "Empresas" },
    { href: "/listagem-clientes", label: "Clientes" },
    { href: "/listagem-produtos", label: "Produtos" },
    { href: "/listagem-categorias", label: "Categorias" },
    { href: "/listagem-cartoes", label: "Cartões" },
    { href: "/meus-pedidos", label: "Meus pedidos" },
    { href: "/mensagens", label: "Mensagens" },
    { href: "/notificacoes", label: "Notificações" },
    { href: "/pedidos-recebidos", label: "Pedidos recebidos" },
    { href: "/moderacao/avaliacoes", label: "Avaliações" },
    { href: "/moderacao/denuncias", label: "Denúncias" },
];

const CADASTROS = [
    { href: "/cadastro-cliente", label: "Cliente" },
    { href: "/cadastro-empresa", label: "Empresa" },
    { href: "/cadastro-produto", label: "Produto" },
    { href: "/cadastro-categorias", label: "Categoria" },
    { href: "/cadastro-cartao", label: "Cartão" },
];

const ITENS_CLIENTE = [];
const ITENS_EMPRESA = [];
const ITENS_ADMIN = [];

const VOCAB_URL = `${process.env.PUBLIC_URL}/vocab.json`;

function Dropdown({ id, label, items, openId, setOpenId, pathname }) {
    const isOpen = openId === id;
    const hasActive = items.some((item) => item.href === pathname);
    const closeTimer = React.useRef(null);

    const handleMouseEnter = () => {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current);
            closeTimer.current = null;
        }
        setOpenId(id);
    };

    const handleMouseLeave = () => {
        closeTimer.current = setTimeout(() => {
            setOpenId((prev) => (prev === id ? null : prev));
        }, 180);
    };

    React.useEffect(() => {
        return () => {
            if (closeTimer.current) clearTimeout(closeTimer.current);
        };
    }, []);

    return (
        <li
            className="mk-dropdown"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <button
                type="button"
                className={`mk-link ${hasActive ? "is-active" : ""} ${isOpen ? "is-open" : ""}`}
                aria-expanded={isOpen}
                onClick={() => setOpenId(isOpen ? null : id)}
            >
                {label}
                <KeyboardArrowDownIcon fontSize="small" className="mk-dropdown__icon" />
            </button>

            <div className={`mk-dropdown__menu ${isOpen ? "is-open" : ""}`}>
                {items.map((item) => (
                    <Link
                        key={item.href}
                        to={item.href}
                        className={item.href === pathname ? "is-active" : ""}
                    >
                        {item.label}
                    </Link>
                ))}
            </div>
        </li>
    );
}

function Navbar() {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const [openId, setOpenId] = React.useState(null);
    const [menuAberto, setMenuAberto] = React.useState(false);
    const [sidebarAberta, setSidebarAberta] = React.useState(false);
    const [busca, setBusca] = React.useState("");
    const [sugestoes, setSugestoes] = React.useState([]);
    const [indice, setIndice] = React.useState(-1);

    const ref = React.useRef(null);
    const suggesterRef = React.useRef(null);
    const sessao = obterSessao();

    const itensConta =
        sessao.tipo === "CLIENTE"
            ? ITENS_CLIENTE
            : sessao.tipo === "EMPRESA"
            ? ITENS_EMPRESA
            : null;

    const itensAdmin = sessao.tipo === "ADMIN" ? ITENS_ADMIN : null;

    const fecharSidebar = React.useCallback(() => setSidebarAberta(false), []);

    React.useEffect(() => {
        setOpenId(null);
        setMenuAberto(false);
        setSidebarAberta(false);
        setSugestoes([]);
    }, [pathname]);

    React.useEffect(() => {
        const fechar = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpenId(null);
                setSugestoes([]);
            }
        };

        document.addEventListener("mousedown", fechar);
        return () => document.removeEventListener("mousedown", fechar);
    }, []);

    React.useEffect(() => {
        let ativo = true;
        loadSuggester(VOCAB_URL)
            .then((s) => {
                if (ativo) suggesterRef.current = s;
            })
            .catch(() => {});
        return () => {
            ativo = false;
        };
    }, []);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            const s = suggesterRef.current;
            const palavras = busca.trim().split(/\s+/).filter(Boolean);

            if (!s || palavras.length === 0 || /\s$/.test(busca)) {
                setSugestoes([]);
                return;
            }

            const ultima = palavras[palavras.length - 1];
            const prefixo = palavras.slice(0, -1).join(" ");
            const montar = (palavra) => (prefixo ? `${prefixo} ${palavra}` : palavra);
            const base = (prefixo ? prefixo.length + 1 : 0) + ultima.length;

            let lista = s
                .complete(ultima, 5)
                .map((w) => ({ texto: montar(w), tipo: "completar", base }));

            if (lista.length === 0) {
                lista = s
                    .top(ultima, 3)
                    .map((w) => ({ texto: montar(w), tipo: "corrigir", base }));
            }

            setSugestoes(lista);
        }, 150);

        return () => clearTimeout(timer);
    }, [busca]);

    React.useEffect(() => {
        setIndice(-1);
    }, [sugestoes]);

    const irParaBusca = (valor) => {
        const termo = valor.trim();

        navigate(
            termo
                ? `/listagem-produtos?busca=${encodeURIComponent(termo)}`
                : "/listagem-produtos"
        );
    };

    const buscar = (e) => {
        e.preventDefault();
        setSugestoes([]);
        irParaBusca(busca);
    };

    const aceitarSugestao = (texto) => {
        setBusca(texto);
        setSugestoes([]);
        irParaBusca(texto);
    };

    const aoTeclar = (e) => {
        if (sugestoes.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setIndice((i) => (i + 1) % sugestoes.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setIndice((i) => (i <= 0 ? sugestoes.length - 1 : i - 1));
        } else if (e.key === "Escape") {
            setSugestoes([]);
        } else if (e.key === "Enter" && indice >= 0) {
            e.preventDefault();
            aceitarSugestao(sugestoes[indice].texto);
        }
    };

    return (
        <>
            <nav className="mk-navbar" ref={ref}>
                <button
                    type="button"
                    className="mk-brand"
                    aria-label="Abrir menu lateral"
                    aria-expanded={sidebarAberta}
                    onClick={() => setSidebarAberta((v) => !v)}
                >
                    <svg
                        width="28"
                        height="28"
                        viewBox="0 0 28 28"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                    >
                        <path d="M8 24 L20 4" />
                        <path d="M13 26 L25 10" />
                    </svg>
                </button>

                <form className="mk-search" onSubmit={buscar} role="search">
                    <input
                        type="search"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        onKeyDown={aoTeclar}
                        placeholder="Buscar produtos, marcas e muito mais..."
                        aria-label="Buscar produtos"
                        autoComplete="off"
                        role="combobox"
                        aria-expanded={sugestoes.length > 0}
                        aria-controls="mk-sugestoes"
                        aria-autocomplete="list"
                        aria-activedescendant={
                            indice >= 0 ? `mk-sugestao-${indice}` : undefined
                        }
                    />

                    <button type="submit" aria-label="Buscar">
                        <SearchIcon fontSize="small" />
                    </button>

                    {sugestoes.length > 0 && (
                        <ul id="mk-sugestoes" className="mk-search__sugestoes" role="listbox">
                            {sugestoes.map((s, i) => (
                                <li
                                    key={s.texto}
                                    id={`mk-sugestao-${i}`}
                                    role="option"
                                    aria-selected={i === indice}
                                    className={i === indice ? "is-active" : ""}
                                    onMouseEnter={() => setIndice(i)}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        aceitarSugestao(s.texto);
                                    }}
                                >
                                    <SearchIcon fontSize="inherit" />
                                    {s.tipo === "completar" ? (
                                        <span>
                                            {s.texto.slice(0, s.base)}
                                            <strong>{s.texto.slice(s.base)}</strong>
                                        </span>
                                    ) : (
                                        <span>
                                            <em>Você quis dizer</em> {s.texto}
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </form>

                <ul className={`mk-links ${menuAberto ? "is-open" : ""}`}>
                    <li>
                        <Link
                            to="/listagem-categorias"
                            className={`mk-link ${
                                pathname === "/listagem-categorias" ? "is-active" : ""
                            }`}
                        >
                            Categorias
                        </Link>
                    </li>

                    <Dropdown
                        id="listagens"
                        label="Listagens"
                        items={LISTAGENS}
                        openId={openId}
                        setOpenId={setOpenId}
                        pathname={pathname}
                    />

                    <Dropdown
                        id="cadastros"
                        label="Cadastros"
                        items={CADASTROS}
                        openId={openId}
                        setOpenId={setOpenId}
                        pathname={pathname}
                    />

                    {itensConta && (
                        <Dropdown
                            id="conta"
                            label="Minha conta"
                            items={itensConta}
                            openId={openId}
                            setOpenId={setOpenId}
                            pathname={pathname}
                        />
                    )}

                    {itensAdmin && (
                        <Dropdown
                            id="admin"
                            label="Moderação"
                            items={itensAdmin}
                            openId={openId}
                            setOpenId={setOpenId}
                            pathname={pathname}
                        />
                    )}

                    <li>
                        <a href="/contato" className="mk-link">
                            Contato
                        </a>
                    </li>

                    <li>
                        <a
                            href="/listagem-carrinhos"
                            className="mk-link"
                            aria-label="Carrinho"
                        >
                            <ShoppingCartOutlinedIcon fontSize="small" />
                        </a>
                    </li>

                    <li>
                        <Link to="/login" className="mk-link">
                            Entrar
                            <PersonOutlineIcon fontSize="small" />
                        </Link>
                    </li>
                </ul>
            </nav>

            <Sidebar aberta={sidebarAberta} onFechar={fecharSidebar} />
        </>
    );
}

export default Navbar;