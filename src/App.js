import React from 'react';
import 'bootswatch/dist/flatly/bootstrap.css';
import 'toastr/build/toastr.min';
import 'toastr/build/toastr.css';
import './custom.css'; // deve vir depois do bootswatch para sobrescrever o tema

import Rotas from './rotas.js';

function App() {
  return <Rotas />;
}

export default App;
