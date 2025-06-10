import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== 'COACH') return res.status(403).json({ error: "Unauthorized" });

  const userId = session.user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let log = await prisma.timeLog.findFirst({
    where: { userId, date: today },
  });

  if (!log) {
    log = await prisma.timeLog.create({
      data: { userId, date: today, clockIn: new Date() },
    });
    return res.status(200).json({ message: "Clocked in", log });
  }

  if (!log.clockOut) {
    log = await prisma.timeLog.update({
      where: { id: log.id },
      data: { clockOut: new Date() },
    });
    return res.status(200).json({ message: "Clocked out", log });
  }

  return res.status(200).json({ message: "Already clocked in and out", log });
}
