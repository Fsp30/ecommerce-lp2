
import React from "react";
import { Route, Routes, BrowserRouter } from "react-router-dom";

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

import MeusPedidos from "./view/meus-pedidos.js";
import PedidosRecebidos from "./view/pedidos-recebidos.js";
import Mensagens from "./view/mensagens.js";
import Notificacoes from "./view/notificacoes.js";

import ModeracaoAvaliacoes from "./view/moderacao-avaliacoes.js";
import ModeracaoDenuncias from "./view/moderacao-denuncias.js";

import Contato from "./view/contato.js"
import Login from "./view/login.js";
import ListagemCarrinho from "./view/listagem-carrinho.js";
import CarrinhoCompra from "./view/details/carrinho-compra.js";

import ModeracaoCentral from "./view/admin/moderacao-central.js";
import LojasCatalogos from "./view/admin/lojas-catalogos.js";
import MetricasGerais from "./view/admin/metricas-gerais.js";
import GestaoUsuarios from "./view/admin/gestao-usuarios.js";
import CategoriasGlobais from "./view/admin/categorias-globais.js";

function Rotas() {
    return (
        <BrowserRouter>
            <Navbar />

            <main className="app-main">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/contato" element={<Contato />} />
                    <Route path="/login" element={<Login />} />
                    <Route
                        path="/listagem-usuarios"
                        element={<ListagemUsuarios />}
                    />

                    <Route
                        path="/listagem-empresa"
                        element={<ListagemEmpresas />}
                    />

                    <Route
                        path="/listagem-produtos"
                        element={<ListagemProdutos />}
                    />

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

                    <Route
                        path="/meus-pedidos"
                        element={<MeusPedidos />}
                    />

                    <Route
                        path="/pedidos-recebidos"
                        element={<PedidosRecebidos />}
                    />

                    <Route
                        path="/mensagens"
                        element={<Mensagens />}
                    />

                    <Route
                        path="/notificacoes"
                        element={<Notificacoes />}
                    />

                    <Route
                        path="/moderacao/avaliacoes"
                        element={<ModeracaoAvaliacoes />}
                    />

                    <Route
                        path="/listagem-carrinhos"
                        element={<ListagemCarrinho />}
                    />

                    <Route
                        path="/carrinho-compra/:idParam"
                        element={<CarrinhoCompra />}
                    />
                    
                    <Route
                        path="/moderacao/denuncias"
                        element={<ModeracaoDenuncias />}
                    />

                    <Route
                        path="/cadastro-cliente"
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

                    <Route
                        path="/admin/lojas"
                        element={<LojasCatalogos />} 
                    />

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
                    
                </Routes>
            </main>
        </BrowserRouter>
    );
}

export default Rotas;
