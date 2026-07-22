import { state } from "@/libs/telegram"
import { NextResponse } from "next/server"

export const GET = async () =>{
    return NextResponse.json({ signals: state.signals })
}