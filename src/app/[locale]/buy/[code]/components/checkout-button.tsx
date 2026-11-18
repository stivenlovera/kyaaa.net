import { IPayPalCheckOrder } from "@/src/app/types/buy_pack.types";
import { IResponse } from "@/src/app/types/response";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface CheckoutButtonProps {
    code: string
    setThanks: (value: boolean) => void
}
export const CheckoutButton = ({ code, setThanks }: CheckoutButtonProps) => {
    const t = useTranslations('buy');
    const [error, setError] = useState<boolean>(false)
    const createOrder = async () => {
        setError(false)
        const response = await fetch("/api/buy-pack/order-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: code })
        });
        const data = await response.json() as IResponse<IPayPalCheckOrder>;
        if (!response.ok || !data.success) {
            // Sin esto el fallo llegaba como un TypeError al leer data.data.id y el usuario no veía nada.
            throw new Error(`order-payment ${response.status}: ${data.message}`)
        }
        return data.data.id; // Must return the order ID string fetched from PayPal API
    };

    const onApprove = async (data: any) => {
        const response = await fetch(`/api/buy-pack/order-capture`, {
            method: "POST",
            body: JSON.stringify({ code: code, order_id: data.orderID })
        });
        const orderData = await response.json();
        if (orderData.success === true) {
            // El modal de gracias lleva al pack (/pack/<code>) al continuar.
            setThanks(true)
        } else {
            setError(true)
        }
    };

    return (
        <>
            <PayPalButtons
                style={{ layout: "vertical", color: "black", shape: "rect", }} // Customizes UI
                createOrder={createOrder}
                onApprove={onApprove}
                onError={(err) => {
                    console.error("PayPal Checkout Error: ", err)
                    setError(true)
                }}
            />
            {error && (
                <p role="alert" className="text-center text-sm text-red-500">
                    {t('error_pago')}
                </p>
            )}
        </>
    );
}
