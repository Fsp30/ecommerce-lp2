import { norm, dist } from "./search/search-fix";

const MIN_FUZZY = 3;

function pontuar(q, nome) {
    const n = norm(String(nome ?? ""));
    if (!n) return null;

    if (n === q) return 0;
    if (n.startsWith(q)) return 1;
    if (n.includes(q)) return 2;
    if (q.length < MIN_FUZZY) return null;
    
    const limiteNome = Math.max(1, Math.floor(n.length * 0.25));
    const distNome = dist(q, n);
    let melhor = distNome <= limiteNome ? distNome : null;

    for (const palavra of n.split(/\s+/)) {
        const limitePalavra = Math.max(1, Math.floor(palavra.length * 0.3));
        const d = dist(q, palavra);
        if (d <= limitePalavra && (melhor === null || d < melhor)) melhor = d;
    }

    return melhor === null ? null : 3 + melhor;
}

function itensDoCatalogo({ produtos = [], empresas = [] }) {
    return [
        ...produtos
            .filter((p) => p.status === "ATIVO")
            .map((p) => ({ href: `/produtos/${p.id}`, nome: p.titulo, tipo: "produto" })),
        ...empresas
            .filter((e) => e.status === "ATIVO")
            .map((e) => ({ href: `/vitrine/${e.id}`, nome: e.nomeFantasia, tipo: "loja" })),
    ];
}

export function resolverBusca(termo, catalogo = {}) {
    const q = norm(String(termo ?? ""));
    if (!q) return null;

    let melhor = null;
    let empate = false;

    for (const c of itensDoCatalogo(catalogo)) {
        const s = pontuar(q, c.nome);
        if (s === null) continue;

        if (melhor === null || s < melhor.s) {
            melhor = { href: c.href, s };
            empate = false;
        } else if (s === melhor.s) {
            empate = true;
        }
    }

    return melhor && !empate ? melhor : null;
}

export function sugerirEntidades(termo, catalogo = {}, k = 4) {
    const q = norm(String(termo ?? ""));
    if (q.length < 2) return [];

    return itensDoCatalogo(catalogo)
        .map((it) => ({ ...it, s: pontuar(q, it.nome) }))
        .filter((it) => it.s !== null)
        .sort((a, b) => a.s - b.s)
        .slice(0, k)
        .map(({ s, ...resto }) => resto);
}