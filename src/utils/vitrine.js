import { formatarMoeda } from "./formatar";

const hojeISO = () => new Date().toISOString().slice(0, 10);

const numero = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};

export function idEmpresaDo(produto) {
    const valor =
        typeof produto.empresa === "object" && produto.empresa !== null
            ? produto.empresa.id
            : produto.empresa;
    return String(valor);
}

export function promocaoAtiva(produto, hoje = hojeISO()) {
    if (produto.precoPromocional == null || produto.precoPromocional === "") return false;
    if (produto.dataPromocaoInicio && hoje < produto.dataPromocaoInicio) return false;
    if (produto.dataPromocaoFim && hoje > produto.dataPromocaoFim) return false;
    return true;
}

export function precoAtual(produto) {
    return promocaoAtiva(produto) ? numero(produto.precoPromocional) : numero(produto.preco);
}

export function descontoDe(produto) {
    if (!promocaoAtiva(produto) || numero(produto.preco) === 0) return 0;
    return 1 - numero(produto.precoPromocional) / numero(produto.preco);
}

export function parcelasDe(preco) {
    return Math.min(12, Math.floor(preco / 50));
}

export function avaliacaoDaEmpresa(avaliacoes, idEmpresa) {
    const notas = avaliacoes
        .filter(
            (a) =>
                String(a.idEmpresa) === String(idEmpresa) &&
                !a.idProduto &&
                a.status === "PUBLICADA"
        )
        .map((a) => numero(a.nota));

    if (notas.length === 0) return { media: null, total: 0 };

    return {
        media: notas.reduce((soma, n) => soma + n, 0) / notas.length,
        total: notas.length,
    };
}

export function contarAvaliacoesPorProduto(avaliacoes) {
    const mapa = new Map();
    for (const a of avaliacoes) {
        if (!a.idProduto || a.status !== "PUBLICADA") continue;
        const chave = String(a.idProduto);
        mapa.set(chave, (mapa.get(chave) ?? 0) + 1);
    }
    return mapa;
}

export function vendasDaEmpresa(subpedidos, idEmpresa) {
    return subpedidos.filter(
        (s) => String(s.idEmpresa) === String(idEmpresa) && s.statusPagamento === "PAGO"
    ).length;
}

export function vendasPorProduto(itensPedido, subpedidos) {
    const pagos = new Set(
        subpedidos.filter((s) => s.statusPagamento === "PAGO").map((s) => String(s.id))
    );

    const mapa = new Map();
    for (const item of itensPedido) {
        if (!pagos.has(String(item.idSubpedido))) continue;
        const chave = String(item.idProduto);
        mapa.set(chave, (mapa.get(chave) ?? 0) + numero(item.quantidade));
    }
    return mapa;
}

export const OPCOES_ORDENACAO = [
    { chave: "mais-vendidos", rotulo: "Mais Vendidos" },
    { chave: "lancamentos", rotulo: "Lançamentos" },
    { chave: "ofertas", rotulo: "Ofertas" },
    { chave: "menor-preco", rotulo: "Menor Preço" },
];

export function ordenarProdutos(produtos, chave) {
    const lista = [...produtos];

    switch (chave) {
        case "lancamentos":
            return lista.sort((a, b) =>
                String(b.dataCadastro ?? "").localeCompare(String(a.dataCadastro ?? ""))
            );

        case "ofertas":
            return lista
                .filter((p) => promocaoAtiva(p))
                .sort((a, b) => descontoDe(b) - descontoDe(a));

        case "menor-preco":
            return lista.sort((a, b) => precoAtual(a) - precoAtual(b));

        default:
            return lista.sort((a, b) => (b.vendas ?? 0) - (a.vendas ?? 0));
    }
}

export { formatarMoeda };