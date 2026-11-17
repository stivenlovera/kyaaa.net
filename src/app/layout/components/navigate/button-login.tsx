import { FaUserCircle } from "react-icons/fa";
import { LoginLink } from '@/src/app/components/login-link'
import { useTranslations } from "next-intl";

export const ButtonLogin = () => {
    const t = useTranslations('header.menu')
    return (
        <LoginLink className="btn-primary">
            <div className='flex flex-row'>
                <FaUserCircle size={25} color="white" />
                <p className='px-2'>{t('inciar_sesion')}</p>
            </div>
        </LoginLink>
    )
}
