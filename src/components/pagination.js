import React from "react";

export default function Pagination({ page, pages, onChange }) {
    if (pages <= 1) return null;

    return (
        <nav className="mk-pagination" aria-label="Paginação">
            <button type="button" disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Página anterior">
                ‹
            </button>
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <button
                    key={n}
                    type="button"
                    className={n === page ? "is-active" : ""}
                    aria-current={n === page ? "page" : undefined}
                    onClick={() => onChange(n)}
                >
                    {n}
                </button>
            ))}
            <button type="button" disabled={page === pages} onClick={() => onChange(page + 1)} aria-label="Próxima página">
                ›
            </button>
        </nav>
    );
}
