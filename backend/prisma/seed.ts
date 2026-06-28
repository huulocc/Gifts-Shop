import 'dotenv/config';

import { PrismaClient, Role, PaymentMethod, OrderStatus, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const [managerPasswordHash, customerPasswordHash] = await Promise.all([
    bcrypt.hash('Manager@123', 10),
    bcrypt.hash('Customer@123', 10),
  ]);

  const manager = await prisma.user.upsert({
    where: { email: 'manager@giftshop.local' },
    update: {
      fullName: 'GiftShop Manager',
      phoneNumber: '0900000001',
      passwordHash: managerPasswordHash,
      role: Role.MANAGER,
    },
    create: {
      fullName: 'GiftShop Manager',
      phoneNumber: '0900000001',
      email: 'manager@giftshop.local',
      passwordHash: managerPasswordHash,
      role: Role.MANAGER,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@giftshop.local' },
    update: {
      fullName: 'GiftShop Customer',
      phoneNumber: '0900000002',
      passwordHash: customerPasswordHash,
      role: Role.CUSTOMER,
    },
    create: {
      fullName: 'GiftShop Customer',
      phoneNumber: '0900000002',
      email: 'customer@giftshop.local',
      passwordHash: customerPasswordHash,
      role: Role.CUSTOMER,
    },
  });

  const accessories = await prisma.category.upsert({
    where: { name: 'Accessories' },
    update: {
      description: 'Wearable gifts and personal accessories.',
      isActive: true,
    },
    create: {
      name: 'Accessories',
      description: 'Wearable gifts and personal accessories.',
      isActive: true,
    },
  });

  const souvenirs = await prisma.category.upsert({
    where: { name: 'Souvenirs' },
    update: {
      description: 'Small keepsakes and decorative gift items.',
      isActive: true,
    },
    create: {
      name: 'Souvenirs',
      description: 'Small keepsakes and decorative gift items.',
      isActive: true,
    },
  });

  const bracelet = await prisma.product.upsert({
    where: { id: 'seed-bracelet' },
    update: {
      categoryId: accessories.id,
      name: 'Classic Bracelet',
      description: 'Simple bracelet suitable for birthdays and anniversaries.',
      unitPrice: 19.99,
      imageUrl: 'https://example.com/images/classic-bracelet.jpg',
      isActive: true,
      quantity: 25,
    },
    create: {
      id: 'seed-bracelet',
      categoryId: accessories.id,
      name: 'Classic Bracelet',
      description: 'Simple bracelet suitable for birthdays and anniversaries.',
      unitPrice: 19.99,
      imageUrl: 'https://example.com/images/classic-bracelet.jpg',
      isActive: true,
      quantity: 25,
    },
  });

  const musicBox = await prisma.product.upsert({
    where: { id: 'seed-music-box' },
    update: {
      categoryId: souvenirs.id,
      name: 'Wooden Music Box',
      description: 'Decorative music box for special occasions.',
      unitPrice: 34.5,
      imageUrl: 'https://example.com/images/wooden-music-box.jpg',
      isActive: true,
      quantity: 12,
    },
    create: {
      id: 'seed-music-box',
      categoryId: souvenirs.id,
      name: 'Wooden Music Box',
      description: 'Decorative music box for special occasions.',
      unitPrice: 34.5,
      imageUrl: 'https://example.com/images/wooden-music-box.jpg',
      isActive: true,
      quantity: 12,
    },
  });

  const cart = await prisma.cart.upsert({
    where: { userId: customer.id },
    update: {},
    create: { userId: customer.id },
  });

  // Reset the seeded customer's cart. CartItems do not reserve product stock.
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId: bracelet.id,
      quantity: 1,
    },
  });

  await Promise.all([
    prisma.voucher.upsert({
      where: { code: 'GIFT10' },
      update: { percentage: 10, isActive: true },
      create: { code: 'GIFT10', percentage: 10, isActive: true },
    }),
    prisma.voucher.upsert({
      where: { code: 'THANKYOU15' },
      update: { percentage: 15, isActive: true },
      create: { code: 'THANKYOU15', percentage: 15, isActive: true },
    }),
    prisma.voucher.upsert({
      where: { code: 'INACTIVE20' },
      update: { percentage: 20, isActive: false },
      create: { code: 'INACTIVE20', percentage: 20, isActive: false },
    }),
  ]);

  const seededOrder = await prisma.order.upsert({
    where: { id: 'seed-paid-order' },
    update: {
      customerId: customer.id,
      recipientName: 'Mai Nguyen',
      recipientPhone: '0912345678',
      giftMessage: 'Happy birthday!',
      orderStatus: OrderStatus.PAID,
      paymentMethod: PaymentMethod.CASH,
      discountAmount: 0,
      totalAmount: 34.5,
    },
    create: {
      id: 'seed-paid-order',
      customerId: customer.id,
      recipientName: 'Mai Nguyen',
      recipientPhone: '0912345678',
      giftMessage: 'Happy birthday!',
      orderStatus: OrderStatus.PAID,
      paymentMethod: PaymentMethod.CASH,
      discountAmount: 0,
      totalAmount: 34.5,
    },
  });

  await prisma.address.upsert({
    where: { orderId: seededOrder.id },
    update: {
      state: 'Ho Chi Minh',
      city: 'Thu Duc',
      street: 'Vo Van Ngan',
      buildingNumber: '12A',
    },
    create: {
      orderId: seededOrder.id,
      state: 'Ho Chi Minh',
      city: 'Thu Duc',
      street: 'Vo Van Ngan',
      buildingNumber: '12A',
    },
  });

  await prisma.orderItem.upsert({
    where: { id: 'seed-paid-order-item' },
    update: {
      orderId: seededOrder.id,
      productId: musicBox.id,
      quantity: 1,
      unitPrice: 34.5,
    },
    create: {
      id: 'seed-paid-order-item',
      orderId: seededOrder.id,
      productId: musicBox.id,
      quantity: 1,
      unitPrice: 34.5,
    },
  });

  await prisma.payment.upsert({
    where: { id: 'seed-paid-payment' },
    update: {
      orderId: seededOrder.id,
      paymentMethod: PaymentMethod.CASH,
      amount: 34.5,
      status: PaymentStatus.COMPLETED,
    },
    create: {
      id: 'seed-paid-payment',
      orderId: seededOrder.id,
      paymentMethod: PaymentMethod.CASH,
      amount: 34.5,
      status: PaymentStatus.COMPLETED,
    },
  });

  console.log(`Seeded GiftShop data for manager ${manager.email} and customer ${customer.email}.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
