import { listar, porId } from "./api";

const ROTULO_STATUS_REEMBOLSO = {
    SOLICITADO: "Solicitado",
    EM_ANALISE: "Em análise",
    AGUARDANDO_RECEBIMENTO: "Aguardando recebimento",
    ESTORNADO: "Estornado",
    RECUSADO: "Recusado",
};

export { ROTULO_STATUS_REEMBOLSO };

function montar(solicitacoes, base) {
    return solicitacoes.map((s) => {
        const subpedido = base.subpedidosPorId.get(String(s.idSubpedido));
        const pedido = base.pedidosPorId.get(String(subpedido?.idPedido));

        const itens = base.itensReembolso
            .filter((ir) => String(ir.idSolicitacao) === String(s.id))
            .map((ir) => {
                const itemPedido = base.itensPedidoPorId.get(String(ir.idItemPedido));
                const produto = base.produtosPorId.get(String(itemPedido?.idProduto));
                const quantidade = Number(ir.quantidade) || 1;
                const preco = Number(itemPedido?.precoUnitario) || 0;
                return {
                    titulo: produto?.titulo ?? "Produto indisponível",
                    quantidade,
                    valor: quantidade * preco,
                };
            });

        return {
            ...s,
            idPedido: subpedido?.idPedido ?? pedido?.id,
            idCliente: pedido?.idCliente,
            subpedidoId: s.idSubpedido,
            itens,
            valor: itens.reduce((soma, i) => soma + i.valor, 0),
            qtdItens: itens.reduce((soma, i) => soma + i.quantidade, 0),
        };
    });
}

async function carregarBase() {
    const [solicitacoes, itensReembolso, subpedidos, pedidos, itensPedido, produtos] =
        await Promise.all([
            listar("solicitacoesReembolso"),
            listar("itensReembolso"),
            listar("subpedidos"),
            listar("pedidos"),
            listar("itensPedido"),
            listar("produtos"),
        ]);

    return {
        solicitacoes,
        itensReembolso,
        subpedidosPorId: porId(subpedidos),
        pedidosPorId: porId(pedidos),
        itensPedidoPorId: porId(itensPedido),
        produtosPorId: porId(produtos),
    };
}

export async function listarReembolsosDoCliente(idCliente) {
    const base = await carregarBase();
    const todas = montar(base.solicitacoes, base);

    return todas
        .filter((r) => String(r.idCliente) === String(idCliente))
        .sort((a, b) => (b.dataSolicitacao ?? "").localeCompare(a.dataSolicitacao ?? ""));
}

export async function buscarReembolso(idSolicitacao) {
    const base = await carregarBase();
    const solicitacao = base.solicitacoes.find((s) => String(s.id) === String(idSolicitacao));
    return solicitacao ? montar([solicitacao], base)[0] : null;
}