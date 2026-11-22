import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { listar } from "../utils/api";

const ITENS = [
    { href: "/admin/metricas", label: "Métricas Gerais", icone: "📊" },
    { href: "/admin/usuarios", label: "Gestão de Usuários", icone: "👥" },
    { href: "/admin/lojas", label: "Lojas & Catálogos", icone: "🏢" },
    { href: "/admin/categorias", label: "Categorias Globais", icone: "🏷️" },
    { href: "/admin/moderacao", label: "Moderação & Denúncias", icone: "🛡️" },
];

export default function AdminLayout({ children }) {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const [pendentes, setPendentes] = React.useState(0);

    React.useEffect(() => {
        Promise.all([listar("denuncias"), listar("avaliacoes")])
            .then(([denuncias, avaliacoes]) => {
                const abertas = denuncias.filter((d) => d.status !== "RESOLVIDA").length;
                const reportadas = avaliacoes.filter((a) => a.status === "REPORTADA").length;
                setPendentes(abertas + reportadas);
            })
            .catch(() => setPendentes(0));
    }, [pathname]);

    function sair() {
        localStorage.removeItem("sessao");
        navigate("/login");
    }

    return (
        <div className="mk-admin">
            <aside className="mk-admin__sidebar" aria-label="Menu do administrador">
                <div className="mk-admin__brand">
                    MARKETPLACE
                    <span className="mk-admin__tag">ADMIN GLOBAL</span>
                </div>

                <nav className="mk-admin__nav">
                    {ITENS.map((item) => (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={`mk-admin__link ${pathname === item.href ? "is-active" : ""}`}
                        >
                            <span aria-hidden="true">{item.icone}</span>
                            {item.label}
                            {item.href === "/admin/moderacao" && pendentes > 0 && (
                                <span className="mk-admin__count">{pendentes}</span>
                            )}
                        </Link>
                    ))}
                </nav>

                <button type="button" className="mk-admin__logout" onClick={sair}>
                    <span aria-hidden="true">🚪</span>
                    Sair do Sistema
                </button>
            </aside>

            <section className="mk-admin__content">{children}</section>
        </div>
    );
}