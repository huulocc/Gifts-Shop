import { prisma } from './config/prisma';
import { AuthController } from './controllers/authController';
import { CartController } from './controllers/cartController';
import { CategoryController } from './controllers/categoryController';
import { OrderController } from './controllers/orderController';
import { PaymentController } from './controllers/paymentController';
import { ProductController } from './controllers/productController';
import { ReportController } from './controllers/reportController';
import { CustomerFacade } from './facades/customerFacade';
import { ManagerFacade } from './facades/managerFacade';
import { DefaultOrderFacade, type OrderFacade } from './facades/orderFacade';
import { PrismaCartRepository } from './repositories/cartRepository';
import { PrismaCategoryRepository } from './repositories/categoryRepository';
import { PrismaOrderRepository } from './repositories/orderRepository';
import { PrismaPaymentRepository } from './repositories/paymentRepository';
import { PrismaProductRepository } from './repositories/productRepository';
import { PrismaUserRepository } from './repositories/userRepository';
import { AuthService } from './services/authService';
import { CartService } from './services/cartService';
import { CategoryService } from './services/categoryService';
import { PaymentService } from './services/paymentService';
import { ProductService } from './services/productService';

const userRepository = new PrismaUserRepository(prisma);
const productRepository = new PrismaProductRepository(prisma);
const categoryRepository = new PrismaCategoryRepository(prisma);
const cartRepository = new PrismaCartRepository(prisma);
const orderRepository = new PrismaOrderRepository(prisma);
const paymentRepository = new PrismaPaymentRepository(prisma);

const authService = new AuthService(userRepository);
const productService = new ProductService(productRepository, categoryRepository);
const categoryService = new CategoryService(categoryRepository, productRepository);
const cartService = new CartService(cartRepository, productRepository);
const paymentService = new PaymentService(paymentRepository);

const customerFacade = new CustomerFacade(orderRepository);
const managerFacade = new ManagerFacade(orderRepository);
const orderFacade: OrderFacade = new DefaultOrderFacade(
  cartRepository,
  productRepository,
  orderRepository,
  paymentService,
);

export const controllers = {
  auth: new AuthController(authService),
  products: new ProductController(productService),
  categories: new CategoryController(categoryService),
  cart: new CartController(cartService),
  orders: new OrderController(customerFacade, managerFacade, orderFacade),
  payments: new PaymentController(paymentService),
  reports: new ReportController(managerFacade),
};
