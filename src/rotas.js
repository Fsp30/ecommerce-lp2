import React from 'react';

import { Route, Routes, BrowserRouter } from 'react-router-dom';
import Listagem from './view/cadastro-cliente.js';

function Rotas(props) {
  return (
    <BrowserRouter>
      <Routes>
  
        <Route
          path='/listagem-cliente'
          element={<Listagem />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default Rotas;