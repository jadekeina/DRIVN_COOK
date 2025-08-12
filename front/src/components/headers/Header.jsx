import { Link } from "react-router-dom";
import UserIcon from "../../assets/HomeAssets/user_2321232.png";
import React from "react";
import ButtonCandidature from "../LittleThings/buttonCandidature.tsx";

function Header() {
  return (
    <header className="flex justify-between items-center px-8 py-4 bg-white shadow-sm">
      <div className="text-2xl font-bold">Driv'n Cook</div>
      <nav className="flex gap-8 text-gray-700 font-medium">
        <a href="#">Accueil</a>
        <a href="#">Notre Concept</a>
        <a href="#">Nous rejoindre</a>
        <a href="#">Contact</a>
      </nav>
      <div className="flex gap-4 items-center justify-center">
        <nav className="flex gap-8 text-gray-700 font-medium justify-center">
          <Link to="/candidature" className="">
            <ButtonCandidature />
          </Link>
          <a href="/login" className="text-lg self-center flex ">
            <div>
              {" "}
              <img className="w-[25px]" src={UserIcon} alt="User icon" />{" "}
            </div>
            <div> Se connecter </div>
          </a>
        </nav>
      </div>
    </header>
  );
}

export default Header;
