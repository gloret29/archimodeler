#!/usr/bin/env ts-node
/**
 * Script de test de connexion aux bases de données
 * Usage: npx ts-node scripts/test-db-connection.ts
 */

import { PrismaClient } from '@repo/database';
import neo4j from 'neo4j-driver';

async function testPostgreSQL() {
  console.log('🔍 Test de connexion PostgreSQL...');
  
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Connexion PostgreSQL réussie!');
    
    // Test simple
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Requête de test réussie:', result);
    
    // Vérifier les tables
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    console.log(`✅ ${tables.length} tables trouvées dans la base de données`);
    
    await prisma.$disconnect();
    return true;
  } catch (error: any) {
    console.error('❌ Erreur de connexion PostgreSQL:', error.message);
    console.error('   Code:', error.code);
    console.error('   Vérifiez que:');
    console.error('   - PostgreSQL est démarré (docker-compose up -d)');
    console.error('   - DATABASE_URL est correct dans .env');
    console.error('   - Le client Prisma est généré (npm run generate --workspace=@repo/database)');
    await prisma.$disconnect().catch(() => {});
    return false;
  }
}

async function testNeo4j() {
  console.log('\n🔍 Test de connexion Neo4j...');
  
  const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
  const user = process.env.NEO4J_USER || 'neo4j';
  const password = process.env.NEO4J_PASSWORD || 'password';
  
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  
  try {
    await driver.verifyConnectivity();
    console.log('✅ Connexion Neo4j réussie!');
    
    // Test simple
    const session = driver.session();
    const result = await session.run('RETURN 1 as test');
    console.log('✅ Requête de test réussie:', result.records[0].get('test'));
    
    // Compter les nœuds
    const countResult = await session.run('MATCH (n) RETURN count(n) as count');
    const count = countResult.records[0].get('count');
    console.log(`✅ ${count} nœuds trouvés dans Neo4j`);
    
    await session.close();
    await driver.close();
    return true;
  } catch (error: any) {
    console.error('❌ Erreur de connexion Neo4j:', error.message);
    console.error('   Vérifiez que:');
    console.error('   - Neo4j est démarré (docker-compose up -d)');
    console.error('   - NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD sont corrects dans .env');
    await driver.close().catch(() => {});
    return false;
  }
}

async function main() {
  console.log('🚀 Test des connexions aux bases de données\n');
  console.log('Variables d\'environnement:');
  console.log('  DATABASE_URL:', process.env.DATABASE_URL ? '✅ défini' : '❌ manquant');
  console.log('  NEO4J_URI:', process.env.NEO4J_URI || 'bolt://localhost:7687 (défaut)');
  console.log('  NEO4J_USER:', process.env.NEO4J_USER || 'neo4j (défaut)');
  console.log('  NEO4J_PASSWORD:', process.env.NEO4J_PASSWORD ? '✅ défini' : 'password (défaut)');
  console.log('');
  
  const pgResult = await testPostgreSQL();
  const neo4jResult = await testNeo4j();
  
  console.log('\n📊 Résumé:');
  console.log(`  PostgreSQL: ${pgResult ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`  Neo4j: ${neo4jResult ? '✅ OK' : '❌ ÉCHEC'}`);
  
  if (pgResult && neo4jResult) {
    console.log('\n🎉 Toutes les connexions sont opérationnelles!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Certaines connexions ont échoué. Consultez TROUBLESHOOTING_DATABASE.md');
    process.exit(1);
  }
}

main().catch(console.error);
