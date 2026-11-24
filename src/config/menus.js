const PUBLICO = [
    { href: "/listagem-produtos", label: "Produtos", icone: "🛍️" },
    { href: "/listagem-categorias", label: "Categorias", icone: "🏷️" },
    { href: "/vitrine/1", label: "Vitrine da loja", icone: "🏬" },
    { href: "/produtos/1", label: "Detalhe do produto", icone: "🔎" },
];

const unicos = (lista) => {
    const vistos = new Set();
    return lista.filter((item) => {
        if (vistos.has(item.href)) return false;
        vistos.add(item.href);
        return true;
    });
};

export function linksDoPerfil(sessao = {}) {
    const tipo = String(sessao.tipo ?? "").trim().toUpperCase();
    const clienteId = sessao.clienteId ?? 1;
    const empresaId = sessao.empresaId ?? 1;

    if (tipo === "CLIENTE") {
        return unicos([
            { href: "/perfil", label: "Meu perfil", icone: "👤" },
            { href: "/listagem-cartoes", label: "Meus cartões", icone: "💳" },
            { href: "/meus-pedidos", label: "Meus pedidos", icone: "📦" },
            { href: `/clientes/${clienteId}/pedidos`, label: "Histórico de pedidos", icone: "🧾" },
            { href: "/pedidos/1", label: "Detalhe do pedido #1", icone: "📄" },
            { href: `/clientes/${clienteId}/reembolsos`, label: "Reembolsos", icone: "↩️" },
            { href: "/reembolsos/1", label: "Detalhe do reembolso #1", icone: "💸" },
            { href: "/clientes/1/avaliar/1", label: "Avaliar produto", icone: "⭐" },
            { href: `/meu-carrinho/${clienteId}`, label: "Meu carrinho", icone: "🛒" },
            { href: `/checkout/${clienteId}`, label: "Checkout", icone: "💳" },
            { href: "/pedido-registrado/1", label: "Pedido registrado", icone: "✅" },
            { href: "/mensagens", label: "Mensagens", icone: "💬" },
            { href: "/notificacoes", label: "Notificações", icone: "🔔" },
            ...PUBLICO,
        ]);
    }

    if (tipo === "EMPRESA") {
        return unicos([
            { href: "/perfil", label: "Perfil da loja", icone: "🏬" },
            { href: `/vitrine/${empresaId}`, label: "Minha vitrine", icone: "🏪" },
            { href: "/listagem-produtos", label: "Mercado Geral", icone: "📦" },
            { href: "/cadastro-produto", label: "Cadastrar produto", icone: "➕" },
            { href: "/pedidos-recebidos", label: "Pedidos recebidos", icone: "📑" },
            { href: "/pedidos/1", label: "Detalhe do pedido #1", icone: "📄" },
            { href: "/mensagens", label: "Mensagens", icone: "💬" },
            { href: "/gestao-estoque", label: "Gestão de estoque", icone: "📦" },
            { href: "/financeiro", label: "Desempenho financeiro", icone: "📈" },
            { href: "/central-notificacoes", label: "Notificações", icone: "🔔" },
            ...PUBLICO,
        ]);
    }

    if (tipo === "ADMIN") {
        return unicos([
            { href: "/admin/metricas", label: "Métricas gerais", icone: "📊" },
            { href: "/admin/usuarios", label: "Gestão de usuários", icone: "👥" },
            { href: "/admin/lojas", label: "Lojas & catálogos", icone: "🏢" },
            { href: "/admin/categorias", label: "Categorias globais", icone: "🏷️" },
            { href: "/admin/moderacao", label: "Central de moderação", icone: "🛡️" },
            { href: "/admin/moderacao/denuncia/1", label: "Detalhe da denúncia #1", icone: "🚩" },
            { href: "/moderacao/denuncias", label: "Denúncias", icone: "🚩" },
            { href: "/moderacao/avaliacoes", label: "Avaliações", icone: "⭐" },
            { href: "/listagem-usuarios", label: "Usuários", icone: "👥" },
            { href: "/listagem-empresa", label: "Empresas", icone: "🏬" },
            { href: "/listagem-clientes", label: "Clientes", icone: "👤" },
            { href: "/listagem-carrinhos", label: "Carrinhos", icone: "🛒" },
            { href: "/cadastro-cliente", label: "Cadastrar cliente", icone: "👤" },
            { href: "/cadastro-empresa", label: "Cadastrar empresa", icone: "🏬" },
            { href: "/cadastro-categorias", label: "Cadastrar categoria", icone: "🏷️" },
            ...PUBLICO,
        ]);
    }
    return unicos(PUBLICO);
}

export function rotuloDoPerfil(sessao = {}) {
    const tipo = String(sessao.tipo ?? "").trim().toUpperCase();
    const rotulos = {
        CLIENTE: "Minha conta",
        EMPRESA: "Minha loja",
        ADMIN: "Administração",
    };
    return rotulos[tipo] ?? "Explorar";
}