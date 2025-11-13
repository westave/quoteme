import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../utils/prisma';

const registerForwarderSchema = z.object({
  email: z.string().email('Неверный формат email'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
  inn: z.string().regex(/^\d{10,12}$/, 'ИНН должен содержать 10 или 12 цифр'),
  companyName: z.string().min(2, 'Название компании обязательно'),
});

const registerImporterSchema = z.object({
  email: z.string().email('Неверный формат email'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
});

const loginSchema = z.object({
  email: z.string().email('Неверный формат email'),
  password: z.string().min(1, 'Пароль обязателен'),
});

export const registerForwarder = async (req: Request, res: Response) => {
  try {
    const data = registerForwarderSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { inn: data.inn }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        error: existingUser.email === data.email
          ? 'Email уже зарегистрирован'
          : 'ИНН уже зарегистрирован'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create forwarder user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: 'FORWARDER',
        inn: data.inn,
        companyName: data.companyName,
        forwarderStatus: 'PENDING_ACTIVATION',
      },
      select: {
        id: true,
        email: true,
        role: true,
        inn: true,
        companyName: true,
        forwarderStatus: true,
      }
    });

    res.status(201).json({
      message: 'Регистрация успешна. Ожидайте активации аккаунта.',
      user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Register forwarder error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const registerImporter = async (req: Request, res: Response) => {
  try {
    const data = registerImporterSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email уже зарегистрирован' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create importer user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: 'IMPORTER',
      },
      select: {
        id: true,
        email: true,
        role: true,
      }
    });

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Регистрация успешна',
      user,
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Register importer error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // Check password
    const validPassword = await bcrypt.compare(data.password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // Check if forwarder is activated
    if (user.role === 'FORWARDER' && user.forwarderStatus !== 'ACTIVE') {
      return res.status(403).json({
        error: 'Ваш аккаунт еще не активирован. Ожидайте одобрения импортера.',
        status: user.forwarderStatus
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Вход выполнен успешно',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        forwarderStatus: user.forwarderStatus,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const getMe = async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        inn: true,
        companyName: true,
        forwarderStatus: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};
