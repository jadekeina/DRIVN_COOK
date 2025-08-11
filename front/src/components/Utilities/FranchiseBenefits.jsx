import TiltedCard from "../ReactsBits/TiltedCard";
import Camion from "../../assets/HomeAssets/camion.svg";
import Graphique from "../../assets/HomeAssets/graphique.svg";
import Stock from "../../assets/HomeAssets/stock.svg";


export default function FranchiseBenefits() {
    const cards = [
        {
            title: "Droit d'entrée",
            description:
                "Un apport de 50 000 € pour accéder à la franchise, au matériel, et à l'accompagnement complet de Driv’n Cook.",
            image: Camion,
        },
        {
            title: "Reversement de 4%",
            description:
                "Un modèle économique simple : 4% du chiffre d'affaires est reversé pour maintenir le réseau et ses services.",
            image: Graphique,
        },
        {
            title: "Stock à 80% fourni",
            description:
                "Les entrepôts Driv’n Cook vous fournissent des produits bruts, locaux, de qualité, pour une cuisine constante.",
            image: Stock,
        },
    ];

    return (
        <section className="py-16 px-6 bg-[#fdfaf7]">
            <div className="max-w-screen-xl mx-auto text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                    Les engagements du franchisé
                </h2>
                <p className="text-gray-600">
                    Un modèle clair, transparent, pensé pour un développement maîtrisé.
                </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
                {cards.map((card, idx) => (
                    <TiltedCard key={idx} {...card} />
                ))}
            </div>
        </section>
    );
}