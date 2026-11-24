import React from "react";
import { Route, Routes, BrowserRouter, Navigate } from "react-router-dom";

import Navbar from "./components/navbar.js";
import Home from "./view/home";

import ListagemUsuarios from "./view/listagem-usuarios.js";
import ListagemEmpresas from "./view/listagem-empresa.js";
import ListagemProdutos from "./view/listagem-produtos.js";
import ListagemCategorias from "./view/listagem-categorias.js";
import ListagemCliente from "./view/listagem-cliente.js";
import ListagemCartoes from "./view/listagem-cartoes.js";

import CadastroCliente from "./view/cadastro-cliente.js";
import CadastroEmpresa from "./view/cadastro-empresa.js";
import CadastroProduto from "./view/cadastro-produto.js";
import CadastroCategoria from "./view/cadastro-categoria.js";
import CadastroCartao from "./view/cadastro-cartao.js";

import PedidosRecebidos from "./view/pedidos-recebidos.js";
import Mensagens from "./view/mensagens.js";
import Notificacoes from "./view/notificacoes.js";

import ModeracaoAvaliacoes from "./view/moderacao-avaliacoes.js";
import ModeracaoDenuncias from "./view/moderacao-denuncias.js";

import Contato from "./view/contato.js";
import Login from "./view/login.js";
import ListagemCarrinho from "./view/listagem-carrinho.js";
import CarrinhoCompra from "./view/details/carrinho-compra.js";

import ModeracaoCentral from "./view/admin/moderacao-central.js";
import LojasCatalogos from "./view/admin/lojas-catalogos.js";
import MetricasGerais from "./view/admin/metricas-gerais.js";
import GestaoUsuarios from "./view/admin/gestao-usuarios.js";
import CategoriasGlobais from "./view/admin/categorias-globais.js";
import Checkout from "./view/checkout.js";
import PedidoRegistrado from "./view/details/pedido-registrado.js";
import DetalhePedido from "./view/details/detalhe-pedidos.js";
import DetalheDenuncia from "./view/details/detalhe-denuncia.js";
import SeletorPedidos from "./view/meus-pedidos.js";
import PedidosCliente from "./view/pedidos-clientes.js";
import ReembolsosCliente from "./view/reembolso-cliente.js";
import DetalheReembolso from "./view/details/detalhe-reembolso.js";
import AvaliarProduto from "./view/details/avaliar-produto.js";
import ProdutoDetalhe from "./view/details/produto-detalhe.js";
import VitrineEmpresa from "./view/vitrine-empresa.js";
import PerfilEmpresa from "./view/perfil-empresa.js";
import PerfilCliente from "./view/perfil-cliente.js";
import { obterSessao } from "./config/sessao.js";
import GestaoEstoque from "./view/gestao-estoque.js";
import FinanceiroEmpresa from "./view/financeiro-empresa.js";
import CentralNotificacoes from "./view/central-notificacoes.js";
import ReembolsosRecebidos from "./view/reembolsos-recebidos.js";
import DenunciaProduto from "./view/denuncia-produto.js";


function PerfilRota() {
    const { tipo } = obterSessao();

    if (!tipo) return <Navigate to="/login" replace />;
    if (tipo === "ADMIN") return <Navigate to="/admin/metricas" replace />;
    return tipo === "EMPRESA" ? <PerfilEmpresa /> : <PerfilCliente />;
}

function Rotas() {
    return (
        <BrowserRouter>
            <Navbar />

            <main className="app-main">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/contato" element={<Contato />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/perfil" element={<PerfilRota />} />
                    <Route
                        path="/listagem-usuarios"
                        element={<ListagemUsuarios />}
                    />

                    <Route
                        path="/listagem-empresa"
                        element={<ListagemEmpresas />}
                    />

                    <Route
                        path="/vitrine/:idParam"
                        element={<VitrineEmpresa />}
                    />
                    <Route path="/gestao-estoque" element={<GestaoEstoque />} />

                    <Route
                        path="/listagem-produtos"
                        element={<ListagemProdutos />}
                    />
                    
                    <Route path="/produtos/:idProduto" element={<ProdutoDetalhe />} />

                    <Route
                        path="/listagem-categorias"
                        element={<ListagemCategorias />}
                    />

                    <Route
                        path="/listagem-clientes"
                        element={<ListagemCliente />}
                    />

                    <Route
                        path="/listagem-cartoes"
                        element={<ListagemCartoes />}
                    />

                    
                    <Route path="/meus-pedidos" element={<SeletorPedidos />} />
                    <Route path="/clientes/:idCliente/pedidos" element={<PedidosCliente />} />
                    <Route path="/pedidos/:idPedido" element={<DetalhePedido />} />

                    <Route
                        path="/pedidos-recebidos"
                        element={<PedidosRecebidos />}
                    />

                    <Route
                        path="/pedido-registrado/:idParam"
                        element={<PedidoRegistrado />}
                    />
                    <Route path="/financeiro" element={<FinanceiroEmpresa />} />

                    
                    <Route path="/clientes/:idCliente/reembolsos" element={<ReembolsosCliente />} />
                    <Route path="/reembolsos/:idReembolso" element={<DetalheReembolso />} />

                    
                    <Route path="/clientes/:idCliente/avaliar/:idItemPedido" element={<AvaliarProduto />}/>

                    <Route path="/mensagens" element={<Mensagens />} />
                    <Route path="/mensagens/:idParam" element={<Mensagens />} />

                    <Route path="/notificacoes" element={<Notificacoes />} />
                    <Route path="/central-notificacoes" element={<CentralNotificacoes />} />
                    <Route path="/reembolsos-recebidos" element={<ReembolsosRecebidos />} />
                    <Route
                        path="/moderacao/avaliacoes"
                        element={<ModeracaoAvaliacoes />}
                    />
                    <Route path="/denunciar/produto/:idParam" element={<DenunciaProduto />} />

                    <Route
                        path="/listagem-carrinhos"
                        element={<ListagemCarrinho />}
                    />

                    <Route
                        path="/meu-carrinho/:idParam"
                        element={<CarrinhoCompra />}
                    />

                    <Route path="/checkout/:idParam" element={<Checkout />} />

                    <Route
                        path="/moderacao/denuncias"
                        element={<ModeracaoDenuncias />}
                    />

                    <Route
                        path="/cadastro-cliente"
                        element={<CadastroCliente />}
                    />
                    <Route
                        path="/cadastro-cliente/:idParam"
                        element={<CadastroCliente />}
                    />

                    <Route
                        path="/cadastro-empresa"
                        element={<CadastroEmpresa />}
                    />

                    <Route
                        path="/cadastro-empresa/:idParam"
                        element={<CadastroEmpresa />}
                    />

                    <Route
                        path="/cadastro-produto"
                        element={<CadastroProduto />}
                    />

                    <Route
                        path="/cadastro-produto/:idParam"
                        element={<CadastroProduto />}
                    />

                    <Route
                        path="/cadastro-categorias"
                        element={<CadastroCategoria />}
                    />

                    <Route
                        path="/cadastro-categorias/:idParam"
                        element={<CadastroCategoria />}
                    />

                    <Route
                        path="/cadastro-cartao"
                        element={<CadastroCartao />}
                    />

                    <Route
                        path="/admin/moderacao"
                        element={<ModeracaoCentral />}
                    />

                    <Route path="/admin/lojas" element={<LojasCatalogos />} />

                    <Route
                        path="/admin/metricas"
                        element={<MetricasGerais />}
                    />

                    <Route
                        path="/admin/usuarios"
                        element={<GestaoUsuarios />}
                    />

                    <Route
                        path="/admin/categorias"
                        element={<CategoriasGlobais />}
                    />

                    <Route
                        path="/admin/moderacao/denuncia/:idParam"
                        element={<DetalheDenuncia />}
                    />
                </Routes>
            </main>
        </BrowserRouter>
    );
}

export default Rotas;
