import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

const createShipmentSchema = z.object({
  title: z.string().min(3, 'Название должно содержать минимум 3 символа'),
  description: z.string().optional(),
  readyForPickupDate: z.string().datetime('Неверный формат даты'),
  requiredDeliveryDate: z.string().datetime('Неверный формат даты'),
  bidsDeadline: z.string().datetime('Неверный формат даты'),
  incoterms: z.string().min(2, 'Инкотермс обязателен'),
  incotermsLocation: z.string().min(2, 'Место применения инкотермс обязательно'),
  transportTypes: z.array(z.string()).min(1, 'Выберите хотя бы один вид транспорта'),
  pickupAddress: z.string().min(5, 'Адрес забора обязателен'),
  deliveryAddress: z.string().min(5, 'Адрес доставки обязателен'),
});

const updateShipmentSchema = createShipmentSchema.partial();

export const createShipment = async (req: AuthRequest, res: Response) => {
  try {
    const data = createShipmentSchema.parse(req.body);

    const shipment = await prisma.shipment.create({
      data: {
        ...data,
        readyForPickupDate: new Date(data.readyForPickupDate),
        requiredDeliveryDate: new Date(data.requiredDeliveryDate),
        bidsDeadline: new Date(data.bidsDeadline),
        creatorId: req.user!.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            companyName: true,
          }
        },
        _count: {
          select: {
            bids: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Груз создан успешно',
      shipment
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create shipment error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const getShipments = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;

    const where: any = {};

    // If forwarder, only show OPEN shipments
    if (req.user!.role === 'FORWARDER') {
      where.status = 'OPEN';
    } else if (status) {
      where.status = status;
    }

    const shipments = await prisma.shipment.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            companyName: true,
          }
        },
        _count: {
          select: {
            bids: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ shipments });
  } catch (error) {
    console.error('Get shipments error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const getShipmentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            companyName: true,
          }
        },
        bids: {
          include: {
            forwarder: {
              select: {
                id: true,
                companyName: true,
                inn: true,
              }
            }
          },
          orderBy: {
            totalCost: 'asc'
          }
        }
      }
    });

    if (!shipment) {
      return res.status(404).json({ error: 'Груз не найден' });
    }

    // If forwarder and shipment is open, blur other forwarders' bids
    if (req.user!.role === 'FORWARDER' && shipment.status === 'OPEN') {
      shipment.bids = shipment.bids.map(bid => {
        if (bid.forwarderId !== req.user!.id) {
          return {
            ...bid,
            forwarder: {
              id: 'hidden',
              companyName: 'Конкурент',
              inn: null,
            },
            notes: null,
          };
        }
        return bid;
      });
    }

    res.json({ shipment });
  } catch (error) {
    console.error('Get shipment error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const updateShipment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateShipmentSchema.parse(req.body);

    const shipment = await prisma.shipment.findUnique({
      where: { id }
    });

    if (!shipment) {
      return res.status(404).json({ error: 'Груз не найден' });
    }

    if (shipment.creatorId !== req.user!.id) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }

    const updateData: any = { ...data };
    if (data.readyForPickupDate) {
      updateData.readyForPickupDate = new Date(data.readyForPickupDate);
    }
    if (data.requiredDeliveryDate) {
      updateData.requiredDeliveryDate = new Date(data.requiredDeliveryDate);
    }
    if (data.bidsDeadline) {
      updateData.bidsDeadline = new Date(data.bidsDeadline);
    }

    const updatedShipment = await prisma.shipment.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            companyName: true,
          }
        },
        _count: {
          select: {
            bids: true
          }
        }
      }
    });

    res.json({
      message: 'Груз обновлен',
      shipment: updatedShipment
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update shipment error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const closeShipment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const shipment = await prisma.shipment.findUnique({
      where: { id }
    });

    if (!shipment) {
      return res.status(404).json({ error: 'Груз не найден' });
    }

    if (shipment.creatorId !== req.user!.id) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }

    if (shipment.status === 'CLOSED') {
      return res.status(400).json({ error: 'Груз уже закрыт' });
    }

    const updatedShipment = await prisma.shipment.update({
      where: { id },
      data: { status: 'CLOSED' },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            companyName: true,
          }
        },
        bids: {
          include: {
            forwarder: {
              select: {
                id: true,
                companyName: true,
                inn: true,
              }
            }
          },
          orderBy: {
            totalCost: 'asc'
          }
        }
      }
    });

    res.json({
      message: 'Груз закрыт. Все ставки теперь видны всем участникам.',
      shipment: updatedShipment
    });
  } catch (error) {
    console.error('Close shipment error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const deleteShipment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const shipment = await prisma.shipment.findUnique({
      where: { id }
    });

    if (!shipment) {
      return res.status(404).json({ error: 'Груз не найден' });
    }

    if (shipment.creatorId !== req.user!.id) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }

    await prisma.shipment.delete({
      where: { id }
    });

    res.json({ message: 'Груз удален' });
  } catch (error) {
    console.error('Delete shipment error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};
