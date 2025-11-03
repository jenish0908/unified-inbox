const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Testing database connection...')
    await prisma.$connect()
    console.log('✓ Database connected successfully')
    
    console.log('\nChecking tables...')
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
    console.log('Tables in database:', tables)
    
  } catch (error) {
    console.error('✗ Database error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()