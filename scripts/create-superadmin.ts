import { PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  const email = process.env.SUPERADMIN_EMAIL || 'admin@rockola.com';
  const password = process.env.SUPERADMIN_PASSWORD || 'admin123';
  const name = process.env.SUPERADMIN_NAME || 'Super Admin';

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    // Update existing user to SUPERADMIN
    const hashedPassword = await hash(password, 12);
    await prisma.user.update({
      where: { email },
      data: {
        role: Role.SUPERADMIN,
        password: hashedPassword,
        name,
      },
    });
    console.log(`✅ Updated user ${email} to SUPERADMIN`);
  } else {
    // Create new SUPERADMIN user
    const hashedPassword = await hash(password, 12);
    await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: Role.SUPERADMIN,
        emailVerified: new Date(),
      },
    });
    console.log(`✅ Created SUPERADMIN user: ${email}`);
  }

  console.log(`\n📧 Email: ${email}`);
  console.log(`🔑 Password: ${password}`);
  console.log(`\n⚠️  Please change the password after first login!`);
}

createSuperAdmin()
  .catch((e) => {
    console.error('Error creating superadmin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

