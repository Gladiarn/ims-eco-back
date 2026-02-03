import { PrismaClient } from '../generated/prisma'
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error("DATABASE_URL is not defined")

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clear existing data
  console.log('🧹 Clearing existing data...')
  await prisma.transferItem.deleteMany()
  await prisma.transfer.deleteMany()
  await prisma.stockCount.deleteMany()
  await prisma.inventory.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.warehouse.deleteMany()
  await prisma.user.deleteMany()

  // Create Users (10 records)
  console.log('👥 Creating users...')
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@ecocycle.com',
        firstName: 'Admin',
        lastName: 'User',
        supabaseUid: 'auth0|admin123',
        role: 'admin',
        department: 'Management',
      },
    }),
    prisma.user.create({
      data: {
        email: 'john.manager@ecocycle.com',
        firstName: 'John',
        lastName: 'Manager',
        supabaseUid: 'auth0|manager123',
        role: 'manager',
        department: 'Warehouse',
      },
    }),
    prisma.user.create({
      data: {
        email: 'sarah.staff@ecocycle.com',
        firstName: 'Sarah',
        lastName: 'Chen',
        supabaseUid: 'auth0|staff123',
        role: 'staff',
        department: 'Inventory',
      },
    }),
    prisma.user.create({
      data: {
        email: 'mike.analyst@ecocycle.com',
        firstName: 'Mike',
        lastName: 'Analyst',
        supabaseUid: 'auth0|analyst123',
        role: 'analyst',
        department: 'Analytics',
      },
    }),
    prisma.user.create({
      data: {
        email: 'lisa.ops@ecocycle.com',
        firstName: 'Lisa',
        lastName: 'Operations',
        supabaseUid: 'auth0|ops123',
        role: 'staff',
        department: 'Operations',
      },
    }),
    prisma.user.create({
      data: {
        email: 'david.sustainability@ecocycle.com',
        firstName: 'David',
        lastName: 'Green',
        supabaseUid: 'auth0|sustainability123',
        role: 'sustainability',
        department: 'Sustainability',
      },
    }),
    prisma.user.create({
      data: {
        email: 'emma.warehouse@ecocycle.com',
        firstName: 'Emma',
        lastName: 'Warehouse',
        supabaseUid: 'auth0|warehouse123',
        role: 'staff',
        department: 'Warehouse',
      },
    }),
    prisma.user.create({
      data: {
        email: 'ryan.transport@ecocycle.com',
        firstName: 'Ryan',
        lastName: 'Transport',
        supabaseUid: 'auth0|transport123',
        role: 'staff',
        department: 'Logistics',
      },
    }),
    prisma.user.create({
      data: {
        email: 'anna.quality@ecocycle.com',
        firstName: 'Anna',
        lastName: 'Quality',
        supabaseUid: 'auth0|quality123',
        role: 'staff',
        department: 'Quality Control',
      },
    }),
    prisma.user.create({
      data: {
        email: 'tom.tech@ecocycle.com',
        firstName: 'Tom',
        lastName: 'Tech',
        supabaseUid: 'auth0|tech123',
        role: 'staff',
        department: 'IT',
      },
    }),
  ])

  // Create Categories (10 records)
  console.log('📂 Creating categories...')
  const categories = await Promise.all([
    prisma.category.create({
      data: { name: 'Bamboo Products', description: 'Products made from sustainable bamboo' },
    }),
    prisma.category.create({
      data: { name: 'Recycled Materials', description: 'Products made from recycled materials' },
    }),
    prisma.category.create({
      data: { name: 'Organic Textiles', description: 'Organic cotton and hemp products' },
    }),
    prisma.category.create({
      data: { name: 'Reusable Items', description: 'Reusable alternatives to single-use items' },
    }),
    prisma.category.create({
      data: { name: 'Compostable Items', description: '100% compostable products' },
    }),
    prisma.category.create({
      data: { name: 'Upcycled Goods', description: 'Products made from upcycled materials' },
    }),
    prisma.category.create({
      data: { name: 'Energy Efficient', description: 'Products that save energy' },
    }),
    prisma.category.create({
      data: { name: 'Water Saving', description: 'Products that reduce water usage' },
    }),
    prisma.category.create({
      data: { name: 'Zero Waste', description: 'Products supporting zero waste lifestyle' },
    }),
    prisma.category.create({
      data: { name: 'Eco Packaging', description: 'Sustainable packaging materials' },
    }),
  ])

  // Create Warehouses (10 records)
  console.log('🏭 Creating warehouses...')
  const warehouses = await Promise.all([
    prisma.warehouse.create({
      data: {
        code: 'SIN-01',
        name: 'Singapore Central Warehouse',
        location: 'Central',
        address: '123 Eco Street',
        city: 'Singapore',
        country: 'SG',
        postalCode: '123456',
        capacity: 10000,
        energySource: 'Solar',
        solarPercentage: 85,
        carbonPerSqMeter: 2.5,
        managerId: users[1].id,
      },
    }),
    prisma.warehouse.create({
      data: {
        code: 'SIN-02',
        name: 'Singapore West Warehouse',
        location: 'West',
        address: '456 Green Avenue',
        city: 'Singapore',
        country: 'SG',
        postalCode: '654321',
        capacity: 8000,
        energySource: 'Hybrid',
        solarPercentage: 60,
        carbonPerSqMeter: 3.2,
        managerId: users[6].id,
      },
    }),
    prisma.warehouse.create({
      data: {
        code: 'JKT-01',
        name: 'Jakarta Main Warehouse',
        location: 'Central Jakarta',
        address: '789 Sustainable Road',
        city: 'Jakarta',
        country: 'ID',
        postalCode: '10110',
        capacity: 15000,
        energySource: 'Grid',
        solarPercentage: 30,
        carbonPerSqMeter: 4.1,
        managerId: users[2].id,
      },
    }),
    prisma.warehouse.create({
      data: {
        code: 'BKK-01',
        name: 'Bangkok Eco Warehouse',
        location: 'Bangkok City',
        address: '321 Green Lane',
        city: 'Bangkok',
        country: 'TH',
        postalCode: '10200',
        capacity: 12000,
        energySource: 'Solar',
        solarPercentage: 75,
        carbonPerSqMeter: 2.8,
        managerId: users[3].id,
      },
    }),
    prisma.warehouse.create({
      data: {
        code: 'KUL-01',
        name: 'Kuala Lumpur Sustainable Hub',
        location: 'Kuala Lumpur',
        address: '654 Eco Boulevard',
        city: 'Kuala Lumpur',
        country: 'MY',
        postalCode: '50000',
        capacity: 9000,
        energySource: 'Hybrid',
        solarPercentage: 50,
        carbonPerSqMeter: 3.5,
        managerId: users[4].id,
      },
    }),
    prisma.warehouse.create({
      data: {
        code: 'HKG-01',
        name: 'Hong Kong Green Warehouse',
        location: 'Hong Kong Island',
        address: '987 Sustainability Street',
        city: 'Hong Kong',
        country: 'HK',
        postalCode: '999077',
        capacity: 7000,
        energySource: 'Grid',
        solarPercentage: 40,
        carbonPerSqMeter: 3.8,
        managerId: users[5].id,
      },
    }),
    prisma.warehouse.create({
      data: {
        code: 'TPE-01',
        name: 'Taipei Eco Distribution Center',
        location: 'Taipei',
        address: '147 Green Way',
        city: 'Taipei',
        country: 'TW',
        postalCode: '100',
        capacity: 8500,
        energySource: 'Solar',
        solarPercentage: 70,
        carbonPerSqMeter: 2.9,
        managerId: users[6].id,
      },
    }),
    prisma.warehouse.create({
      data: {
        code: 'MNL-01',
        name: 'Manila Sustainable Storage',
        location: 'Metro Manila',
        address: '258 Eco Road',
        city: 'Manila',
        country: 'PH',
        postalCode: '1000',
        capacity: 11000,
        energySource: 'Hybrid',
        solarPercentage: 45,
        carbonPerSqMeter: 3.6,
        managerId: users[7].id,
      },
    }),
    prisma.warehouse.create({
      data: {
        code: 'SEL-01',
        name: 'Seoul Green Warehouse',
        location: 'Seoul',
        address: '369 Sustainable Drive',
        city: 'Seoul',
        country: 'KR',
        postalCode: '04524',
        capacity: 9500,
        energySource: 'Solar',
        solarPercentage: 80,
        carbonPerSqMeter: 2.7,
        managerId: users[8].id,
      },
    }),
    prisma.warehouse.create({
      data: {
        code: 'TYO-01',
        name: 'Tokyo Eco Logistics Center',
        location: 'Tokyo',
        address: '741 Green Path',
        city: 'Tokyo',
        country: 'JP',
        postalCode: '100-0001',
        capacity: 13000,
        energySource: 'Hybrid',
        solarPercentage: 65,
        carbonPerSqMeter: 3.0,
        managerId: users[9].id,
      },
    }),
  ])

  // Create Products (10 records)
  console.log('📦 Creating products...')
  const products = await Promise.all([
    prisma.product.create({
      data: {
        sku: 'BAM-STRAW-001',
        name: 'Bamboo Drinking Straws',
        description: 'Reusable bamboo straws, set of 6 with cleaning brush',
        categoryId: categories[0].id,
        unit: 'set',
        costPrice: 8.5,
        sellingPrice: 15.99,
        minStockLevel: 50,
        reorderPoint: 100,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'REC-BAG-002',
        name: 'Recycled Tote Bag',
        description: 'Tote bag made from 100% recycled plastic bottles',
        categoryId: categories[1].id,
        unit: 'piece',
        costPrice: 3.2,
        sellingPrice: 9.99,
        minStockLevel: 100,
        reorderPoint: 200,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'ORG-TSHIRT-003',
        name: 'Organic Cotton T-Shirt',
        description: '100% organic cotton t-shirt, fair trade certified',
        categoryId: categories[2].id,
        unit: 'piece',
        costPrice: 12.0,
        sellingPrice: 24.99,
        minStockLevel: 75,
        reorderPoint: 150,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'REU-BOTTLE-004',
        name: 'Stainless Steel Water Bottle',
        description: 'Insulated stainless steel water bottle, 1L capacity',
        categoryId: categories[3].id,
        unit: 'piece',
        costPrice: 14.5,
        sellingPrice: 29.99,
        minStockLevel: 60,
        reorderPoint: 120,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'COM-CUTLERY-005',
        name: 'Compostable Cutlery Set',
        description: 'Biodegradable cutlery set made from corn starch',
        categoryId: categories[4].id,
        unit: 'pack',
        costPrice: 2.8,
        sellingPrice: 6.99,
        minStockLevel: 200,
        reorderPoint: 400,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'UPC-NOTEBOOK-006',
        name: 'Upcycled Paper Notebook',
        description: 'Notebook made from 100% upcycled paper, tree-free',
        categoryId: categories[5].id,
        unit: 'piece',
        costPrice: 4.5,
        sellingPrice: 12.99,
        minStockLevel: 150,
        reorderPoint: 300,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'EFF-LED-007',
        name: 'LED Solar Light',
        description: 'Solar-powered LED light with 12-hour battery',
        categoryId: categories[6].id,
        unit: 'piece',
        costPrice: 18.0,
        sellingPrice: 39.99,
        minStockLevel: 40,
        reorderPoint: 80,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'WAT-SHOWER-008',
        name: 'Water Saving Shower Head',
        description: 'Low-flow shower head saves 40% water',
        categoryId: categories[7].id,
        unit: 'piece',
        costPrice: 22.5,
        sellingPrice: 45.99,
        minStockLevel: 30,
        reorderPoint: 60,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'ZER-WRAP-009',
        name: 'Beeswax Food Wraps',
        description: 'Reusable beeswax wraps for food storage',
        categoryId: categories[8].id,
        unit: 'pack',
        costPrice: 9.8,
        sellingPrice: 19.99,
        minStockLevel: 80,
        reorderPoint: 160,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'ECO-BOX-010',
        name: 'Eco-Friendly Shipping Box',
        description: 'Recyclable and compostable shipping boxes',
        categoryId: categories[9].id,
        unit: 'box',
        costPrice: 1.2,
        sellingPrice: 3.99,
        minStockLevel: 500,
        reorderPoint: 1000,
      },
    }),
  ])

  // Create Inventory (10 records per product, spread across warehouses)
  console.log('📊 Creating inventory...')
  const inventoryPromises = []
  for (const product of products) {
    for (let i = 0; i < 10; i++) {
      const warehouse = warehouses[i % warehouses.length]
      const quantity = Math.floor(Math.random() * 200) + 50 // 50-250 units
      const reserved = Math.floor(Math.random() * 20) // 0-20 reserved
      
      inventoryPromises.push(
        prisma.inventory.create({
          data: {
            warehouseId: warehouse.id,
            productId: product.id,
            quantity,
            reserved,
            available: quantity - reserved,
            aisle: `A${Math.floor(Math.random() * 10) + 1}`,
            shelf: `S${Math.floor(Math.random() * 5) + 1}`,
            bin: `B${Math.floor(Math.random() * 20) + 1}`,
          },
        })
      )
    }
  }
  const inventory = await Promise.all(inventoryPromises)

  // Create Transfers (10 records)
  console.log('🚚 Creating transfers...')
  const transfers = await Promise.all([
    prisma.transfer.create({
      data: {
        transferNumber: 'TRF-2024-001',
        sourceWarehouseId: warehouses[0].id,
        destWarehouseId: warehouses[1].id,
        requestedById: users[2].id,
        status: 'COMPLETED',
        requestDate: new Date('2024-01-15'),
        completedAt: new Date('2024-01-17'),
        notes: 'Regular stock replenishment',
      },
    }),
    prisma.transfer.create({
      data: {
        transferNumber: 'TRF-2024-002',
        sourceWarehouseId: warehouses[2].id,
        destWarehouseId: warehouses[3].id,
        requestedById: users[3].id,
        status: 'IN_TRANSIT',
        requestDate: new Date('2024-02-01'),
        notes: 'Urgent transfer for upcoming sale',
      },
    }),
    prisma.transfer.create({
      data: {
        transferNumber: 'TRF-2024-003',
        sourceWarehouseId: warehouses[4].id,
        destWarehouseId: warehouses[5].id,
        requestedById: users[4].id,
        status: 'PENDING',
        requestDate: new Date('2024-02-10'),
        notes: 'New store opening stock',
      },
    }),
    prisma.transfer.create({
      data: {
        transferNumber: 'TRF-2024-004',
        sourceWarehouseId: warehouses[6].id,
        destWarehouseId: warehouses[7].id,
        requestedById: users[5].id,
        status: 'COMPLETED',
        requestDate: new Date('2024-01-20'),
        completedAt: new Date('2024-01-22'),
        notes: 'Seasonal product redistribution',
      },
    }),
    prisma.transfer.create({
      data: {
        transferNumber: 'TRF-2024-005',
        sourceWarehouseId: warehouses[8].id,
        destWarehouseId: warehouses[9].id,
        requestedById: users[6].id,
        status: 'IN_TRANSIT',
        requestDate: new Date('2024-02-05'),
        notes: 'Cross-border transfer',
      },
    }),
    prisma.transfer.create({
      data: {
        transferNumber: 'TRF-2024-006',
        sourceWarehouseId: warehouses[1].id,
        destWarehouseId: warehouses[0].id,
        requestedById: users[7].id,
        status: 'COMPLETED',
        requestDate: new Date('2024-01-25'),
        completedAt: new Date('2024-01-27'),
        notes: 'Return transfer',
      },
    }),
    prisma.transfer.create({
      data: {
        transferNumber: 'TRF-2024-007',
        sourceWarehouseId: warehouses[3].id,
        destWarehouseId: warehouses[2].id,
        requestedById: users[8].id,
        status: 'PENDING',
        requestDate: new Date('2024-02-12'),
        notes: 'Emergency stock request',
      },
    }),
    prisma.transfer.create({
      data: {
        transferNumber: 'TRF-2024-008',
        sourceWarehouseId: warehouses[5].id,
        destWarehouseId: warehouses[4].id,
        requestedById: users[9].id,
        status: 'COMPLETED',
        requestDate: new Date('2024-01-30'),
        completedAt: new Date('2024-02-01'),
        notes: 'Inventory balancing',
      },
    }),
    prisma.transfer.create({
      data: {
        transferNumber: 'TRF-2024-009',
        sourceWarehouseId: warehouses[7].id,
        destWarehouseId: warehouses[6].id,
        requestedById: users[0].id,
        status: 'IN_TRANSIT',
        requestDate: new Date('2024-02-08'),
        notes: 'New product distribution',
      },
    }),
    prisma.transfer.create({
      data: {
        transferNumber: 'TRF-2024-010',
        sourceWarehouseId: warehouses[9].id,
        destWarehouseId: warehouses[8].id,
        requestedById: users[1].id,
        status: 'PENDING',
        requestDate: new Date('2024-02-15'),
        notes: 'Pre-holiday stock build-up',
      },
    }),
  ])

  // Create Transfer Items (10 per transfer)
  console.log('📦 Creating transfer items...')
  const transferItemPromises = []
  for (const transfer of transfers) {
    for (let i = 0; i < 10; i++) {
      const product = products[i % products.length]
      const quantity = Math.floor(Math.random() * 100) + 10 // 10-110 units
      
      transferItemPromises.push(
        prisma.transferItem.create({
          data: {
            transferId: transfer.id,
            productId: product.id,
            quantity,
          },
        })
      )
    }
  }
  const transferItems = await Promise.all(transferItemPromises)

  // Create Stock Counts (10 records)
  console.log('📝 Creating stock counts...')
  const stockCounts = await Promise.all([
    prisma.stockCount.create({
      data: {
        warehouseId: warehouses[0].id,
        inventoryId: inventory[0].id,
        countedQty: 125,
        systemQty: 120,
        variance: 5,
        countedById: users[2].id,
        status: 'REVIEWED',
        countDate: new Date('2024-01-10'),
        notes: 'Minor variance, within acceptable range',
      },
    }),
    prisma.stockCount.create({
      data: {
        warehouseId: warehouses[1].id,
        inventoryId: inventory[10].id,
        countedQty: 180,
        systemQty: 175,
        variance: 5,
        countedById: users[3].id,
        status: 'ADJUSTED',
        countDate: new Date('2024-01-12'),
        notes: 'Adjusted system quantity',
      },
    }),
    prisma.stockCount.create({
      data: {
        warehouseId: warehouses[2].id,
        inventoryId: inventory[20].id,
        countedQty: 90,
        systemQty: 95,
        variance: -5,
        countedById: users[4].id,
        status: 'PENDING',
        countDate: new Date('2024-01-15'),
        notes: 'Need investigation',
      },
    }),
    prisma.stockCount.create({
      data: {
        warehouseId: warehouses[3].id,
        inventoryId: inventory[30].id,
        countedQty: 210,
        systemQty: 200,
        variance: 10,
        countedById: users[5].id,
        status: 'REVIEWED',
        countDate: new Date('2024-01-18'),
        notes: 'Acceptable variance',
      },
    }),
    prisma.stockCount.create({
      data: {
        warehouseId: warehouses[4].id,
        inventoryId: inventory[40].id,
        countedQty: 75,
        systemQty: 80,
        variance: -5,
        countedById: users[6].id,
        status: 'ADJUSTED',
        countDate: new Date('2024-01-20'),
        notes: 'System updated',
      },
    }),
    prisma.stockCount.create({
      data: {
        warehouseId: warehouses[5].id,
        inventoryId: inventory[50].id,
        countedQty: 300,
        systemQty: 295,
        variance: 5,
        countedById: users[7].id,
        status: 'REVIEWED',
        countDate: new Date('2024-01-22'),
        notes: 'Within tolerance',
      },
    }),
    prisma.stockCount.create({
      data: {
        warehouseId: warehouses[6].id,
        inventoryId: inventory[60].id,
        countedQty: 140,
        systemQty: 150,
        variance: -10,
        countedById: users[8].id,
        status: 'PENDING',
        countDate: new Date('2024-01-25'),
        notes: 'Possible theft or miscount',
      },
    }),
    prisma.stockCount.create({
      data: {
        warehouseId: warehouses[7].id,
        inventoryId: inventory[70].id,
        countedQty: 85,
        systemQty: 80,
        variance: 5,
        countedById: users[9].id,
        status: 'REVIEWED',
        countDate: new Date('2024-01-28'),
        notes: 'Minor adjustment needed',
      },
    }),
    prisma.stockCount.create({
      data: {
        warehouseId: warehouses[8].id,
        inventoryId: inventory[80].id,
        countedQty: 220,
        systemQty: 225,
        variance: -5,
        countedById: users[0].id,
        status: 'ADJUSTED',
        countDate: new Date('2024-01-30'),
        notes: 'Corrected system records',
      },
    }),
    prisma.stockCount.create({
      data: {
        warehouseId: warehouses[9].id,
        inventoryId: inventory[90].id,
        countedQty: 110,
        systemQty: 105,
        variance: 5,
        countedById: users[1].id,
        status: 'REVIEWED',
        countDate: new Date('2024-02-01'),
        notes: 'Acceptable difference',
      },
    }),
  ])

  console.log('✅ Seeding completed successfully!')
  console.log(`📊 Created:`)
  console.log(`   👥 ${users.length} users`)
  console.log(`   📂 ${categories.length} categories`)
  console.log(`   🏭 ${warehouses.length} warehouses`)
  console.log(`   📦 ${products.length} products`)
  console.log(`   📊 ${inventory.length} inventory records`)
  console.log(`   🚚 ${transfers.length} transfers`)
  console.log(`   📦 ${transferItems.length} transfer items`)
  console.log(`   📝 ${stockCounts.length} stock counts`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })