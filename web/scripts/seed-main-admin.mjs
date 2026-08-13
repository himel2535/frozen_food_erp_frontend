/**
 * Seed main admin user into MongoDB via Backend API.
 * Usage: npm run seed:admin
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

async function main() {
  console.log(`Sending setup request to: ${API_URL}/auth/register`);
  
  const payload = {
    name: 'Main Admin',
    email: 'admin@toysfactory.com',
    password: 'password123'
  };

  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    
    if (res.ok) {
      console.log('✓ Admin user created successfully in MongoDB.');
      console.log(`  Email: ${payload.email}`);
      console.log(`  Password: ${payload.password}`);
      console.log('\nNext: Sign in at /login\n');
    } else {
      console.error('✗ Failed to create admin user:');
      console.error('  ' + (data.message || data.error || JSON.stringify(data)));
    }
  } catch (err) {
    console.error('✗ Error connecting to backend API:');
    console.error('  Make sure the backend is running on port 5000 (npm run dev in backend dir)');
    console.error(`  ${err.message}`);
  }
}

main();
