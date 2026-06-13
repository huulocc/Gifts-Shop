# GiftShop Work Breakdown Structure

Last updated: 2026-06-06

## 1. WBS Overview

This WBS defines the work needed to build the GiftShop system from the current skeleton. The system has two actors only:

- Customer
- Manager

The required design pattern is Facade Pattern. Prisma is treated as the primary ORM/schema layer for Neon database, while Java Spring Boot exposes APIs, services, and facades.

## 2. Milestones

| Milestone | Name | Deliverable |
| --- | --- | --- |
| M1 | Project setup | Frontend/backend structure and environment configuration |
| M2 | Database and ORM | Prisma schema and Neon database ready |
| M3 | Backend core | Spring API, auth, services, facades, and data access boundary |
| M4 | Customer features | Product browsing, cart, checkout, payment, and order history |
| M5 | Manager features | Category, product, stock, order status, and revenue management |
| M6 | Testing and documentation | Verified flows, test cases, and updated project docs |

## 3. Work Packages

| ID | Work Package | Description | Dependencies | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| 1.0 | Project Setup | Prepare the working structure for backend, frontend, configuration, and documentation. | None | Project can be opened and run locally with documented commands. |
| 2.0 | Database and Prisma ORM | Define Neon/PostgreSQL schema through Prisma and prepare migration workflow. | 1.0 | Prisma schema covers all required entities and validates successfully. |
| 3.0 | Backend Foundation | Build Spring Boot API foundation with validation, auth, role checks, and data access boundaries. | 1.0, 2.0 | Backend exposes protected API structure for Customer and Manager. |
| 4.0 | Facade Layer | Implement workflow-level facades for Customer, Manager, and Order operations. | 3.0 | Controllers call facades instead of coordinating lower-level services directly. |
| 5.0 | Customer Features | Implement product browsing, cart, order placement, payment, and order history. | 3.0, 4.0 | Customer can complete the expected shopping flow. |
| 6.0 | Manager Features | Implement product, category, stock, order status, and revenue management. | 3.0, 4.0 | Manager can maintain catalog and operational order data. |
| 7.0 | Frontend UI | Build ReactJS pages and API integration for both actors. | 3.0, 5.0, 6.0 | Customer and Manager screens work against backend APIs. |
| 8.0 | Testing and QA | Verify business flows, role permissions, edge cases, and documentation. | 5.0, 6.0, 7.0 | Core flows pass manual and automated checks. |

## 4. Detailed Tasks

### 1.0 Project Setup

| ID | Task | Description | Dependencies | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| 1.1 | Confirm folder structure | Keep backend in `Gifts-Shop/backend` and create frontend workspace if missing. | None | Backend and frontend locations are clear in README. |
| 1.2 | Configure backend environment | Add Spring profiles and Neon/Prisma configuration placeholders. | 1.1 | Environment variables are documented and not hardcoded. |
| 1.3 | Configure frontend environment | Add ReactJS environment variables for API base URL. | 1.1 | Frontend can call backend using a configurable API URL. |
| 1.4 | Update README | Document run commands, tech stack, actor scope, and key folders. | 1.1, 1.2, 1.3 | A new developer can understand how to start the project. |

### 2.0 Database and Prisma ORM

| ID | Task | Description | Dependencies | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| 2.1 | Create Prisma setup | Add Prisma configuration for Neon database. | 1.2 | Prisma can connect to the configured Neon database. |
| 2.2 | Define enums | Add `Role`, `OrderStatus`, `PaymentMethod`, and payment status values. | 2.1 | Enums contain only supported values from the project context. |
| 2.3 | Define user model | Add user account fields and role support for `customer` and `manager`. | 2.2 | Users can be stored with hashed passwords and roles. |
| 2.4 | Define category model | Add category fields: name, description, and active flag. | 2.1 | Categories can be created, updated, listed, and soft-disabled. |
| 2.5 | Define product model | Add product fields and database stock `quantity`. | 2.4 | Product table includes `quantity`, while OOP Product class remains quantity-free. |
| 2.6 | Define cart models | Add cart and cart item models. | 2.3, 2.5 | Cart items store selected product quantity per customer. |
| 2.7 | Define order models | Add order and order item models. | 2.3, 2.5 | Order items store purchased product quantity and unit price snapshot. |
| 2.8 | Define payment model | Add payment model linked to order. | 2.7 | Payment records method, amount, status, and date. |
| 2.9 | Create seed data | Add sample manager, customers, categories, and products. | 2.3, 2.4, 2.5 | Demo data supports both Customer and Manager flows. |

### 3.0 Backend Foundation

| ID | Task | Description | Dependencies | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| 3.1 | Configure Spring packages | Organize packages for controller, facade, service, repository, model, dto, and security. | 1.2 | Backend structure is consistent and easy to navigate. |
| 3.2 | Add DTOs and validation | Create request/response DTOs for auth, product, cart, order, payment, and reports. | 3.1 | API inputs are validated before business logic runs. |
| 3.3 | Add security foundation | Implement password hashing, login, logout/token handling, and role checks. | 2.3, 3.2 | Customer and Manager endpoints are protected by role. |
| 3.4 | Add data access boundary | Create repository/data-access interfaces backed by the Prisma boundary. | 2.0, 3.1 | Services do not directly depend on database details. |
| 3.5 | Add global error handling | Standardize validation, not found, unauthorized, and business rule errors. | 3.2 | API responses are consistent and readable. |

### 4.0 Facade Layer

| ID | Task | Description | Dependencies | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| 4.1 | Implement CustomerFacade | Provide methods for browse products, cart operations, checkout, payment, and order history. | 3.4 | Customer controllers use `CustomerFacade` for customer workflows. |
| 4.2 | Implement ManagerFacade | Provide methods for categories, products, stock, order status, and revenue. | 3.4 | Manager controllers use `ManagerFacade` for manager workflows. |
| 4.3 | Implement OrderFacade | Centralize order placement, total calculation, stock deduction, payment recording, and status changes. | 3.4 | Order-related workflows are not duplicated across controllers. |
| 4.4 | Document facade usage | Add notes or diagrams showing how controllers call facades. | 4.1, 4.2, 4.3 | Facade Pattern is visible in code structure and documentation. |

### 5.0 Customer Features

| ID | Task | Description | Dependencies | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| 5.1 | Product browsing API | List active products and product details. | 4.1 | Customer can view products without manager permissions. |
| 5.2 | Product search API | Search active products by name or keyword. | 5.1 | Search returns relevant active products. |
| 5.3 | Cart API | Add, update, remove, and list cart items. | 4.1, 2.6 | Cart item quantity is validated against database stock quantity. |
| 5.4 | Place order API | Create an order from cart items. | 4.1, 4.3, 5.3 | Order is created with order items, total amount, and initial status. |
| 5.5 | Payment API | Record payment for an order using selected payment method. | 4.1, 4.3, 5.4 | Payment updates payment record and order status correctly. |
| 5.6 | Order history API | List current customer's previous orders and details. | 4.1, 5.4 | Customer only sees their own orders. |

### 6.0 Manager Features

| ID | Task | Description | Dependencies | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| 6.1 | Category management API | Create, update, list, and soft-disable categories. | 4.2, 2.4 | Manager can maintain product categories. |
| 6.2 | Product management API | Create, update, list, and soft-disable products. | 4.2, 2.5 | Manager can maintain product information. |
| 6.3 | Stock management API | Update product database `quantity` for inventory. | 4.2, 2.5 | Stock changes affect customer cart/order validation. |
| 6.4 | Order list API | View all customer orders. | 4.2, 2.7 | Manager can search/filter orders if needed. |
| 6.5 | Order status API | Update status among pending, placed, paid, cancelled, and completed. | 4.2, 4.3, 6.4 | Invalid status transitions are rejected. |
| 6.6 | Revenue report API | Calculate revenue from paid/completed orders. | 4.2, 2.7, 2.8 | Report excludes pending, placed, and cancelled orders. |

### 7.0 Frontend UI

| ID | Task | Description | Dependencies | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| 7.1 | Routing and layouts | Create shared layout and role-based navigation. | 1.3, 3.3 | Customer and Manager see appropriate navigation items. |
| 7.2 | Auth screens | Add register, login, logout, and change password screens. | 3.3 | Users can authenticate and access role-specific pages. |
| 7.3 | Customer product pages | Add product list, search, and detail pages. | 5.1, 5.2 | Customer can browse and search active products. |
| 7.4 | Cart page | Add cart item list, quantity update, remove, and totals. | 5.3 | Cart UI stays consistent after changes. |
| 7.5 | Checkout and payment pages | Add place order and payment method selection. | 5.4, 5.5 | Customer can place order and record payment. |
| 7.6 | Order history page | Add list/detail view for customer order history. | 5.6 | Customer can review previous orders. |
| 7.7 | Manager category page | Add category CRUD UI. | 6.1 | Manager can maintain categories from UI. |
| 7.8 | Manager product and stock page | Add product CRUD and stock quantity controls. | 6.2, 6.3 | Manager can update product information and stock. |
| 7.9 | Manager order page | Add order list and status update controls. | 6.4, 6.5 | Manager can update order status from UI. |
| 7.10 | Manager revenue page | Add revenue summary UI. | 6.6 | Manager can view total revenue and basic statistics. |

### 8.0 Testing and QA

| ID | Task | Description | Dependencies | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| 8.1 | Backend unit tests | Test services, facades, validation, totals, stock, and revenue rules. | 4.0, 5.0, 6.0 | Core business rules are covered by automated tests. |
| 8.2 | API integration tests | Test Customer and Manager API flows. | 5.0, 6.0 | Protected endpoints enforce correct roles. |
| 8.3 | Frontend component tests | Test key UI states for product, cart, checkout, manager forms, and reports. | 7.0 | Main screens handle loading, empty, success, and error states. |
| 8.4 | Manual customer scenario | Browse product, add to cart, place order, pay, view history. | 7.3, 7.4, 7.5, 7.6 | End-to-end customer flow works. |
| 8.5 | Manual manager scenario | Manage category, manage product, update stock, update order status, view revenue. | 7.7, 7.8, 7.9, 7.10 | End-to-end manager flow works. |
| 8.6 | Documentation review | Check README, context, WBS, and design notes. | 8.1, 8.2, 8.5 | Documentation matches implemented scope and stack. |

## 5. Required Acceptance Checks

The implementation should not be considered complete until these checks pass:

- Actor scope includes only Customer and Manager.
- Customer can view/search products, manage cart, place order, make payment, and view order history.
- Manager can manage product, category, stock quantity, order status, and revenue.
- OOP/domain `Product` does not expose a `quantity` property.
- Database product table includes `quantity` for stock management.
- `CartItem.quantity` and `OrderItem.quantity` are supported.
- Prisma schema targets Neon database.
- Spring controllers call facade methods for workflow operations.
- Facade Pattern is documented and visible in backend structure.
- Revenue excludes cancelled and unpaid orders.
- Role-based access prevents Customer from using Manager features.

## 6. Suggested API Groups

| API Group | Actor | Example Responsibilities |
| --- | --- | --- |
| `/api/auth` | Customer, Manager | Register, login, logout, change password |
| `/api/products` | Customer, Manager | Public product browsing/search; manager product maintenance through protected methods |
| `/api/categories` | Manager | Category management |
| `/api/cart` | Customer | Cart item add/update/remove/list |
| `/api/orders` | Customer, Manager | Customer order placement/history; manager order list/status update |
| `/api/payments` | Customer, Manager | Customer payment recording; manager payment viewing |
| `/api/reports/revenue` | Manager | Revenue summary |

Exact endpoint paths can be adjusted during implementation, but each API group must preserve the actor boundaries above.

## 7. Business Rules

- Product stock is stored in the database `quantity` column.
- Product stock must not be modeled as an OOP `Product.quantity` property.
- Customer cannot add inactive products to cart.
- Customer cannot order more than available stock.
- Cart item quantity must be greater than zero.
- Order total is calculated from order item quantity and unit price snapshot.
- Payment amount must match the order total.
- Cancelled orders do not count as revenue.
- Only Manager can update order status and stock quantity.
- Soft delete is preferred for products and categories through `isActive`.

## 8. Optional Future Enhancements

These items are not required for the current scope:

- Real payment gateway integration.
- Voucher and discount system.
- Shipping address management.
- Email or SMS notifications.
- Product subtype factory implementation.
- Advanced dashboard charts.
- Admin role.
- Sales Staff role.
