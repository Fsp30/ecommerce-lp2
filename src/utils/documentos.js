export const soDigitos = (valor) => String(valor ?? "").replace(/\D/g, "");

export function formatarCpf(valor) {
    const d = soDigitos(valor);
    return d.length === 11 ? d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : String(valor ?? "");
}

export function formatarCnpj(valor) {
    const d = soDigitos(valor);
    return d.length === 14 ? d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5") : String(valor ?? "");
}