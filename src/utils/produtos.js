import { listar, porId } from "./api";

const PARCELAS_MAX = 10;

function promocaoAtiva(p) {
    if (p.precoPromocional == null) return false;
    const h = new Date().toISOString().slice(0, 10);
    if (p.dataPromocaoInicio && h < p.dataPromocaoInicio) return false;
    if (p.dataPromocaoFim && h > p.dataPromocaoFim) return false;
    return true;
}

export { PARCELAS_MAX };

export async function buscarProdutoDetalhe(idProduto) {
    const [produtos, empresas, avaliacoes, clientes] = await Promise.all([
        listar("produtos"),
        listar("empresas"),
        listar("avaliacoes"),
        listar("clientes"),
    ]);

    const produto = produtos.find((p) => String(p.id) === String(idProduto));
    if (!produto) return null;

    const empresa = porId(empresas).get(String(produto.empresa)) ?? null;
    const clientesPorId = porId(clientes);

    const avaliacoesDoProduto = avaliacoes
        .filter((a) => String(a.idProduto) === String(produto.id) && a.status === "PUBLICADA")
        .sort((a, b) => (b.data ?? "").localeCompare(a.data ?? ""))
        .map((a) => ({
            ...a,
            nota: Number(a.nota) || 0,
            autor: clientesPorId.get(String(a.idCliente))?.nomeCompleto ?? "Cliente",
            compraVerificada: a.idItemPedido != null,
            fotos: (Array.isArray(a.fotos) ? a.fotos : []).filter(Boolean),
        }));

    const total = avaliacoesDoProduto.length;
    const notaMedia = total
        ? avaliacoesDoProduto.reduce((soma, a) => soma + a.nota, 0) / total
        : Number(produto.notaMedia) || 0;
    const recomendacao = total
        ? Math.round((avaliacoesDoProduto.filter((a) => a.recomenda).length * 100) / total)
        : Number(produto.percentualRecomendacao) || 0;

    const emPromocao = promocaoAtiva(produto);
    const fotos = (Array.isArray(produto.fotos) ? produto.fotos : [produto.fotos]).filter(Boolean);

    return {
        ...produto,
        fotos,
        empresaNome: empresa?.nomeFantasia ?? "—",
        empresaDescricao: empresa?.descricao ?? "",
        avaliacoes: avaliacoesDoProduto,
        totalAvaliacoes: total,
        notaMedia,
        recomendacao,
        emPromocao,
        preco: emPromocao ? Number(produto.precoPromocional) : Number(produto.preco),
        precoOriginal: emPromocao ? Number(produto.preco) : null,
        disponivel: Math.max(0, (Number(produto.estoqueQuantidade) || 0) - (Number(produto.estoqueReservado) || 0)),
        usado: String(produto.condicao).toUpperCase() === "USADO",
    };
}