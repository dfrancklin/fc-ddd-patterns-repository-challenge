import { Sequelize } from "sequelize-typescript";
import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import Customer from "../../../../domain/customer/entity/customer";
import Address from "../../../../domain/customer/value-object/address";
import Product from "../../../../domain/product/entity/product";
import CustomerModel from "../../../customer/repository/sequelize/customer.model";
import CustomerRepository from "../../../customer/repository/sequelize/customer.repository";
import ProductModel from "../../../product/repository/sequelize/product.model";
import ProductRepository from "../../../product/repository/sequelize/product.repository";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import OrderRepository from "./order.repository";

describe("Order repository test", () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
      sync: { force: true },
    });

    await sequelize.addModels([
      CustomerModel,
      OrderModel,
      OrderItemModel,
      ProductModel,
    ]);
    await sequelize.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it("should create a new order", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("123", "Product 1", 10);
    await productRepository.create(product);

    const orderItem = new OrderItem(
      "1",
      product.name,
      product.price,
      product.id,
      2
    );

    const order = new Order("123", "123", [orderItem]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: order.total(),
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: "123",
          product_id: "123",
        },
      ],
    });
  });

  it("should update an order", async () => {
    const sut = new OrderRepository();
    const customerRepository = new CustomerRepository();
    const productRepository = new ProductRepository();

    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);

    const product1 = new Product("123", "Product 1", 100);
    const product2 = new Product("456", "Product 2", 200);
    const product3 = new Product("789", "Product 3", 300);
    const orderItem1 = new OrderItem(
      "1",
      product1.name,
      product1.price,
      product1.id,
      2
    );
    const orderItem2 = new OrderItem(
      "2",
      product2.name,
      product2.price,
      product2.id,
      3
    );
    const orderItem3 = new OrderItem(
      "3",
      product3.name,
      product3.price,
      product3.id,
      4
    );
    const order = new Order("123", "123", [orderItem1]);

    await customerRepository.create(customer);
    await productRepository.create(product1);
    await productRepository.create(product2);
    await productRepository.create(product3);
    await sut.create(order);

    const updatedOrderItem1 = new OrderItem(
      "1",
      product1.name,
      product1.price,
      product1.id,
      5
    );
    const firstUpdatedOrder = new Order("123", "123", [updatedOrderItem1]);

    await sut.update(firstUpdatedOrder);

    const firstOrderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    const firstExpectation = {
      id: firstUpdatedOrder.id,
      customer_id: firstUpdatedOrder.customerId,
      total: firstUpdatedOrder.total(),
      items: [
        {
          id: updatedOrderItem1.id,
          name: updatedOrderItem1.name,
          price: updatedOrderItem1.price,
          quantity: updatedOrderItem1.quantity,
          order_id: firstUpdatedOrder.id,
          product_id: updatedOrderItem1.productId,
        },
      ],
    };
    expect(firstExpectation).toStrictEqual(firstOrderModel.toJSON());

    const secondUpdatedOrder = new Order("123", "123", [
      orderItem2,
      orderItem3,
    ]);

    await sut.update(secondUpdatedOrder);

    const secondOrderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    const secondExpectation = {
      id: secondUpdatedOrder.id,
      customer_id: secondUpdatedOrder.customerId,
      total: secondUpdatedOrder.total(),
      items: [
        {
          id: orderItem2.id,
          name: orderItem2.name,
          price: orderItem2.price,
          quantity: orderItem2.quantity,
          order_id: secondUpdatedOrder.id,
          product_id: orderItem2.productId,
        },
        {
          id: orderItem3.id,
          name: orderItem3.name,
          price: orderItem3.price,
          quantity: orderItem3.quantity,
          order_id: secondUpdatedOrder.id,
          product_id: orderItem3.productId,
        },
      ],
    };

    expect(secondExpectation).toStrictEqual(secondOrderModel.toJSON());
  });

  it("should find an order by id", async () => {
    const sut = new OrderRepository();
    const customerRepository = new CustomerRepository();
    const productRepository = new ProductRepository();

    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);

    const product = new Product("123", "Product 1", 100);
    const orderItem = new OrderItem(
      "1",
      product.name,
      product.price,
      product.id,
      2
    );
    const order = new Order("123", "123", [orderItem]);

    await customerRepository.create(customer);
    await productRepository.create(product);
    await sut.create(order);

    const result = await sut.find(order.id);

    expect(result).not.toBeNull();
    expect(result).toStrictEqual(order);
  });

  it("should find all orders", async () => {
    const sut = new OrderRepository();
    const customerRepository = new CustomerRepository();
    const productRepository = new ProductRepository();

    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);

    const product = new Product("123", "Product 1", 100);
    const orderItem = new OrderItem(
      "1",
      product.name,
      product.price,
      product.id,
      2
    );
    const order = new Order("123", "123", [orderItem]);

    await customerRepository.create(customer);
    await productRepository.create(product);
    await sut.create(order);

    const result = await sut.findAll();

    expect(result).toHaveLength(1);
    expect(result[0]).toStrictEqual(order);
  });
});
