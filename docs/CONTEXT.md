# GiftShop Project Context

Last updated: 2026-06-06

## 1. Overview

GiftShop is a web-based gift shop system for browsing products, managing a shopping cart, placing orders, processing payments, managing inventory, and viewing revenue. The project is based on the existing class diagram, use case diagram, and `Group2_V1.docx`, but the implementation scope is normalized to two actors only:

- Customer
- Manager

Guest, sales staff, and administrator roles are outside the current business scope. Authentication can still support register, login, logout, and password change because those actions are required to access Customer and Manager features.

## 2. Goals

- Provide a simple online shopping flow for customers.
- Provide a manager dashboard for products, categories, stock, orders, and revenue.
- Keep the object-oriented domain model consistent with the class diagram.
- Use Prisma as the main ORM/schema layer for Neon database.
- Use Java Spring to expose APIs, services, and facade classes.
- Apply Facade Pattern as the required design pattern for the implementation.

## 3. Tech Stack

| Layer | Technology | Responsibility |
| --- | --- | --- |
| Frontend | ReactJS | Customer pages, manager dashboard, cart UI, checkout UI, API integration |
| Backend API | Java Spring Boot | REST endpoints, validation, authentication, authorization, service orchestration |
| Facade layer | Java Spring services/facades | Simplified entry points for customer and manager workflows |
| ORM/schema | Prisma | Neon/PostgreSQL schema, migrations, typed database access contract |
| Database | Neon database | Persistent storage for users, products, categories, carts, orders, payments, and stock quantity |

Because Spring Boot and Prisma are not a default pairing, the implementation must keep Prisma behind a data-access adapter or repository boundary. Controllers and facades should depend on service/repository interfaces, not directly on Prisma details.

## 4. Actor Scope

### Customer

Customers can:

- Register, login, logout, and change password.
- View product list and product details.
- Search products by name or keyword.
- Manage cart items.
- Place an order from the cart.
- Select a payment method and make payment.
- View personal order history.

### Manager

Managers can:

- Login, logout, and change password.
- Manage product categories.
- Manage products.
- Manage product stock quantity.
- View and update order status.
- View payment/order information.
- View revenue reports.

Managers do not need a separate sales staff role. Any old "Sales Staff" references from the Word report should be treated as Manager responsibilities.

## 5. Functional Scope

### Customer Flow

1. Customer browses or searches active products.
2. Customer adds products to cart with item quantity.
3. Customer updates or removes cart items.
4. Customer places an order.
5. System creates order items from cart items and calculates total amount.
6. Customer chooses a payment method.
7. System records payment result.
8. Customer can view order history and order details.

### Manager Flow

1. Manager creates and updates categories.
2. Manager creates and updates products.
3. Manager updates database stock quantity for products.
4. Manager views orders.
5. Manager updates order status.
6. Manager views revenue based on paid/completed orders.

### Order Status

Use the order statuses from the class diagram:

- `pending`: order is created but not finalized/processed.
- `placed`: order is confirmed by customer.
- `paid`: payment has been completed or confirmed.
- `cancelled`: order is cancelled and should not count toward revenue.
- `completed`: order is fulfilled and closed.

Revenue reports should count paid and completed orders, and should exclude pending, placed, and cancelled orders unless a future business rule says otherwise.

### Payment Methods

Use the payment methods from the class diagram:

- `cash`
- `credit_card`
- `paypal`
- `bank_transfer`

For the current academic scope, payment can be implemented as a recorded transaction instead of a real external payment gateway.

## 6. Domain Model

The object-oriented model follows the class diagram.

### User

Represents both Customer and Manager accounts.

Core properties:

- `id`
- `fullName`
- `phoneNumber`
- `email`
- `passwordHash`
- `role`

Allowed roles:

- `customer`
- `manager`

### Product

Represents a sellable gift item.

Core OOP properties:

- `id`
- `name`
- `description`
- `unitPrice`
- `imageUrl`
- `isActive`
- `category`

Important rule: `Product` must not have a `quantity` property in the OOP class model. This keeps the class diagram aligned with the teacher requirement.

Database rule: the Neon database product table must include a `quantity` column for stock management. This database column is allowed because inventory is a persistence concern, while the OOP `Product` class remains focused on product identity and product information.

### Category

Groups products.

Core properties:

- `id`
- `name`
- `description`
- `isActive`

### Cart

Belongs to a customer and contains cart items.

Core properties:

- `id`
- `userId`
- `cartItems`

### CartItem

Represents a product selected in a cart.

Core properties:

- `id`
- `product`
- `quantity`

`CartItem.quantity` is valid because it means quantity selected by the customer, not product stock.

### Order

Represents a customer purchase.

Core properties:

- `id`
- `customer`
- `orderItems`
- `giftMessage`
- `orderStatus`
- `paymentMethod`

Behavior:

- `totalAmount()`

### OrderItem

Represents a product snapshot inside an order.

Core properties:

- `id`
- `product`
- `quantity`
- `unitPrice`

`OrderItem.quantity` is valid because it means quantity purchased in that order.

### Payment

Recommended database/entity addition for tracking payment.

Core properties:

- `id`
- `orderId`
- `paymentMethod`
- `paymentDate`
- `amount`
- `status`

### Optional/Future Entities

The Word report and class diagram mention entities such as Voucher and Address. They can be kept as future scope unless the team decides to implement them for checkout details or discounts. They are not required for the current Customer/Manager-only scope.

## 7. Database and Prisma Notes

Prisma should define the Neon/PostgreSQL schema and migrations for:

- `User`
- `Category`
- `Product`
- `Cart`
- `CartItem`
- `Order`
- `OrderItem`
- `Payment`

Prisma schema requirements:

- `Product` database model includes `quantity Int` for stock.
- OOP/domain `Product` class excludes `quantity`.
- `CartItem` and `OrderItem` include `quantity`.
- `User.role` is limited to `customer` and `manager`.
- `Order.orderStatus` uses the agreed status enum.
- Money values should use a decimal-safe type.
- Passwords must be stored as hashes, never plain text.

## 8. Architecture

Recommended high-level architecture:

```text
ReactJS UI
  -> Spring REST Controllers
  -> Facade Layer
  -> Application Services
  -> Repository/Data Access Adapter
  -> Prisma ORM Schema/Client Boundary
  -> Neon database
```

### Backend Responsibilities

- Validate requests.
- Enforce role-based access.
- Orchestrate customer and manager workflows through facades.
- Calculate order totals.
- Update order status.
- Update stock quantity in the database.
- Generate revenue summaries.

### Frontend Responsibilities

- Provide customer-facing product, cart, checkout, payment, and order history pages.
- Provide manager-facing category, product, stock, order, and revenue pages.
- Call backend APIs through a small API service layer.
- Display loading, empty, validation, and error states.

## 9. Facade Pattern Requirement

Facade Pattern is required for this project. It should provide simple workflow-level methods that hide lower-level service and repository complexity.

Recommended facades:

- `CustomerFacade`
- `ManagerFacade`
- `OrderFacade`

Alternative acceptable structure:

- A single `GiftShopFacade` that delegates to customer, manager, order, product, cart, payment, and revenue services.

Facade responsibilities:

- `CustomerFacade`: browse products, manage cart, place order, make payment, view order history.
- `ManagerFacade`: manage categories, products, stock, order status, and revenue.
- `OrderFacade`: centralize order placement, total calculation, stock deduction, payment recording, and status transitions.

Controllers should call facades for business workflows instead of directly coordinating many services.

Example:

```text
CheckoutController
  -> CustomerFacade.placeOrder(customerId, checkoutRequest)
  -> OrderService, CartService, ProductService, PaymentService
  -> Repositories/Prisma boundary
```

## 10. Optional Design Patterns

The Word report mentions several design patterns. They are optional unless the implementation benefits from them naturally:

- Strategy Pattern: payment method handling.
- Builder Pattern: constructing complex order requests or order entities.
- Command Pattern: order status actions such as cancel or complete.
- Singleton Pattern: frontend cart manager or shared client-side state service.
- Observer Pattern: UI notifications or event logging.
- Factory Method Pattern: product subtype creation if product types are implemented.
- Decorator Pattern: discounts or vouchers if promotion scope is added later.

Do not force these patterns into the code if they add complexity without reuse. Facade Pattern is the only required pattern for the current implementation.

## 11. Out of Scope

- Separate Admin role.
- Separate Sales Staff role.
- Real payment gateway integration.
- Voucher/discount implementation.
- Product subtype hierarchy unless required later.
- Shipping provider integration.
- Email/SMS notification integration.
- Advanced analytics beyond basic revenue reports.

## 12. Assumptions

- The project is an academic GiftShop system, not a production ecommerce platform.
- The current implementation starts from a Spring Boot skeleton.
- The final system should remain simple enough for a course project.
- Diagrams are used as design guidance, but the implementation should follow the updated two-role scope.
- Neon database is the source of truth for persistent data.
- Prisma is the primary ORM/schema layer.
- Spring Boot is the API and business workflow layer.
