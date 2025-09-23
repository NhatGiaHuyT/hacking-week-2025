import { useState } from "react";
import { FaLanguage } from "react-icons/fa6";
import { PiCheckFat } from "react-icons/pi";

export default function LanguageSelector({selectedLanguage, setSelectedLanguage}: {selectedLanguage:string, setSelectedLanguage:Function}) {

  const [isActive, setIsActive] = useState(false)

  const handleSelect = (val:string) => {
    setSelectedLanguage(val)
    setIsActive(false)
  }

  return(
    <div onMouseLeave={() => setIsActive(false)}>
      <button id="dropdownDefaultButton" data-dropdown-toggle="dropdown" onClick={() => setIsActive(!isActive)}
        className="bg-brand-secondary text-black focus:bg-brand-secondary text-black focus:outline-none
       focus:bg-brand-primary font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex 
        items-center dark:focus:ring-blue-800" type="button">
        <FaLanguage size={40} />
      </button>

      {isActive ? (      
      <div id="dropdown" className="fixed translate-x-[-60%] first-line:z-10 bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700">
        <ul className="py-2 text-center text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownDefaultButton">
          <li onClick={() => handleSelect("Vietnamese")} className="flex justify-around px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
            <h3 >Vietnamese</h3>
            {selectedLanguage === "Vietnamese" ? <PiCheckFat/> : null}
          </li>
          <li onClick={() => handleSelect("English")} className="flex justify-around px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
            <h3 className="">English</h3>
            {selectedLanguage === "English" ? <PiCheckFat/> : null}
          </li>
        </ul>
      </div>) : (null)
      }

    </div>


  )
}