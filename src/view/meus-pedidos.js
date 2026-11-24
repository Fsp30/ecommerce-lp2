import React from "react";
import { Link } from "react-router-dom";

import PageHeader from "../components/page-header";
import { mensagemErro } from "../components/toastr";
import { listar } from "../utils/api";

export default function SeletorPedidos() {
    const [clientes, setClientes] = React.useState(null);

    React.useEffect(() => {
        listar("clientes")
            .then(setClientes)
            .catch(() => {
                mensagemErro("Erro ao carregar os clientes.");
                setClientes([]);
            });
    }, []);

    if (clientes === null) {
        return <div className="text-center my-4">Carregando clientes...</div>;
    }

    return (
        <>
            <PageHeader trail={["Minha conta", "Pedidos"]} title="Pedidos por Cliente" />
            <div className="mk-orders">
                {clientes.map((c) => (
                    <Link key={c.id} to={`/clientes/${c.id}/pedidos`} className="mk-order mk-order--link">
                        <div className="mk-order__body">
                            <strong>{c.nomeCompleto}</strong>
                            <small>Cliente #{c.id}</small>
                        </div>
                    </Link>
                ))}
            </div>
        </>
    );
}