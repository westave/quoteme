import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаем заполнение базы данных...');

  // Создаем тестового импортера
  const hashedPassword = await bcrypt.hash('password123', 10);

  const importer = await prisma.user.upsert({
    where: { email: 'importer@example.com' },
    update: {},
    create: {
      email: 'importer@example.com',
      password: hashedPassword,
      role: 'IMPORTER',
    },
  });

  console.log('✅ Создан импортер:', importer.email);

  // Создаем тестового экспедитора (уже активированного)
  const forwarder = await prisma.user.upsert({
    where: { email: 'forwarder@example.com' },
    update: {},
    create: {
      email: 'forwarder@example.com',
      password: hashedPassword,
      role: 'FORWARDER',
      inn: '1234567890',
      companyName: 'ООО "Тестовый Экспедитор"',
      forwarderStatus: 'ACTIVE',
    },
  });

  console.log('✅ Создан экспедитор:', forwarder.email);

  // Создаем тестовый груз
  const shipment = await prisma.shipment.create({
    data: {
      title: 'Тестовая перевозка оборудования',
      description: 'Перевозка промышленного оборудования из Шанхая в Москву',
      readyForPickupDate: new Date('2024-12-01'),
      requiredDeliveryDate: new Date('2024-12-20'),
      bidsDeadline: new Date('2024-11-25'),
      incoterms: 'FOB',
      incotermsLocation: 'Shanghai',
      transportTypes: ['SEA_RAILWAY', 'AIR_FREIGHT'],
      pickupAddress: 'Shanghai Port, China',
      deliveryAddress: 'Москва, Россия',
      status: 'OPEN',
      creatorId: importer.id,
    },
  });

  console.log('✅ Создан груз:', shipment.title);

  // Создаем тестовую ставку
  const bid = await prisma.bid.create({
    data: {
      shipmentId: shipment.id,
      forwarderId: forwarder.id,
      costsBeforeBorder: 50000,
      costsBeforeBorderVat: 0,
      costsAfterBorder: 80000,
      costsAfterBorderVat: 20,
      localCosts: 15000,
      localCostsVat: 20,
      transportType: 'SEA_RAILWAY',
      totalCost: 50000 + 80000 * 1.2 + 15000 * 1.2,
      notes: 'Срок доставки 18-20 дней, страховка включена',
    },
  });

  console.log('✅ Создана ставка с итого:', bid.totalCost);
  console.log('\n🎉 База данных успешно заполнена тестовыми данными!\n');
  console.log('📋 Тестовые аккаунты:');
  console.log('   Импортер: importer@example.com / password123');
  console.log('   Экспедитор: forwarder@example.com / password123\n');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении базы данных:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
