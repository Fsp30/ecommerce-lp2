import { listar, porId } from "./api";
import { ORDEM_STATUS_PEDIDO } from "./formatar";

export function statusDoPedido(subpedidos) {
    if (subpedidos.length === 0) return "SEM_SUBPEDIDOS";
    if (subpedidos.every((s) => s.statusOperacional === "ENTREGUE")) return "ENTREGUE";

    return subpedidos.reduce((menor, s) =>
        (ORDEM_STATUS_PEDIDO[s.statusOperacional] ?? 0) <
        (ORDEM_STATUS_PEDIDO[menor.statusOperacional] ?? 0)
            ? s
            : menor
    ).statusOperacional;
}

async function carregarBase() {
    const [pedidos, subpedidos, itensPedido, produtos, empresas] = await Promise.all([
        listar("pedidos"),
        listar("subpedidos"),
        listar("itensPedido"),
        listar("produtos"),
        listar("empresas"),
    ]);

    return {
        pedidos,
        subpedidos,
        itensPedido,
        produtosPorId: porId(produtos),
        empresasPorId: porId(empresas),
    };
}

function montarPedido(pedido, base) {
    const subpedidos = base.subpedidos
        .filter((s) => String(s.idPedido) === String(pedido.id))
        .map((s) => {
            const itens = base.itensPedido
                .filter((i) => String(i.idSubpedido) === String(s.id))
                .map((i) => {
                    const produto = base.produtosPorId.get(String(i.idProduto));
                    const quantidade = Number(i.quantidade) || 1;
                    const preco = Number(i.precoUnitario) || 0;
                    return {
                        ...i,
                        quantidade,
                        titulo: produto?.titulo ?? "Produto indisponível",
                        foto: Array.isArray(produto?.fotos) ? produto.fotos[0] : produto?.fotos,
                        subtotal: quantidade * preco,
                    };
                });

            return {
                ...s,
                empresaNome: base.empresasPorId.get(String(s.idEmpresa))?.nomeFantasia ?? "—",
                itens,
            };
        });

    const itens = subpedidos.flatMap((s) => s.itens);

    return {
        ...pedido,
        status: statusDoPedido(subpedidos),
        subpedidos,
        itens,
        qtdItens: itens.reduce((soma, i) => soma + i.quantidade, 0),
    };
}

export async function listarPedidosDoCliente(idCliente) {
    const base = await carregarBase();

    return base.pedidos
        .filter((p) => String(p.idCliente) === String(idCliente))
        .map((p) => montarPedido(p, base))
        .sort((a, b) => (b.dataPedido ?? "").localeCompare(a.dataPedido ?? ""));
}

export async function buscarPedido(idPedido) {
    const base = await carregarBase();
    const pedido = base.pedidos.find((p) => String(p.id) === String(idPedido));
    return pedido ? montarPedido(pedido, base) : null;
}