/**
 * Herramienta OFFLINE de un solo uso. NO se despliega, NO se importa desde
 * el Worker. Genera salt + hash con el MISMO algoritmo exacto que usa
 * worker/index.js (PBKDF2-SHA256, 100000 iteraciones, salt + pepper), para
 * poder crear el primer usuario en D1 sin que la contraseña real quede
 * escrita en ningún archivo del repositorio ni en GitHub.
 *
 * Uso:
 *   node worker/tools/generar-hash-usuario.js "ForLife@HGW2026" "el-mismo-PEPPER-que-configuraste-con-wrangler-secret-put"
 *
 * El resultado (salt y hash) se pega directamente en el comando
 * `wrangler d1 execute` que se indica en el informe de esta entrega.
 * Después de usarlo, cierra la terminal o borra el historial si te
 * preocupa que quede la contraseña en texto plano en el historial de
 * comandos de tu sistema.
 */
const crypto = require('crypto');

const password = process.argv[2];
const pepper = process.argv[3] || '';

if (!password) {
  console.error('Uso: node generar-hash-usuario.js "<contraseña>" "<pepper opcional>"');
  process.exit(1);
}

const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.pbkdf2Sync(password + pepper, Buffer.from(salt, 'hex'), 100000, 32, 'sha256').toString('hex');

console.log('\nGuarda esto y pégalo en el comando wrangler d1 execute del informe:\n');
console.log('password_salt:', salt);
console.log('password_hash:', hash);
console.log('');