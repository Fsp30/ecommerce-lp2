import React from "react";
import { useNavigate } from "react-router-dom";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import LaptopMacOutlinedIcon from "@mui/icons-material/LaptopMacOutlined";
import CheckroomOutlinedIcon from "@mui/icons-material/CheckroomOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import BrushOutlinedIcon from "@mui/icons-material/BrushOutlined";
import SportsSoccerOutlinedIcon from "@mui/icons-material/SportsSoccerOutlined";
import AddIcon from "@mui/icons-material/Add";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import { mensagemErro } from "../components/toastr";
import ProductCard, { normalizar } from "../components/product-card";
import { listar, porId } from "../utils/api";

const LIMITE_CATEGORIAS = 6;

const BENEFICIOS = [
    { titulo: "Frete grátis", Icone: LocalShippingOutlinedIcon },
    { titulo: "Compra Garantida", Icone: ShieldOutlinedIcon },
    { titulo: "Até 12x sem juros", Icone: CreditCardOutlinedIcon },
    { titulo: "Transparência", Icone: VisibilityOutlinedIcon },
];

const ICONES = [
    ["inform", LaptopMacOutlinedIcon],
    ["eletr", LaptopMacOutlinedIcon],
    ["vestu", CheckroomOutlinedIcon],
    ["moda", CheckroomOutlinedIcon],
    ["casa", HomeOutlinedIcon],
    ["beleza", BrushOutlinedIcon],
    ["esporte", SportsSoccerOutlinedIcon],
    ["oferta", LocalOfferOutlinedIcon],
];

function iconeDe(nome = "") {
    const n = nome.toLowerCase();
    const achado = ICONES.find(([chave]) => n.includes(chave));
    return achado ? achado[1] : CategoryOutlinedIcon;
}

function ehRaiz(c) {
    const pai =
        c.categoriaPai?.id ?? c.categoriaPai ?? c.categoriaPaiId ?? c.idCategoriaPai;
    return pai === undefined || pai === null || pai === "";
}

export default function Home() {
    const navigate = useNavigate();
    const [produtos, setProdutos] = React.useState(null);
    const [categorias, setCategorias] = React.useState([]);

    React.useEffect(() => {
        Promise.all([listar("produtos"), listar("empresas"), listar("categorias")])
            .then(([prods, emps, cats]) => {
                const empresas = porId(emps);
                setProdutos(
                    prods
                        .map((p) => normalizar(p, empresas))
                        .filter((p) => p.ativo && p.disponivel)
                );
                setCategorias(cats.filter(ehRaiz));
            })
            .catch(() => {
                mensagemErro("Erro ao carregar a página inicial");
                setProdutos([]);
            });
    }, []);
    
    const { destaque, outras } = React.useMemo(() => {
        const lista = produtos ?? [];
        const promocoes = lista
            .filter((p) => p.emPromocao)
            .sort((a, b) => b.precoOriginal - b.preco - (a.precoOriginal - a.preco));
        const dia =
            promocoes[0] ??
            [...lista].sort((a, b) => (b.nota ?? 0) - (a.nota ?? 0))[0] ??
            null;
        return {
            destaque: dia,
            outras: lista.filter((p) => p !== dia).slice(0, 4),
        };
    }, [produtos]);

    return (
        <div className="mk-home">
            <section className="mk-hero">
                <div className="mk-hero__text">
                    <h1>Tudo que você precisa em um só lugar.</h1>
                    <p>Encontre produtos, ofertas e tudo o que precisa para o seu dia a dia.</p>
                    <button
                        type="button"
                        className="btn mk-hero__cta"
                        onClick={() => navigate("/produtos")}
                    >
                        Explorar produtos
                    </button>
                </div>

                <button
                    type="button"
                    className="mk-hero__banner"
                    aria-label="Super promoção de geladeiras: até 30% de desconto"
                    onClick={() => navigate("/produtos")}
                >
                    {/* copiar da bosta do figma paraq public/banner-geladeiras.webp */}
                    <img
                        src="/banner-geladeiras.webp"
                        alt="Super promoção de geladeiras com até 30% de desconto"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                </button>
            </section>

            <nav className="mk-cats" aria-label="Categorias">
                {categorias.slice(0, LIMITE_CATEGORIAS).map((c) => {
                    const Icone = iconeDe(c.nome);
                    return (
                        <button
                            key={c.id}
                            type="button"
                            className="mk-cats__item"
                            onClick={() => navigate(`/produtos?categoria=${c.id}`)}
                        >
                            <span className="mk-cats__icon">
                                <Icone fontSize="small" />
                            </span>
                            {c.nome}
                        </button>
                    );
                })}
                <button
                    type="button"
                    className="mk-cats__item"
                    onClick={() => navigate("/listagem-categorias")}
                >
                    <span className="mk-cats__icon">
                        <AddIcon fontSize="small" />
                    </span>
                    Mais
                </button>
            </nav>

            <section className="mk-benefits" aria-labelledby="mk-benefits-title">
                <h2 id="mk-benefits-title">Compre com benefícios</h2>
                <div className="mk-benefits__grid">
                    {BENEFICIOS.map(({ titulo, Icone }) => (
                        <div key={titulo} className="mk-benefits__item">
                            <strong>{titulo}</strong>
                            <Icone fontSize="large" />
                        </div>
                    ))}
                </div>
            </section>

            <section className="mk-offers" aria-label="Ofertas">
                <div className="mk-offers__panel mk-offers__panel--deal">
                    <h2>Oferta do dia</h2>
                    {destaque ? (
                        <ProductCard produto={destaque} destaque />
                    ) : (
                        <div className="mk-empty">Sem oferta no momento.</div>
                    )}
                </div>

                <div className="mk-offers__panel">
                    <h2>Outras ofertas</h2>
                    {outras.length > 0 ? (
                        <div className="mk-offers__grid">
                            {outras.map((p) => (
                                <ProductCard key={p.id} produto={p} />
                            ))}
                        </div>
                    ) : (
                        <div className="mk-empty">Nenhuma oferta disponível.</div>
                    )}
                </div>
            </section>
        </div>
    );
}