'use client'
import { useState } from 'react'
import { useAlert } from '@/src/providers/alertProvider'
import { IPackRelationIds } from '@/src/app/types/pack.types'
import { ILabel } from '@/src/app/types/label.types'
import { ICharacter } from '@/src/app/types/character.types'
import { ISerie } from '@/src/app/types/serie.types'
import { IAuthor } from '@/src/app/types/author.types'
import { ILanguage } from '@/src/app/types/language.types'
import { IResponse } from '@/src/app/types/response'
import API from '@/src/providers/api'

// Orden alfabético (A-Z) sin distinguir mayúsculas ni acentos, y con números en orden natural.
const byName = (a: { name: string }, b: { name: string }) =>
    a.name.localeCompare(b.name, 'es', { sensitivity: 'base', numeric: true })

interface PackRelationsFormProps {
    pack_id: number
    labels: ILabel[]
    characters: ICharacter[]
    series: ISerie[]
    authors: IAuthor[]
    languages: ILanguage[]
    selected: IPackRelationIds
}

// Sección con checkboxes para una de las cinco relaciones del pack.
const CheckboxGroup = ({
    title,
    items,
    checkedIds,
    onToggle,
}: {
    title: string
    items: { id: number, name: string }[]
    checkedIds: Set<number>
    onToggle: (id: number) => void
}) => (
    <div>
        <h3 className='font-bold pb-2'>{title}</h3>
        <div className='max-h-48 overflow-y-auto border border-neutral-700 rounded-md p-2 grid grid-cols-1 sm:grid-cols-2 gap-1'>
            {items.length === 0 ? (
                <p className='text-sm text-neutral-400'>No hay opciones registradas.</p>
            ) : [...items].sort(byName).map((item) => (
                <label key={item.id} className='flex items-center gap-2 text-sm'>
                    <input
                        type="checkbox"
                        checked={checkedIds.has(item.id)}
                        onChange={() => { onToggle(item.id) }}
                    />
                    {item.name}
                </label>
            ))}
        </div>
    </div>
)

export const PackRelationsForm = ({ pack_id, labels, characters, series, authors, languages, selected }: PackRelationsFormProps) => {
    const { setAlert } = useAlert()
    const [labelIds, setLabelIds] = useState(new Set(selected.label_ids))
    const [characterIds, setCharacterIds] = useState(new Set(selected.character_ids))
    const [serieIds, setSerieIds] = useState(new Set(selected.serie_ids))
    const [authorIds, setAuthorIds] = useState(new Set(selected.author_ids))
    const [languageIds, setLanguageIds] = useState(new Set(selected.language_ids))
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    // Alterna un id dentro de un Set de estado, devolviendo una copia nueva (para disparar el render).
    const toggle = (set: Set<number>, setter: (s: Set<number>) => void, id: number) => {
        const next = new Set(set)
        if (next.has(id)) {
            next.delete(id)
        } else {
            next.add(id)
        }
        setter(next)
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setError(null)
        setIsPending(true)
        try {
            const { data } = await API.post<IResponse<null>>('/api/pack/relations', {
                pack_id,
                label_ids: [...labelIds],
                character_ids: [...characterIds],
                serie_ids: [...serieIds],
                author_ids: [...authorIds],
                language_ids: [...languageIds],
            })
            if (data.success) {
                setAlert({ open: true, icon: 'success', message: 'Relaciones actualizadas correctamente' })
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Error del servidor')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className='grid grid-cols-1 gap-4'>
            <CheckboxGroup
                title='Etiquetas'
                items={labels.map((l) => ({ id: l.label_id, name: l.name }))}
                checkedIds={labelIds}
                onToggle={(id) => { toggle(labelIds, setLabelIds, id) }}
            />
            <CheckboxGroup
                title='Personajes'
                items={characters.map((c) => ({ id: c.character_id, name: c.name }))}
                checkedIds={characterIds}
                onToggle={(id) => { toggle(characterIds, setCharacterIds, id) }}
            />
            <CheckboxGroup
                title='Series'
                items={series.map((s) => ({ id: s.serie_id, name: s.name }))}
                checkedIds={serieIds}
                onToggle={(id) => { toggle(serieIds, setSerieIds, id) }}
            />
            <CheckboxGroup
                title='Autores'
                items={authors.map((a) => ({ id: a.author_id, name: a.name }))}
                checkedIds={authorIds}
                onToggle={(id) => { toggle(authorIds, setAuthorIds, id) }}
            />
            <CheckboxGroup
                title='Idiomas'
                items={languages.map((l) => ({ id: l.language_id, name: l.name }))}
                checkedIds={languageIds}
                onToggle={(id) => { toggle(languageIds, setLanguageIds, id) }}
            />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <div>
                <button className='btn-primary' type='submit' disabled={isPending}>
                    Guardar relaciones
                </button>
            </div>
        </form>
    )
}
