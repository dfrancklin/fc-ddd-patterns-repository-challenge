import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import OrderRepositoryInterface from "../../../../domain/checkout/repository/order-repository.interface";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";

export default class OrderRepository implements OrderRepositoryInterface {
  async create(entity: Order): Promise<void> {
    await OrderModel.create(
      {
        id: entity.id,
        customer_id: entity.customerId,
        total: entity.total(),
        items: entity.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
        })),
      },
      {
        include: [{ model: OrderItemModel }],
      }
    );
  }

  async update(entity: Order): Promise<void> {
    const items = entity.items.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      product_id: item.productId,
      order_id: entity.id,
      quantity: item.quantity,
    }));

    await OrderItemModel.destroy({ where: { order_id: entity.id } });
    await OrderItemModel.bulkCreate(items);
    await OrderModel.update(
      {
        customer_id: entity.customerId,
        total: entity.total(),
      },
      { where: { id: entity.id } }
    );
  }

  async find(id: string): Promise<Order> {
    if (!id) return null;

    const order = await OrderModel.findOne({
      where: { id },
      include: ["items"],
    });

    return this.map(order);
  }

  async findAll(): Promise<Order[]> {
    const orders = await OrderModel.findAll({ include: ["items"] });

    return orders.map(this.map);
  }

  private map(order: OrderModel): Order {
    const items = order.items.map(
      ({ id, name, price, product_id, quantity }) =>
        new OrderItem(id, name, price, product_id, quantity)
    );

    return new Order(order.id, order.customer_id, items);
  }
}
