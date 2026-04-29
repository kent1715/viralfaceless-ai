import { hash } from 'bcryptjs';

// Admin credentials
const ADMIN_EMAIL = 'admin@viralfaceless.ai';
const ADMIN_PASSWORD = 'Admin@2025!';
const ADMIN_NAME = 'Admin';

async function main() {
  // Use dynamic import for PrismaClient
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    // Check if admin already exists
    const existing = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
    });

    if (existing) {
      // Update existing admin to unlimited
      await prisma.user.update({
        where: { email: ADMIN_EMAIL },
        data: {
          credits: 999999,
          plan: 'admin',
        },
      });
      console.log('✅ Admin updated to unlimited credits!');
      console.log(`   Email: ${ADMIN_EMAIL}`);
      console.log(`   Credits: 999999 (unlimited)`);
      console.log(`   Plan: admin`);
    } else {
      // Create new admin
      const hashedPassword = await hash(ADMIN_PASSWORD, 12);
      await prisma.user.create({
        data: {
          email: ADMIN_EMAIL,
          name: ADMIN_NAME,
          password: hashedPassword,
          credits: 999999,
          plan: 'admin',
        },
      });
      console.log('✅ Admin created successfully!');
      console.log(`   Email: ${ADMIN_EMAIL}`);
      console.log(`   Password: ${ADMIN_PASSWORD}`);
      console.log(`   Credits: 999999 (unlimited)`);
      console.log(`   Plan: admin`);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
