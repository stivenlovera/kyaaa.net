"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { FaBan, FaCheck, FaQuestion, FaInfo } from "react-icons/fa";

interface AlertProp {
    message: string
    open: boolean
    icon: "success" | "warning" | "danger" | "info"
}

interface AlertContextType {
    alert: AlertProp
    setAlert: (value: AlertProp) => void
}

// 1. Create the context
const AlertContext = createContext<AlertContextType | undefined>(undefined);

// 2. Create the provider component
export default function AlertProvider({ children }: { children: React.ReactNode }) {
    const [alert, setAlert] = useState<AlertProp>({ icon: "info", message: "", open: false })

    useEffect(() => {
        const timer = setTimeout(() => {
            setAlert({ ...alert, open: false })
        }, 3000);

        // Cleanup: runs if component unmounts or before the effect re-runs
        return () => clearTimeout(timer);
    }, [alert.open]);

    return (
        <AlertContext.Provider value={{ alert, setAlert }}>
            {alert.open ? (<div
                className="fixed inset-0 z-40 w-screen h-dvh bg-dark-600/50 flex items-center justify-center backdrop-blur-sm p-5"
                onClick={() => { setAlert({ ...alert, open: false }) }}
            >
                <div className="bg-neutral-800 p-4 rounded-lg shadow-lg relative max-w-md w-full" >
                    {/* <button
                        onClick={() => { setOpenAlert(false) }}
                        className="btn-primary-icon absolute top-4 right-4 rounded-full"
                    >
                        <FaTimes size={20} color="white" className='' />
                    </button> */}
                    <div
                        onClick={((event) => {
                            event.preventDefault();
                            event.stopPropagation();
                        })}>
                        <div className="p-4">
                            <div className='flex justify-center items-center '>
                                {alert.icon === "success" ? (<FaCheck size={60} color="white" className='' />) : (<></>)}
                                {alert.icon === "warning" ? (<FaQuestion size={60} color="white" className='' />) : (<></>)}
                                {alert.icon === "danger" ? (<FaBan size={60} color="white" className='' />) : (<></>)}
                                {alert.icon === "info" ? (<FaInfo size={60} color="white" className='' />) : (<></>)}
                            </div>
                            <div className="py-6 text-center wrap-break-word">
                                {alert.message.toLocaleUpperCase()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>) : (<></>)}

            {children}
        </AlertContext.Provider>
    );
}

// 3. Create a custom hook for easy consumption

export const useAlert = () => {
    const context = useContext(AlertContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
