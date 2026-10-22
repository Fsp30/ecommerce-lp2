
export function obterSessao() {
    try {
        return JSON.parse(localStorage.getItem("sessao")) ?? {};
    } catch {
        return {};
    }
}
