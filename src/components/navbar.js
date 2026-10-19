import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import PersonOutlineIcon from "@mui/icons-material/AccountCircleOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import MenuIcon from "@mui/icons-material/Menu";

const LISTAGENS = [
    { href: "/listagem-usuarios", label: "Usuários" },
    { href: "/listagem-empresa", label: "Empresas" },
    { href: "/listagem-clientes", label: "Clientes" },
    { href: "/listagem-produtos", label: "Produtos" },
    { href: "/listagem-categorias", label: "Categorias" },
    { href: "/listagem-cartoes", label: "Cartões" },
];

const CADASTROS = [
    { href: "/cadastro-cliente", label: "Cliente" },
    { href: "/cadastro-empresa", label: "Empresa" },
    { href: "/cadastro-produto", label: "Produto" },
    { href: "/cadastro-categoria", label: "Categoria" },
    { href: "/cadastro-cartao", label: "Cartão" },
];

function Dropdown({ id, label, items, openId, setOpenId, pathname }) {
    const isOpen = openId === id;
    const hasActive = items.some((item) => item.href === pathname);

    return (
        <li className="mk-dropdown">
            <button
                type="button"
                className={`mk-link ${hasActive ? "is-active" : ""}`}
                aria-expanded={isOpen}
                onClick={() => setOpenId(isOpen ? null : id)}
            >
                {label}
                <KeyboardArrowDownIcon fontSize="small" />
            </button>
            {isOpen && (
                <div className="mk-dropdown__menu">
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
            )}
        </li>
    );
}

function Navbar() {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const [openId, setOpenId] = React.useState(null);
    const [menuAberto, setMenuAberto] = React.useState(false);
    const [busca, setBusca] = React.useState("");
    const ref = React.useRef(null);

    React.useEffect(() => {
        setOpenId(null);
        setMenuAberto(false);
    }, [pathname]);

    React.useEffect(() => {
        const fechar = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpenId(null);
        };
        document.addEventListener("mousedown", fechar);
        return () => document.removeEventListener("mousedown", fechar);
    }, []);

    const buscar = (e) => {
        e.preventDefault();
        const termo = busca.trim();
        navigate(termo ? `/listagem-produtos?busca=${encodeURIComponent(termo)}` : "/listagem-produtos");
    };

    const semRota = (e) => e.preventDefault();

    return (
        <nav className="mk-navbar" ref={ref}>
            <Link to="/" className="mk-brand" aria-label="Início">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M8 24 L20 4" />
                    <path d="M13 26 L25 10" />
                </svg>
            </Link>

            <form className="mk-search" onSubmit={buscar} role="search">
                <input
                    type="search"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar produtos, marcas e muito mais..."
                    aria-label="Buscar produtos"
                />
                <button type="submit" aria-label="Buscar">
                    <SearchIcon fontSize="small" />
                </button>
            </form>

            <button
                type="button"
                className="mk-toggle"
                aria-label="Abrir menu"
                aria-expanded={menuAberto}
                onClick={() => setMenuAberto((v) => !v)}
            >
                <MenuIcon />
            </button>

            <ul className={`mk-links ${menuAberto ? "is-open" : ""}`}>
                <li>
                    <Link
                        to="/listagem-categorias"
                        className={`mk-link ${pathname === "/listagem-categorias" ? "is-active" : ""}`}
                    >
                        Categorias
                    </Link>
                </li>
                <Dropdown id="listagens" label="Listagens" items={LISTAGENS} openId={openId} setOpenId={setOpenId} pathname={pathname} />
                <Dropdown id="cadastros" label="Cadastros" items={CADASTROS} openId={openId} setOpenId={setOpenId} pathname={pathname} />
                <li>
                    <a href="#carrinho" className="mk-link" onClick={semRota} aria-label="Carrinho">
                        <ShoppingCartOutlinedIcon fontSize="small" />
                    </a>
                </li>
                <li>
                    <a href="#entrar" className="mk-link" onClick={semRota}>
                        Entrar <PersonOutlineIcon fontSize="small" />
                    </a>
                </li>
            </ul>
        </nav>
    );
}

export default Navbar;
