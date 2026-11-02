// Fotos de perfil: bucket AWS_BUCKET_STATIC, key `user/<archivo>`; user.image guarda solo <archivo>.
export const PROFILE_IMAGE_PREFIX = 'user';

export function profileImageKey(image: string): string {
    return `${PROFILE_IMAGE_PREFIX}/${image}`;
}

export function profileImageUrl(image: string | null | undefined): string {
    return `${process.env.NEXT_PUBLIC_STATIC_URL_S3}/${profileImageKey(image ?? 'new_user.png')}`;
}
