import React from "react";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/Delete";

export default function TabelaListagem({
    colunas,
    linhas,
    onEditar,
    onExcluir,
    renderAcoes,
    vazio = "Nenhum registro encontrado.",
}) {
    const temAcoes = Boolean(renderAcoes || onEditar || onExcluir);

    const acoesPadrao = (linha) => (
        <div className="mk-table__actions">
            {onEditar && (
                <button
                    type="button"
                    className="mk-icon-btn"
                    aria-label="Editar"
                    onClick={() => onEditar(linha.id)}
                >
                    <EditOutlinedIcon fontSize="inherit" />
                </button>
            )}
            {onExcluir && (
                <button
                    type="button"
                    className="mk-icon-btn is-danger"
                    aria-label="Excluir"
                    onClick={() => onExcluir(linha.id)}
                >
                    <DeleteOutlineIcon fontSize="inherit" />
                </button>
            )}
        </div>
    );

    return (
        <div className="mk-table-card">
            <div className="mk-table-scroll">
                <table className="mk-table">
                    <thead>
                        <tr>
                            {colunas.map((coluna) => (
                                <th key={coluna.titulo} scope="col">
                                    {coluna.titulo}
                                </th>
                            ))}
                            {temAcoes && <th scope="col">Ações</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {linhas.map((linha) => (
                            <tr key={linha.id}>
                                {colunas.map((coluna) => (
                                    <td key={coluna.titulo}>{coluna.render(linha)}</td>
                                ))}
                                {temAcoes && (
                                    <td>{renderAcoes ? renderAcoes(linha) : acoesPadrao(linha)}</td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {linhas.length === 0 && <div className="mk-table-empty">{vazio}</div>}
        </div>
    );
}