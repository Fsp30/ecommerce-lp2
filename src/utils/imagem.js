export const TIPOS_IMAGEM = ["image/jpeg", "image/png", "image/webp", "image/avif"];
export const TAMANHO_MAX_IMAGEM = 5 * 1024 * 1024;

export function lerImagem(arquivo) {
    return new Promise((resolve, reject) => {
        if (!TIPOS_IMAGEM.includes(arquivo.type)) {
            reject(new Error("Formato não suportado. Use JPG, PNG, WebP ou AVIF."));
            return;
        }
        if (arquivo.size > TAMANHO_MAX_IMAGEM) {
            reject(new Error("A imagem deve ter no máximo 5MB."));
            return;
        }

        const leitor = new FileReader();
        leitor.onload = () => resolve(leitor.result);
        leitor.onerror = () => reject(new Error("Erro ao ler a imagem."));
        leitor.readAsDataURL(arquivo);
    });
}