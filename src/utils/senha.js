export function termosDe(...textos) {
    return textos
        .flatMap((t) => String(t ?? "").toLowerCase().split(/[^a-z0-9à-ú]+/i))
        .filter((t) => t.length >= 3);
}

export function regrasSenha(senha = "", termos = []) {
    const minusculas = senha.toLowerCase();

    return [
        {
            rotulo: "8 a 16 caracteres",
            ok: senha.length >= 8 && senha.length <= 16,
        },
        {
            rotulo: "Maiúscula e minúscula",
            ok: /[a-z]/.test(senha) && /[A-Z]/.test(senha),
        },
        {
            rotulo: "Ao menos 1 número",
            ok: /\d/.test(senha),
        },
        {
            rotulo: "Sem dados pessoais",
            ok: senha.length > 0 && !termos.some((t) => minusculas.includes(t)),
        },
    ];
}

export const senhaValida = (senha, termos) =>
    regrasSenha(senha, termos).every((r) => r.ok);