import { render } from "@testing-library/react";
import PageHeader from "../components/page-header";
import TabelaListagem from "../components/tabela-listagem";
import { mensagemSucesso, mensagemErro } from "../components/toastr";
import { BASE_URL } from "../config/axios";
import { useLocation, useNavigate } from "react-router-dom";
import React from "react";

const base_URL = `${BASE_URL}/carrinhos`
const client_URL = `${BASE_URL}/carrinhos`

const COLUNAS = [
    {titulo: "Nome cliente", render: (d) => d.nomeCliente}
]

export default function ListagemCarrinho(){
    const navigate = useNavigate()
    const location = useLocation()
    const [dados, setDados] = React.useState(null)
    const [dadosCliente, setDadosClientes] = React.useState(null)

    return(
        <h1>É rajada de fé pra cima deles</h1>
    )
}