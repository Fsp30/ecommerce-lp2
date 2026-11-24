import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import LogoutIcon from "@mui/icons-material/Logout";

export default function ContaLayout({ titulo, itens, children }) {
    const { pathname } = useLocation();
    const navigate = useNavigate();

    function sair() {
        localStorage.removeItem("sessao");
        navigate("/login");
    }

    return (
        <div className="mk-conta">
            <aside className="mk-conta__menu" aria-label="Menu da conta">
                <p className="mk-conta__title">{titulo}</p>

                <nav>
                    {itens.map((item) => (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={`mk-conta__link ${pathname === item.href ? "is-active" : ""}`}
                        >
                            <span aria-hidden="true">{item.icone}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <button type="button" className="mk-conta__logout" onClick={sair}>
                    <LogoutIcon fontSize="small" />
                    Sair da Conta
                </button>
            </aside>

            <section className="mk-conta__content">{children}</section>
        </div>
    );
}