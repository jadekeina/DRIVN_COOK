import Header from "../components/headers/Header";
import productImage from "../assets/HomeAssets/camion.svg"; // mets l’image dans `src/assets` avec ce nom
import FranchiseBenefits from "../components/Utilities/FranchiseBenefits";

function Home() {
  return (
    <div className="bg-white  min-h-screen py-10 px-4">
      <div className="bg-[#fdfaf7] mx-auto rounded-3xl shadow-xl overflow-hidden">
        <Header />

        <section className="grid md:grid-cols-2 gap-10 items-center p-8 md:p-20">
          {/* Left text block */}

          <div className="space-y-6 bg-[#FFA9A3]/20 h-[30em] flex flex-col justify-center items-center rounded-2xl w-[45em] px-10">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900">
              It's time to grow <br />
              brush <span className="text-[#5C95FF]">better.</span>
            </h1>
            <p className="text-gray-700 text-lg">
              Bienvenue sur votre espace franchisé Driv’n Cook : accédez à vos
              outils de gestion, suivez vos performances, gérez votre stock et
              votre parc de camions en toute autonomie.
            </p>
            <button className="bg-[#5C95FF] hover:bg-[#FFA9A3] text-white px-6 py-3 rounded-full font-semibold">
              Nous Rejoindre !
            </button>
          </div>

          {/* Product image block */}
          <div className="relative">
            <img
              src={productImage}
              alt="Bite product"
              className="w-full max-w-md mx-auto"
            />
          </div>
        </section>

        <FranchiseBenefits />

        {/* Logos */}
        <div className="flex flex-wrap justify-center gap-8 py-12 border-t mt-20 px-8">
          {[
            "Forbes",
            "The Oprah Magazine",
            "COSMOPOLITAN",
            "ELLE",
            "goop",
            "VOGUE",
            "Women'sHealth",
            "People",
          ].map((brand, index) => (
            <span key={index} className="text-gray-500 font-semibold text-sm">
              {brand}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;
