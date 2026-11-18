'use client'
import { useState } from 'react'
import moment from 'moment'
import { FaPen, FaPlus, FaTrash } from 'react-icons/fa6'
import { useRouter } from '@/src/i18n/navigation'
import { IAdminCharacter } from '@/src/app/types/character.types'
import { DialogCharacterForm } from './dialog-character-form'
import { DialogDeleteCharacter } from './dialog-delete-character'

interface CharacterListProps {
    characters: IAdminCharacter[]
}

export const CharacterList = ({ characters }: CharacterListProps) => {
    const router = useRouter()
    const [editingCharacter, setEditingCharacter] = useState<IAdminCharacter | null | undefined>(undefined)
    const [deletingCharacter, setDeletingCharacter] = useState<IAdminCharacter | null>(null)

    const refresh = () => { router.refresh() }

    return (
        <div>
            <div className='flex justify-end pb-3'>
                <button
                    className='btn-primary flex'
                    type='button'
                    onClick={() => { setEditingCharacter(null) }}
                >
                    <FaPlus /> Crear personaje
                </button>
            </div>
            <div className='overflow-x-auto'>
                <table className='w-full text-left'>
                    <thead>
                        <tr className='border-b border-neutral-700'>
                            <th className='p-2'>Nombre</th>
                            <th className='p-2'>Slug</th>
                            <th className='p-2'>Estado</th>
                            <th className='p-2'>Actualizado</th>
                            <th className='p-2'></th>
                        </tr>
                    </thead>
                    <tbody>
                        {characters.length === 0 ? (
                            <tr>
                                <td className='p-2' colSpan={5}>No hay personajes registrados.</td>
                            </tr>
                        ) : characters.map((character) => (
                            <tr key={character.character_id} className='border-b border-neutral-800'>
                                <td className='p-2'>{character.name}</td>
                                <td className='p-2'>{character.slug}</td>
                                <td className='p-2'>{character.state === 1 ? 'Activo' : 'Inactivo'}</td>
                                <td className='p-2'>{character.update_at ? moment(character.update_at).format('DD/MM/yyyy hh:mm') : ''}</td>
                                <td className='p-2'>
                                    <div className='flex justify-end gap-2'>
                                        <button
                                            className='btn-primary-icon'
                                            type='button'
                                            aria-label='Editar'
                                            onClick={() => { setEditingCharacter(character) }}
                                        >
                                            <FaPen />
                                        </button>
                                        <button
                                            className='btn-primary-icon text-red-500'
                                            type='button'
                                            aria-label='Eliminar'
                                            onClick={() => { setDeletingCharacter(character) }}
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <DialogCharacterForm
                open={editingCharacter !== undefined}
                character={editingCharacter}
                onClose={() => { setEditingCharacter(undefined) }}
                onSaved={refresh}
            />
            <DialogDeleteCharacter
                open={deletingCharacter !== null}
                character={deletingCharacter}
                onClose={() => { setDeletingCharacter(null) }}
                onDeleted={refresh}
            />
        </div>
    )
}
