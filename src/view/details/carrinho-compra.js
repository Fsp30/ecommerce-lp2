import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import PageHeader from "../../components/page-header";
import { mensagemErro, mensagemSucesso } from "../../components/toastr";
import { obterSessao } from "../../config/sessao";
import { BASE_URL } from "../../config/axios";
import { listar, porId } from "../../utils/api";
import { formatarMoeda } from "../../utils/formatar";

const PARCELAS_MAX = 10;
const TAXA_FRETE_PADRAO = 0;

function montarItens(itens, mapaProdutos, mapaEmpresas) {
    return itens.map((item) => {
        const produto = mapaProdutos.get(String(item.idProduto));
        const empresa = mapaEmpresas.get(String(produto?.empresa));
        const preco = Number(produto?.precoPromocional ?? produto?.preco ?? 0);
        const quantidade = Number(item.quantidade) || 1;

        return {
            id: item.id,
            idProduto: item.idProduto,
            titulo: produto?.titulo ?? "Produto indisponível",
            foto: Array.isArray(produto?.fotos) ? produto.fotos[0] : produto?.fotos,
            vendedor: empresa?.nomeFantasia ?? empresa?.razaoSocial ?? "—",
            estoque: Number(produto?.estoqueQuantidade ?? 0),
            emEstoque: Number(produto?.estoqueQuantidade ?? 0) > 0,
            freteGratis: Boolean(produto?.freteGratis),
            preco,
            quantidade,
            subtotal: preco * quantidade,
        };
    });
}

export default function CarrinhoCompra() {
    const { idParam } = useParams();
    const navigate = useNavigate();
    const { clienteId } = obterSessao();

    const [itens, setItens] = React.useState(null);
    const [cep, setCep] = React.useState("");
    const [ocupado, setOcupado] = React.useState(false);

    React.useEffect(() => {
        Promise.all([
            listar("itensCarrinho"),
            listar("produtos"),
            listar("empresas"),
            listar("clientes"),
        ])
            .then(([todosItens, produtos, empresas, clientes]) => {
                const doCarrinho = todosItens.filter(
                    (i) => String(i.idCarrinho) === String(idParam)
                );

                const cliente = porId(clientes).get(String(clienteId));
                setCep(cliente?.cep ?? "");

                setItens(
                    montarItens(doCarrinho, porId(produtos), porId(empresas))
                );
            })
            .catch(() => {
                mensagemErro("Erro ao carregar o carrinho.");
                setItens([]);
            });
    }, [idParam, clienteId]);

    const resumo = React.useMemo(() => {
        const lista = itens ?? [];
        const subtotal = lista.reduce((soma, i) => soma + i.subtotal, 0);
        const frete = lista.every((i) => i.freteGratis)
            ? 0
            : TAXA_FRETE_PADRAO;
        const total = subtotal + frete;
        const parcela = total / PARCELAS_MAX;
        const quantidadeItens = lista.reduce((soma, i) => soma + i.quantidade, 0);

        return { subtotal, frete, total, parcela, quantidadeItens };
    }, [itens]);

    async function alterarQuantidade(item, novaQuantidade) {
        if (novaQuantidade < 1) return;

        if (novaQuantidade > item.estoque) {
            mensagemErro("Quantidade maior que o estoque disponível.");
            return;
        }

        if (ocupado) return;
        setOcupado(true);

        try {
            const itemAtual = await axios.get(`${BASE_URL}/itensCarrinho/${item.id}`);
            await axios.put(`${BASE_URL}/itensCarrinho/${item.id}`, {
                ...itemAtual.data,
                quantidade: novaQuantidade,
            });
            setItens((atual) =>
                atual.map((i) =>
                    i.id === item.id
                        ? {
                              ...i,
                              quantidade: novaQuantidade,
                              subtotal: i.preco * novaQuantidade,
                          }
                        : i
                )
            );
        } catch(error) {
            console.error("PATCH itensCarrinho falhou:", error.response?.status, error.response?.data, error.config?.url);
               mensagemErro(error.response?.data || "Erro ao atualizar a quantidade.");
          
        } finally {
            setOcupado(false);
        }
    }

    async function remover(item) {
        if (ocupado) return;
        setOcupado(true);

        try {
            await axios.delete(`${BASE_URL}/itensCarrinho/${item.id}`);
            setItens((atual) => atual.filter((i) => i.id !== item.id));
            mensagemSucesso("Item removido do carrinho.");
        } catch {
            mensagemErro("Erro ao remover o item.");
        } finally {
            setOcupado(false);
        }
    }

    function fecharPedido() {
        if (!itens || itens.length === 0) {
            mensagemErro("Seu carrinho está vazio.");
            return;
        }
        navigate("/checkout");
    }

    if (itens === null) {
        return <div className="text-center my-4">Carregando carrinho...</div>;
    }

    return (
        <>
            <PageHeader
                trail={["Carrinhos", "Meu carrinho"]}
                title="Meu Carrinho de Compras"
                count={`${resumo.quantidadeItens}`}
            />

            {itens.length === 0 ? (
                <div className="mk-empty">Seu carrinho está vazio.</div>
            ) : (
                <div className="mk-cart">
                    <section className="mk-cart__items" aria-label="Itens do carrinho">
                        {itens.map((item) => (
                            <article key={item.id} className="mk-cart-item">
                                <div className="mk-cart-item__media">
                                    {item.foto ? (
                                        <img src={item.foto} alt={item.titulo} />
                                    ) : (
                                        <span>Foto WebP</span>
                                    )}
                                </div>

                                <div className="mk-cart-item__info">
                                    <h3>{item.titulo}</h3>
                                    <p className="mk-cart-item__seller">
                                        Vendido e entregue por: <strong>{item.vendedor}</strong>
                                    </p>
                                    {item.emEstoque ? (
                                        <span className="mk-cart-item__stock">✓ Em estoque</span>
                                    ) : (
                                        <span className="mk-cart-item__stock is-out">Esgotado</span>
                                    )}

                                    <div className="mk-cart-item__controls">
                                        <div className="mk-qty">
                                            <button
                                                type="button"
                                                aria-label="Diminuir quantidade"
                                                disabled={item.quantidade <= 1 || ocupado}
                                                onClick={() => alterarQuantidade(item, item.quantidade - 1)}
                                            >
                                                -
                                            </button>
                                            <span>{item.quantidade}</span>
                                            <button
                                                type="button"
                                                aria-label="Aumentar quantidade"
                                                disabled={item.quantidade >= item.estoque || ocupado}
                                                onClick={() => alterarQuantidade(item, item.quantidade + 1)}
                                            >
                                                +
                                            </button>
                                        </div>

                                        <button
                                            type="button"
                                            className="mk-cart-item__remove"
                                            disabled={ocupado}
                                            onClick={() => remover(item)}
                                        >
                                            Remover
                                        </button>
                                    </div>
                                </div>

                                <p className="mk-cart-item__price">{formatarMoeda(item.subtotal)}</p>
                            </article>
                        ))}
                    </section>

                    <aside className="mk-cart-summary" aria-label="Resumo do pedido">
                        <h2>Resumo do Pedido</h2>

                        <div className="mk-cart-summary__row">
                            <span>Subtotal dos produtos ({resumo.quantidadeItens} itens)</span>
                            <strong>{formatarMoeda(resumo.subtotal)}</strong>
                        </div>

                        <div className="mk-cart-summary__row">
                            <span>Frete{cep ? ` para CEP ${cep}` : ""}</span>
                            {resumo.frete === 0 ? (
                                <strong className="mk-ok">GRÁTIS</strong>
                            ) : (
                                <strong>{formatarMoeda(resumo.frete)}</strong>
                            )}
                        </div>

                        <div className="mk-cart-summary__total">
                            <span>Valor Total</span>
                            <div>
                                <strong>{formatarMoeda(resumo.total)}</strong>
                                <small>ou {PARCELAS_MAX}x de {formatarMoeda(resumo.parcela)} sem juros</small>
                            </div>
                        </div>

                        <button type="button" className="btn btn-warning w-100" onClick={fecharPedido}>
                            Fechar Pedido (Checkout) →
                        </button>

                        <button
                            type="button"
                            className="mk-cart-summary__back"
                            onClick={() => navigate("/listagem-produtos")}
                        >
                            ← Continuar Comprando
                        </button>
                    </aside>
                </div>
            )}
        </>
    );
}