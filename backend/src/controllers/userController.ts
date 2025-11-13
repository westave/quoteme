import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

const updateForwarderStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'REJECTED', 'SUSPENDED']),
});

export const getPendingForwarders = async (req: AuthRequest, res: Response) => {
  try {
    const forwarders = await prisma.user.findMany({
      where: {
        role: 'FORWARDER',
        forwarderStatus: 'PENDING_ACTIVATION'
      },
      select: {
        id: true,
        email: true,
        inn: true,
        companyName: true,
        forwarderStatus: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ forwarders });
  } catch (error) {
    console.error('Get pending forwarders error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const getAllForwarders = async (req: AuthRequest, res: Response) => {
  try {
    const forwarders = await prisma.user.findMany({
      where: {
        role: 'FORWARDER',
      },
      select: {
        id: true,
        email: true,
        inn: true,
        companyName: true,
        forwarderStatus: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ forwarders });
  } catch (error) {
    console.error('Get all forwarders error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const updateForwarderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateForwarderStatusSchema.parse(req.body);

    const forwarder = await prisma.user.findUnique({
      where: { id }
    });

    if (!forwarder) {
      return res.status(404).json({ error: 'Экспедитор не найден' });
    }

    if (forwarder.role !== 'FORWARDER') {
      return res.status(400).json({ error: 'Пользователь не является экспедитором' });
    }

    const updatedForwarder = await prisma.user.update({
      where: { id },
      data: {
        forwarderStatus: data.status
      },
      select: {
        id: true,
        email: true,
        inn: true,
        companyName: true,
        forwarderStatus: true,
      }
    });

    res.json({
      message: 'Статус экспедитора обновлен',
      forwarder: updatedForwarder
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update forwarder status error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};
