export const ROTULO_STATUS_PEDIDO = {
    PEDIDO_CONFIRMADO: "Pedido confirmado",
    EM_SEPARACAO: "Em separação",
    EM_PREPARACAO: "Em preparação",
    ENVIADO: "Enviado",
    ENTREGUE: "Entregue",
    SEM_SUBPEDIDOS: "Sem subpedidos",
};

export const ORDEM_STATUS_PEDIDO = {
    PEDIDO_CONFIRMADO: 0,
    EM_SEPARACAO: 1,
    EM_PREPARACAO: 1,
    ENVIADO: 2,
    ENTREGUE: 3,
};

export const rotuloStatus = (status) => ROTULO_STATUS_PEDIDO[status] ?? status ?? "—";

export function formatarMoeda(valor) {
    return (valor ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Datas só com dia (aaaa-mm-dd) são lidas como horário local para não voltar um dia.
export function formatarData(valor) {
    if (!valor) return "—";
    const data = new Date(valor.length === 10 ? `${valor}T00:00:00` : valor);
    return data.toLocaleDateString("pt-BR");
}

export function formatarDataHora(valor) {
    if (!valor) return "—";
    return new Date(valor).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function resumir(texto, limite = 80) {
    if (!texto) return "—";
    return texto.length > limite ? `${texto.slice(0, limite)}…` : texto;
}

export const hoje = () => new Date().toISOString().slice(0, 10);