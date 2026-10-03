import React from 'react';
import { Route, Routes, BrowserRouter } from 'react-router-dom';
import ListagemUsuarios from './view/listagem-usuarios.js';
import Navbar from './components/navbar.js';

function Rotas(props) {
  return (
    <BrowserRouter>
      {/* 1. A Navbar continua fixa no topo do navegador */}
      <Navbar /> 
      
      {/* 2. Esse container vai empurrar QUALQUER página de rota para baixo */}
      <main className="container mt-5 pt-5">
        <Routes>
          <Route
            path='/listagem-usuarios'
            element={<ListagemUsuarios />}
          />
          {/* Suas próximas rotas vão aqui e já herdarão o espaçamento automaticamente:
          <Route path='/produtos' element={<ListagemProdutos />} /> 
          */}
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default Rotas;
