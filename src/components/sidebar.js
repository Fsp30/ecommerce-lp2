import React from "react";
import { Link, useLocation } from "react-router-dom";

const SECOES = [
    {
        titulo: "Explorar",
        itens: [
            { href: "/listagem-produtos", label: "Produtos", icone: "🛍️" },
            { href: "/listagem-categorias", label: "Categorias", icone: "🏷️" },
        ],
    },
    {
        titulo: "Minha loja",
        itens: [
            { href: "/cadastro-produto", label: "Cadastrar Produto", icone: "➕" },
            { href: "/pedidos-recebidos", label: "Pedidos Recebidos", icone: "📑" },
        ],
    },
    {
        titulo: "Minha conta",
        itens: [
            { href: "/meus-pedidos", label: "Meus Pedidos", icone: "📦" },
            { href: "/mensagens", label: "Mensagens", icone: "💬" },
            { href: "/notificacoes", label: "Notificações", icone: "🔔" },
        ],
    },
];

export default function Sidebar({ aberta, onFechar }) {
    const { pathname } = useLocation();

    React.useEffect(() => {
        if (!aberta) return undefined;

        const aoPressionarEsc = (e) => {
            if (e.key === "Escape") onFechar();
        };

        document.addEventListener("keydown", aoPressionarEsc);
        return () => document.removeEventListener("keydown", aoPressionarEsc);
    }, [aberta, onFechar]);

    return (
        <>
            <div
                className={`mk-sidebar-overlay ${aberta ? "is-open" : ""}`}
                onClick={onFechar}
                aria-hidden="true"
            />

            <aside
                className={`mk-sidebar ${aberta ? "is-open" : ""}`}
                aria-label="Menu lateral"
                aria-hidden={!aberta}
            >
                <div className="mk-sidebar__head">
                    <span className="mk-sidebar__brand">MARKETPLACE</span>
                    <button
                        type="button"
                        className="mk-sidebar__close"
                        aria-label="Fechar menu"
                        onClick={onFechar}
                        tabIndex={aberta ? 0 : -1}
                    >
                        ✕
                    </button>
                </div>

                <nav>
                    {SECOES.map((secao) => (
                        <div className="mk-sidebar__section" key={secao.titulo}>
                            <p className="mk-sidebar__title">{secao.titulo}</p>

                            {secao.itens.map((item) => (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    className={`mk-sidebar__link ${
                                        pathname === item.href ? "is-active" : ""
                                    }`}
                                    tabIndex={aberta ? 0 : -1}
                                >
                                    <span aria-hidden="true">{item.icone}</span>
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    ))}
                </nav>
            </aside>
        </>
    );
}
