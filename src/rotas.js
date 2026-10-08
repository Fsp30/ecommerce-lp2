import React from "react";
import { Route, Routes, BrowserRouter } from "react-router-dom";
import Navbar from "./components/navbar.js";
import ListagemUsuarios from "./view/listagem-usuarios.js";
import ListagemEmpresas from "./view/listagem-empresa.js";
import CadastroCliente from "./view/cadastro-cliente.js";
import CadastroEmpresa from "./view/cadastro-empresa.js";
import CadastroProduto from "./view/cadastro-produto.js";
import CadastroCategoria from "./view/cadastro-categoria.js";
import CadastroCartao from "./view/cadastro-cartao.js";
import ListagemProdutos from "./view/listagem-produtos.js";
import ListagemCategorias from "./view/listagem-categorias.js";
import ListagemCliente from "./view/listagem-cliente.js";


function Rotas(props) {
    return (
        <BrowserRouter>
            <Navbar />

            <main className="container mt-5 pt-5">
                <Routes>
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
                        path="/cadastro-cliente"
                        element={<CadastroCliente />}
                    />
                    <Route
                        path="/cadastro-empresa"
                        element={<CadastroEmpresa />}
                    />
                    <Route
                        path="/cadastro-produto"
                        element={<CadastroProduto />}
                    />
                    <Route
                        path="/cadastro-categoria"
                        element={<CadastroCategoria />}
                    />
                    <Route
                        path="/listagem-cliente"
                        element={<ListagemCliente />}
                    />
                    <Route
                        path="/cadastro-cartao"
                        element={<CadastroCartao />}
                    />
                </Routes>
            </main>
        </BrowserRouter>
    );
}

export default Rotas;
