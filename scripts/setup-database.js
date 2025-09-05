#!/usr/bin/env node

/**
 * Database setup script for form-generator-worker
 * This script helps initialize the D1 database with the required schema
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setupDatabase() {
	try {
		console.log('🚀 Setting up D1 database for form-generator-worker...\n');

		// Read the schema file
		const schemaPath = join(__dirname, '..', 'schema.sql');
		const schema = readFileSync(schemaPath, 'utf8');

		console.log('📋 Schema loaded successfully');
		console.log('📝 Schema contents:');
		console.log('─'.repeat(50));
		console.log(schema);
		console.log('─'.repeat(50));

		console.log('\n📋 Next steps:');
		console.log('1. Create a D1 database in your Cloudflare dashboard');
		console.log('2. Copy the database ID from the dashboard');
		console.log('3. Update the database_id in wrangler.jsonc');
		console.log('4. Run: npx wrangler d1 execute form-data-db --file=./schema.sql');
		console.log('5. Deploy your worker: npm run deploy');

		console.log('\n✅ Setup instructions completed!');
		console.log('\n💡 Tip: You can also use the Cloudflare dashboard to execute the schema manually.');
	} catch (error) {
		console.error('❌ Error during database setup:', error.message);
		process.exit(1);
	}
}

setupDatabase();
