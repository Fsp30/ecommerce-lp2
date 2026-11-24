import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import PersonOutlineIcon from "@mui/icons-material/AccountCircleOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { obterSessao } from "../config/sessao";
import { linksDoPerfil, rotuloDoPerfil } from "../config/menus";
import { loadSuggester } from "../utils/search/search-fix";
import { resolverBusca, sugerirEntidades } from "../utils/resolver-busca";
import { listar } from "../utils/api";
import Sidebar from "./sidebar";

const VOCAB_URL = `${process.env.PUBLIC_URL}/vocab.json`;

function Navbar() {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const [hover, setHover] = React.useState(false);
    const [menuAberto, setMenuAberto] = React.useState(false);
    const [sidebarAberta, setSidebarAberta] = React.useState(false);
    const [busca, setBusca] = React.useState("");
    const [sugestoes, setSugestoes] = React.useState([]);
    const [indice, setIndice] = React.useState(-1);
    const [catalogo, setCatalogo] = React.useState(null);

    const ref = React.useRef(null);
    const suggesterRef = React.useRef(null);

    const sessao = obterSessao();
    const links = linksDoPerfil(sessao);
    const rotulo = rotuloDoPerfil(sessao);

    const painelAberto = hover || menuAberto;

    const fecharSidebar = React.useCallback(() => setSidebarAberta(false), []);

    React.useEffect(() => {
        setHover(false);
        setMenuAberto(false);
        setSidebarAberta(false);
        setSugestoes([]);
    }, [pathname]);

    React.useEffect(() => {
        const fechar = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
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
        Promise.all([listar("produtos"), listar("empresas")])
            .then(([produtos, empresas]) => setCatalogo({ produtos, empresas }))
            .catch(() => {});
    }, []);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            const termo = busca.trim();
            const palavras = termo.split(/\s+/).filter(Boolean);

            if (palavras.length === 0 || /\s$/.test(busca)) {
                setSugestoes([]);
                return;
            }

            const entidades = catalogo
                ? sugerirEntidades(termo, catalogo).map((e) => ({ ...e, texto: e.nome }))
                : [];

            let palavrasSug = [];
            const s = suggesterRef.current;

            if (s) {
                const ultima = palavras[palavras.length - 1];
                const prefixo = palavras.slice(0, -1).join(" ");
                const montar = (palavra) => (prefixo ? `${prefixo} ${palavra}` : palavra);
                const base = (prefixo ? prefixo.length + 1 : 0) + ultima.length;

                palavrasSug = s
                    .complete(ultima, 5)
                    .map((w) => ({ texto: montar(w), tipo: "completar", base }));

                if (palavrasSug.length === 0) {
                    palavrasSug = s
                        .top(ultima, 3)
                        .map((w) => ({ texto: montar(w), tipo: "corrigir", base }));
                }
            }

            setSugestoes([...entidades, ...palavrasSug].slice(0, 8));
        }, 150);

        return () => clearTimeout(timer);
    }, [busca, catalogo]);

    React.useEffect(() => {
        setIndice(-1);
    }, [sugestoes]);

    const irParaBusca = (valor) => {
        const termo = valor.trim();
        const destino = catalogo ? resolverBusca(termo, catalogo) : null;

        if (destino) {
            setBusca("");
            setSugestoes([]);
            navigate(destino.href);
            return;
        }

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

    const aceitarSugestao = (s) => {
        if (s.href) {
            setBusca("");
            setSugestoes([]);
            navigate(s.href);
            return;
        }

        setBusca(s.texto);
        setSugestoes([]);
        irParaBusca(s.texto);
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
            aceitarSugestao(sugestoes[indice]);
        }
    };

    return (
        <>
            <div
                className={`mk-menu-blur ${painelAberto ? "is-open" : ""}`}
                aria-hidden="true"
                onClick={() => setMenuAberto(false)}
            />

            <nav
                className="mk-navbar"
                ref={ref}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
            >
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
                                    key={`${s.tipo}-${s.href ?? s.texto}`}
                                    id={`mk-sugestao-${i}`}
                                    role="option"
                                    aria-selected={i === indice}
                                    className={i === indice ? "is-active" : ""}
                                    onMouseEnter={() => setIndice(i)}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        aceitarSugestao(s);
                                    }}
                                >
                                    {s.tipo === "produto" && <ShoppingBagOutlinedIcon fontSize="inherit" />}
                                    {s.tipo === "loja" && <StorefrontOutlinedIcon fontSize="inherit" />}
                                    {(s.tipo === "completar" || s.tipo === "corrigir") && (
                                        <SearchIcon fontSize="inherit" />
                                    )}

                                    {s.href ? (
                                        <>
                                            <span className="mk-sug-nome">{s.nome}</span>
                                            <em className="mk-sug-tipo">
                                                {s.tipo === "loja" ? "Loja" : "Produto"}
                                            </em>
                                        </>
                                    ) : s.tipo === "completar" ? (
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

                <button
                    type="button"
                    className="mk-toggle"
                    aria-label="Abrir menu de navegação"
                    aria-expanded={menuAberto}
                    aria-controls="mk-mega"
                    onClick={() => setMenuAberto((v) => !v)}
                >
                    ☰
                </button>

                <ul className={`mk-links ${menuAberto ? "is-open" : ""}`}>
                    <li>
                        <button
                            type="button"
                            className={`mk-link mk-menu-trigger ${painelAberto ? "is-open" : ""}`}
                            aria-expanded={painelAberto}
                            aria-controls="mk-mega"
                            onClick={() => setMenuAberto((v) => !v)}
                        >
                            {rotulo}
                            <KeyboardArrowDownIcon fontSize="small" className="mk-dropdown__icon" />
                        </button>
                    </li>

                    <li>
                        <a href="/contato" className="mk-link">
                            Contato
                        </a>
                    </li>

                    <li>
                        <a href="/listagem-carrinhos" className="mk-link" aria-label="Carrinho">
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

                <div
                    id="mk-mega"
                    className={`mk-mega ${painelAberto ? "is-open" : ""}`}
                    aria-hidden={!painelAberto}
                >
                    <p className="mk-mega__title">{rotulo}</p>

                    <ul className="mk-mega__grid">
                        {links.map((item) => (
                            <li key={item.href}>
                                <Link
                                    to={item.href}
                                    className={pathname === item.href ? "is-active" : ""}
                                    tabIndex={painelAberto ? 0 : -1}
                                >
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </nav>

            <Sidebar aberta={sidebarAberta} onFechar={fecharSidebar} />
        </>
    );
}

export default Navbar;