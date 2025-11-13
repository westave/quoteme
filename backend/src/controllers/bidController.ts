import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

const createBidSchema = z.object({
  shipmentId: z.string().min(1, 'ID груза обязателен'),
  costsBeforeBorder: z.number().min(0, 'Расходы до границы не могут быть отрицательными'),
  costsBeforeBorderVat: z.number().min(0, 'НДС не может быть отрицательным').max(100, 'НДС не может превышать 100%'),
  costsAfterBorder: z.number().min(0, 'Расходы после границы не могут быть отрицательными'),
  costsAfterBorderVat: z.number().min(0, 'НДС не может быть отрицательным').max(100, 'НДС не может превышать 100%'),
  localCosts: z.number().min(0, 'Локальные расходы не могут быть отрицательными'),
  localCostsVat: z.number().min(0, 'НДС не может быть отрицательным').max(100, 'НДС не может превышать 100%'),
  transportType: z.string().min(1, 'Тип транспорта обязателен'),
  notes: z.string().optional(),
});

const updateBidSchema = createBidSchema.omit({ shipmentId: true }).partial();

export const createBid = async (req: AuthRequest, res: Response) => {
  try {
    const data = createBidSchema.parse(req.body);

    // Check if user is an active forwarder
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });

    if (!user || user.role !== 'FORWARDER' || user.forwarderStatus !== 'ACTIVE') {
      return res.status(403).json({ error: 'Только активные экспедиторы могут подавать ставки' });
    }

    // Check if shipment exists and is open
    const shipment = await prisma.shipment.findUnique({
      where: { id: data.shipmentId }
    });

    if (!shipment) {
      return res.status(404).json({ error: 'Груз не найден' });
    }

    if (shipment.status !== 'OPEN') {
      return res.status(400).json({ error: 'Груз закрыт для подачи ставок' });
    }

    // Check if deadline has passed
    if (new Date() > shipment.bidsDeadline) {
      return res.status(400).json({ error: 'Срок подачи ставок истек' });
    }

    // Check if transport type is valid for this shipment
    if (!shipment.transportTypes.includes(data.transportType)) {
      return res.status(400).json({ error: 'Выбранный тип транспорта не поддерживается для этого груза' });
    }

    // Calculate total cost
    const totalCost =
      data.costsBeforeBorder * (1 + data.costsBeforeBorderVat / 100) +
      data.costsAfterBorder * (1 + data.costsAfterBorderVat / 100) +
      data.localCosts * (1 + data.localCostsVat / 100);

    // Create bid
    const bid = await prisma.bid.create({
      data: {
        ...data,
        totalCost,
        forwarderId: req.user!.id,
      },
      include: {
        forwarder: {
          select: {
            id: true,
            companyName: true,
            inn: true,
          }
        },
        shipment: {
          select: {
            id: true,
            title: true,
            status: true,
          }
        }
      }
    });

    res.status(201).json({
      message: 'Ставка подана успешно',
      bid
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create bid error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const getMyBids = async (req: AuthRequest, res: Response) => {
  try {
    const bids = await prisma.bid.findMany({
      where: {
        forwarderId: req.user!.id
      },
      include: {
        shipment: {
          select: {
            id: true,
            title: true,
            status: true,
            bidsDeadline: true,
            readyForPickupDate: true,
            requiredDeliveryDate: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ bids });
  } catch (error) {
    console.error('Get my bids error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const getBidById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const bid = await prisma.bid.findUnique({
      where: { id },
      include: {
        forwarder: {
          select: {
            id: true,
            companyName: true,
            inn: true,
          }
        },
        shipment: {
          include: {
            creator: {
              select: {
                id: true,
                email: true,
              }
            }
          }
        }
      }
    });

    if (!bid) {
      return res.status(404).json({ error: 'Ставка не найдена' });
    }

    // Check permissions
    const isOwner = bid.forwarderId === req.user!.id;
    const isShipmentCreator = bid.shipment.creatorId === req.user!.id;
    const isShipmentClosed = bid.shipment.status === 'CLOSED';

    if (!isOwner && !isShipmentCreator && !isShipmentClosed) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }

    res.json({ bid });
  } catch (error) {
    console.error('Get bid error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const updateBid = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateBidSchema.parse(req.body);

    const bid = await prisma.bid.findUnique({
      where: { id },
      include: {
        shipment: true
      }
    });

    if (!bid) {
      return res.status(404).json({ error: 'Ставка не найдена' });
    }

    if (bid.forwarderId !== req.user!.id) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }

    if (bid.shipment.status !== 'OPEN') {
      return res.status(400).json({ error: 'Груз закрыт, редактирование ставки невозможно' });
    }

    if (new Date() > bid.shipment.bidsDeadline) {
      return res.status(400).json({ error: 'Срок подачи ставок истек' });
    }

    // Recalculate total if costs changed
    let totalCost = bid.totalCost;
    if (Object.keys(data).some(key => key.includes('costs') || key.includes('Vat'))) {
      const updatedData = { ...bid, ...data };
      totalCost =
        updatedData.costsBeforeBorder * (1 + updatedData.costsBeforeBorderVat / 100) +
        updatedData.costsAfterBorder * (1 + updatedData.costsAfterBorderVat / 100) +
        updatedData.localCosts * (1 + updatedData.localCostsVat / 100);
    }

    const updatedBid = await prisma.bid.update({
      where: { id },
      data: {
        ...data,
        totalCost,
      },
      include: {
        forwarder: {
          select: {
            id: true,
            companyName: true,
            inn: true,
          }
        },
        shipment: {
          select: {
            id: true,
            title: true,
            status: true,
          }
        }
      }
    });

    res.json({
      message: 'Ставка обновлена',
      bid: updatedBid
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update bid error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const deleteBid = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const bid = await prisma.bid.findUnique({
      where: { id },
      include: {
        shipment: true
      }
    });

    if (!bid) {
      return res.status(404).json({ error: 'Ставка не найдена' });
    }

    if (bid.forwarderId !== req.user!.id) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }

    if (bid.shipment.status !== 'OPEN') {
      return res.status(400).json({ error: 'Груз закрыт, удаление ставки невозможно' });
    }

    await prisma.bid.delete({
      where: { id }
    });

    res.json({ message: 'Ставка удалена' });
  } catch (error) {
    console.error('Delete bid error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};
