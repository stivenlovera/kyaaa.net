import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/src/app/utils/auth";
import { repositoryParticipate } from "@/src/app/repositories/participate.repository";
import { IVoteResult } from "@/src/app/types/participate.types";
import { IResponse } from "@/src/app/types/response";
import { STATE_PACK_PARTICIPATE, STATE_PARTICIPATE } from "@/src/app/utils/page-access";
import logger, { jsonLog } from "@/src/app/utils/logger";

// Vota un pack de una votación de /participate (body: { participate_pack_id }). Un voto por usuario y
// votación: votar otro pack mueve el voto y volver a votar el mismo lo quita. Exige sesión y correo
// verificado, y que la votación esté en curso y el pack en el estado de las votaciones (borrador).
export async function POST(request: NextRequest) {
    logger.info(`api/participate/vote POST`)
    try {
        const user = await getCurrentUser();
        if (user === null) {
            return NextResponse.json({ success: false, message: 'Inicia sesión para votar' }, { status: 401 });
        }
        if (!user.verified_email) {
            return NextResponse.json({ success: false, message: 'Verifica tu correo para poder votar' }, { status: 403 });
        }
        const body: { participate_pack_id?: number } = await request.json();
        if (!Number.isInteger(body.participate_pack_id) || body.participate_pack_id! <= 0) {
            return NextResponse.json({ success: false, message: 'Falta participate_pack_id' }, { status: 400 });
        }
        const target = await repositoryParticipate.findVoteTarget(body.participate_pack_id!);
        if (target === null) {
            return NextResponse.json({ success: false, message: 'El pack ya no está en la votación' }, { status: 404 });
        }
        if (target.state_participate_id !== STATE_PARTICIPATE.ACTIVE) {
            return NextResponse.json({ success: false, message: 'La votación no está abierta' }, { status: 400 });
        }
        if (target.state_pack_id !== STATE_PACK_PARTICIPATE) {
            return NextResponse.json({ success: false, message: 'Este pack ya no se puede votar' }, { status: 400 });
        }
        const result = await repositoryParticipate.toggleVote(user.user_id, target.participate_id, body.participate_pack_id!);
        const resp: IResponse<IVoteResult> = {
            data: result,
            message: result.voted === null ? 'Voto quitado' : 'Voto registrado',
            success: true,
        };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        logger.error(`api/participate/vote POST error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: 'Error del servidor' }, { status: 500 });
    }
}
