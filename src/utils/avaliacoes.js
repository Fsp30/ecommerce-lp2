import axios from "axios";
import { BASE_URL } from "../config/axios";
import { listar } from "./api";

export const MAX_FOTOS = 3;

export async function buscarItemParaAvaliar(idCliente, idItemPedido) {
    const [itensPedido, subpedidos, pedidos, produtos, empresas, avaliacoes] = await Promise.all([
        listar("itensPedido"),
        listar("subpedidos"),
        listar("pedidos"),
        listar("produtos"),
        listar("empresas"),
        listar("avaliacoes"),
    ]);

    const item = itensPedido.find((i) => String(i.id) === String(idItemPedido));
    if (!item) return null;

    const subpedido = subpedidos.find((s) => String(s.id) === String(item.idSubpedido));
    const pedido = pedidos.find((p) => String(p.id) === String(subpedido?.idPedido));
    if (!pedido || String(pedido.idCliente) !== String(idCliente)) return null;

    const produto = produtos.find((p) => String(p.id) === String(item.idProduto));
    const empresa = empresas.find((e) => String(e.id) === String(subpedido.idEmpresa));

    const feitas = avaliacoes.filter(
        (a) => String(a.idItemPedido) === String(item.id) && String(a.idCliente) === String(idCliente)
    );

    return {
        idItemPedido: item.id,
        idProduto: item.idProduto,
        idEmpresa: subpedido.idEmpresa,
        titulo: produto?.titulo ?? "Produto indisponível",
        foto: Array.isArray(produto?.fotos) ? produto.fotos[0] : produto?.fotos,
        lojaNome: empresa?.nomeFantasia ?? "—",
        avaliouProduto: feitas.some((a) => a.idProduto != null),
        avaliouLoja: feitas.some((a) => a.idEmpresa != null),
    };
}

function arquivoParaDataUrl(arquivo) {
    return new Promise((resolve, reject) => {
        const leitor = new FileReader();
        leitor.onload = () => resolve(leitor.result);
        leitor.onerror = () => reject(leitor.error);
        leitor.readAsDataURL(arquivo);
    });
}

export async function publicarAvaliacao({
    idCliente,
    dadosItem,
    nota,
    recomenda,
    comentario,
    arquivos,
}) {
    const fotos = await Promise.all(arquivos.map(arquivoParaDataUrl));
    const data = new Date().toISOString().slice(0, 10);

    const base = {
        idCliente: Number(idCliente),
        idItemPedido: Number(dadosItem.idItemPedido),
        nota,
        recomenda,
        comentario: comentario.trim(),
        fotos,
        status: "PUBLICADA",
        data,
    };

    const alvos = [];
    if (!dadosItem.avaliouProduto) {
        alvos.push({ ...base, idProduto: Number(dadosItem.idProduto), idEmpresa: null });
    }
    if (!dadosItem.avaliouLoja) {
        alvos.push({ ...base, idProduto: null, idEmpresa: Number(dadosItem.idEmpresa) });
    }

    for (const corpo of alvos) {
        await axios.post(`${BASE_URL}/avaliacoes`, corpo, {
            headers: { "Content-Type": "application/json" },
        });
    }

    return alvos.length;
}