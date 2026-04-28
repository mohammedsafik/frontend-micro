export const environment = {
  production: false,
  api: {
    authBaseUrl: 'http://192.168.49.2:30003/api/auth',
    productsUrl: 'http://192.168.49.2:30004/api/products',
    ordersUrl: 'http://192.168.49.2:30005/api/orders'
  }
} as const;