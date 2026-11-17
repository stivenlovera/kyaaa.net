"use client"
import { useState } from "react";
import { FormLogin } from "./form-login";
import { FormRegister } from "./form-register";

interface TabAuthProps {
    /** Ruta a la que volver tras iniciar sesión o registrarse (`?next=`). */
    next?: string
    /** Abrir directamente la pestaña de registro (`?tab=register`). */
    register?: boolean
}

export const TabAuth = ({ next, register = false }: TabAuthProps) => {

    const [activeTab, setActiveTab] = useState(register ? 1 : 0);

    const tabs = [
        { index: 0, title: 'INICIAR SESION', content: 'Contenido de la pestaña 1' },
        { index: 1, title: 'REGISTRARSE', content: 'Contenido de la pestaña 2' }
    ];

    return (
        <div className="card">
            {/* Cabecera de Pestañas */}
            <div className="flex">
                {tabs.map((tab) => (
                    <button
                        key={tab.index}
                        onClick={() => setActiveTab(tab.index)}
                        className={`w-full py-2 px-4 text-sm font-medium transition-colors duration-200 ${activeTab === tab.index
                            ? 'border-b-2 border-blue-500 text-blue-600'
                            : ' hover:text-gray-700'}`}
                    >
                        {tab.title}
                    </button>
                ))}
            </div>

            {/* Panel de Contenido */}
            <div className="p-5 mt-2 rounded-lg shadow">
                {tabs[activeTab].index === 0 ? (<FormLogin next={next}></FormLogin>) : (<FormRegister next={next}></FormRegister>)}
            </div>
        </div>
    )
}
