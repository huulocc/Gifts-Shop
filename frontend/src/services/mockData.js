const now = new Date().toISOString();

export function createInitialMockState() {
  const customer = {
    id: "seed-customer",
    fullName: "GiftShop Customer",
    phoneNumber: "0900000002",
    email: "customer@giftshop.local",
    password: "Customer@123",
    role: "customer",
  };

  const manager = {
    id: "seed-manager",
    fullName: "GiftShop Manager",
    phoneNumber: "0900000001",
    email: "manager@giftshop.local",
    password: "Manager@123",
    role: "manager",
  };

  const categories = [
    {
      id: "cat-accessories",
      name: "Accessories",
      description: "Wearable gifts and personal accessories.",
      isActive: true,
    },
    {
      id: "cat-souvenirs",
      name: "Souvenirs",
      description: "Small keepsakes and decorative gift items.",
      isActive: true,
    },
    {
      id: "cat-stationery",
      name: "Stationery",
      description: "Cards, journals, and handwritten gift pieces.",
      isActive: true,
    },
    {
      id: "cat-archived",
      name: "Archived sets",
      description: "Soft-disabled demo category for manager review.",
      isActive: false,
    },
  ];

  const products = [
    {
      id: "seed-bracelet",
      categoryId: "cat-accessories",
      name: "Classic Bracelet",
      description: "Simple bracelet suitable for birthdays and anniversaries.",
      unitPrice: "19.99",
      imageUrl: "https://picsum.photos/seed/classic-bracelet-gift/1200/900",
      isActive: true,
      quantity: 25,
    },
    {
      id: "seed-music-box",
      categoryId: "cat-souvenirs",
      name: "Wooden Music Box",
      description: "Decorative music box for special occasions.",
      unitPrice: "34.50",
      imageUrl: "https://picsum.photos/seed/wooden-music-box-gift/1200/900",
      isActive: true,
      quantity: 12,
    },
    {
      id: "seed-rose-journal",
      categoryId: "cat-stationery",
      name: "Rose Linen Journal",
      description: "A compact linen journal with thick paper and a ribbon marker.",
      unitPrice: "16.75",
      imageUrl: "https://picsum.photos/seed/rose-linen-journal/1200/900",
      isActive: true,
      quantity: 4,
    },
    {
      id: "seed-candle-set",
      categoryId: "cat-souvenirs",
      name: "Calm Candle Set",
      description: "Three gentle scented candles packed for simple gifting.",
      unitPrice: "28.00",
      imageUrl: "https://picsum.photos/seed/calm-candle-set/1200/900",
      isActive: true,
      quantity: 0,
    },
    {
      id: "seed-silk-scarf",
      categoryId: "cat-accessories",
      name: "Soft Garden Scarf",
      description: "A lightweight scarf with muted botanical patterning.",
      unitPrice: "42.25",
      imageUrl: "https://picsum.photos/seed/soft-garden-scarf/1200/900",
      isActive: true,
      quantity: 8,
    },
    {
      id: "seed-archived-box",
      categoryId: "cat-archived",
      name: "Archived Keepsake Box",
      description: "Inactive demo product hidden from customer browsing.",
      unitPrice: "21.00",
      imageUrl: "https://picsum.photos/seed/archived-keepsake-box/1200/900",
      isActive: false,
      quantity: 6,
    },
  ];

  const orders = [
    {
      id: "seed-paid-order",
      customerId: customer.id,
      recipientName: "Mai Nguyen",
      recipientPhone: "0912345678",
      shippingAddress: {
        state: "Ho Chi Minh",
        city: "Thu Duc",
        street: "Vo Van Ngan",
        buildingNumber: "12A",
      },
      giftMessage: "Happy birthday!",
      orderStatus: "paid",
      paymentMethod: "cash",
      subtotalAmount: "34.50",
      discountAmount: "0.00",
      totalAmount: "34.50",
      items: [
        {
          id: "seed-paid-order-item",
          productId: "seed-music-box",
          productName: "Wooden Music Box",
          quantity: 1,
          unitPrice: "34.50",
          lineTotal: "34.50",
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "seed-placed-order",
      customerId: customer.id,
      recipientName: "An Tran",
      recipientPhone: "0987654321",
      shippingAddress: {
        state: "Ho Chi Minh",
        city: "District 1",
        street: "Le Loi",
        buildingNumber: "45",
      },
      voucher: {
        id: "voucher-gift10",
        code: "GIFT10",
        percentage: "10.00",
      },
      giftMessage: "For the office exchange.",
      orderStatus: "placed",
      paymentMethod: "bank_transfer",
      subtotalAmount: "36.74",
      discountAmount: "3.67",
      totalAmount: "33.07",
      items: [
        {
          id: "seed-placed-order-item-1",
          productId: "seed-bracelet",
          productName: "Classic Bracelet",
          quantity: 1,
          unitPrice: "19.99",
          lineTotal: "19.99",
        },
        {
          id: "seed-placed-order-item-2",
          productId: "seed-rose-journal",
          productName: "Rose Linen Journal",
          quantity: 1,
          unitPrice: "16.75",
          lineTotal: "16.75",
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
  ];

  const payments = [
    {
      id: "seed-paid-payment",
      orderId: "seed-paid-order",
      paymentMethod: "cash",
      paymentDate: now,
      amount: "34.50",
      status: "completed",
    },
  ];

  const vouchers = [
    {
      id: "voucher-gift10",
      code: "GIFT10",
      percentage: "10.00",
      isActive: true,
    },
    {
      id: "voucher-thankyou15",
      code: "THANKYOU15",
      percentage: "15.00",
      isActive: true,
    },
    {
      id: "voucher-inactive20",
      code: "INACTIVE20",
      percentage: "20.00",
      isActive: false,
    },
  ];

  return {
    sessionUserId: null,
    users: [manager, customer],
    categories,
    products,
    carts: [
      {
        id: "cart-seed-customer",
        userId: customer.id,
        items: [
          {
            id: "cart-item-seed-bracelet",
            productId: "seed-bracelet",
            quantity: 1,
          },
        ],
      },
    ],
    orders,
    payments,
    vouchers,
  };
}
