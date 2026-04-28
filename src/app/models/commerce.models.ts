export interface ProductApiModel {
  id?: string;
  _id?: string;
  productId?: string;
  name?: string;
  productName?: string;
  title?: string;
  price?: number;
  mrp?: number;
  salePrice?: number;
  image?: string;
  imageUrl?: string;
  thumbnail?: string;
  stock?: number;
  quantity?: number;
  inventory?: number;
  inStock?: number;
  description?: string;
  details?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  stock: number;
  description: string;
}

export interface CartItem extends Product {
  qty: number;
}

export interface CreateOrderItem {
  productId: string;
  qty: number;
}

export interface CreateOrderPayload {
  userId: string;
  items: CreateOrderItem[];
}

export interface OrderApiItem {
  productId?: string | ProductApiModel;
  qty?: number;
  quantity?: number;
  name?: string;
  price?: number;
  image?: string;
}

export interface OrderApiModel {
  id?: string;
  _id?: string;
  orderId?: string;
  userId?: string;
  status?: string;
  items?: OrderApiItem[];
  totalAmount?: number;
  totalPrice?: number;
  createdAt?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  qty: number;
}

export interface Order {
  id: string;
  userId: string;
  status: string;
  items: OrderItem[];
  totalAmount: number;
  createdAt?: string;
}
