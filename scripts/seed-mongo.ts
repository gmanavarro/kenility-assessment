const API_URL = 'http://localhost:3000';
import * as fs from 'fs';
import mongoose from 'mongoose';
import * as path from 'path';

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/kenility-assessment';

type Product = {
  _id: string;
  name: string;
  sku: string;
  price: number;
  imageUrl: string;
};

async function register(username: string, password: string) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error(`Failed to register: ${response.statusText}`);
  }

  return response.json();
}

async function login(username: string, password: string) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error(`Failed to login: ${response.statusText}`);
  }

  return response.json();
}

async function createProduct(
  token: string,
  product: { name: string; sku: string; price: number },
  imagePath: string,
) {
  const formData = new FormData();
  formData.append('name', product.name);
  formData.append('sku', product.sku);
  formData.append('price', product.price.toString());
  formData.append(
    'image',
    new Blob([fs.readFileSync(imagePath)], { type: 'image/jpeg' }),
    'metalpipe.jpeg',
  );

  const response = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to create product: ${response.statusText}`);
  }

  return response.json();
}

async function createOrders(username: string, products: Product[]) {
  const now = new Date();
  const lastMonth = new Date(
    now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear(),
    now.getMonth() === 0 ? 11 : now.getMonth() - 1,
    15,
  );

  const orders = [
    {
      clientName: 'John Doe',
      items: [
        {
          productId: products[0]._id,
          quantity: 2,
          name: products[0].name,
          sku: products[0].sku,
          price: products[0].price,
          imageUrl: products[0].imageUrl,
        },
      ],
      total: products[0].price * 2,
      createdBy: username,
      createdAt: now,
      updatedAt: now,
    },
    {
      clientName: 'Jane Smith',
      items: [
        {
          productId: products[1]._id,
          quantity: 3,
          name: products[1].name,
          sku: products[1].sku,
          price: products[1].price,
          imageUrl: products[1].imageUrl,
        },
      ],
      total: products[1].price * 3,
      createdBy: username,
      createdAt: lastMonth,
      updatedAt: lastMonth,
    },
    {
      clientName: 'Bob Johnson',
      items: [
        {
          productId: products[0]._id,
          quantity: 1,
          name: products[0].name,
          sku: products[0].sku,
          price: products[0].price,
          imageUrl: products[0].imageUrl,
        },
        {
          productId: products[1]._id,
          quantity: 2,
          name: products[1].name,
          sku: products[1].sku,
          price: products[1].price,
          imageUrl: products[1].imageUrl,
        },
      ],
      total: products[0].price * 1 + products[1].price * 2,
      createdBy: username,
      createdAt: lastMonth,
      updatedAt: lastMonth,
    },
  ];

  await mongoose.connection.collection('orders').insertMany(orders);
}

async function getProducts(): Promise<Product[]> {
  const products = await mongoose.connection
    .collection('products')
    .find()
    .toArray();
  return products.map((p) => ({
    _id: p._id.toString(),
    name: p.name,
    sku: p.sku,
    price: p.price,
    imageUrl: p.imageUrl,
  }));
}

async function seed() {
  try {
    const testUser = {
      username: 'testuser',
      password: 'Test1234',
    };

    console.log('Registering user...');
    await register(testUser.username, testUser.password);

    console.log('Logging in...');
    const { token } = await login(testUser.username, testUser.password);

    const imagePath = path.join(__dirname, '../test/products/metalpipe.jpeg');

    console.log('Creating products...');
    await createProduct(
      token,
      {
        name: 'Metal Pipe Type A',
        sku: 'PIPE-A123',
        price: 99.99,
      },
      imagePath,
    );

    await createProduct(
      token,
      {
        name: 'Metal Pipe Type B',
        sku: 'PIPE-B456',
        price: 149.99,
      },
      imagePath,
    );

    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);

    console.log('Creating orders...');
    const products = await getProducts();
    await createOrders(testUser.username, products);

    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
