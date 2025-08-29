const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Script de reparación de Excel');
console.log('=====================================');

const excelFile = path.join(__dirname, '../citas_agendadas.xlsx');

// 1. Verificar si Excel está ejecutándose
console.log('1. Verificando si Excel está ejecutándose...');
try {
  const processes = execSync('tasklist /FI "IMAGENAME eq EXCEL.EXE"', { encoding: 'utf8' });
  
  if (processes.includes('EXCEL.EXE')) {
    console.log('❌ Excel está ejecutándose. Intentando cerrar...');
    
    try {
      execSync('taskkill /F /IM EXCEL.EXE', { stdio: 'inherit' });
      console.log('✅ Excel cerrado exitosamente');
      
      // Esperar un poco para que el proceso termine completamente
      setTimeout(() => {}, 2000);
    } catch (killError) {
      console.log('⚠️ No se pudo cerrar Excel automáticamente');
      console.log('🔔 Por favor, cierra Excel manualmente y ejecuta este script de nuevo');
      process.exit(1);
    }
  } else {
    console.log('✅ Excel no está ejecutándose');
  }
} catch (error) {
  console.log('⚠️ No se pudo verificar procesos de Excel');
}

// 2. Buscar archivos de backup
console.log('\n2. Buscando archivos de backup...');
const backupFiles = fs.readdirSync(__dirname + '/../')
  .filter(file => file.includes('_backup_') && file.endsWith('.xlsx'))
  .sort((a, b) => {
    const timeA = a.match(/_backup_(\d+)\.xlsx$/)?.[1];
    const timeB = b.match(/_backup_(\d+)\.xlsx$/)?.[1];
    return parseInt(timeB) - parseInt(timeA); // Más reciente primero
  });

if (backupFiles.length === 0) {
  console.log('ℹ️ No se encontraron archivos de backup');
  console.log('✅ Todo parece estar en orden');
  process.exit(0);
}

console.log(`📁 Encontrados ${backupFiles.length} archivo(s) de backup:`);
backupFiles.forEach((file, index) => {
  console.log(`   ${index + 1}. ${file}`);
});

// 3. Usar el backup más reciente
const latestBackup = backupFiles[0];
const backupPath = path.join(__dirname, '../', latestBackup);

console.log(`\n3. Restaurando desde backup más reciente: ${latestBackup}`);

try {
  // Hacer backup del archivo actual si existe
  if (fs.existsSync(excelFile)) {
    const currentBackup = excelFile.replace('.xlsx', `_old_${Date.now()}.xlsx`);
    fs.copyFileSync(excelFile, currentBackup);
    console.log(`💾 Archivo actual guardado como: ${path.basename(currentBackup)}`);
  }
  
  // Restaurar desde backup
  fs.copyFileSync(backupPath, excelFile);
  console.log(`✅ Archivo restaurado exitosamente`);
  
  // Limpiar backup usado
  fs.unlinkSync(backupPath);
  console.log(`🧹 Backup ${latestBackup} eliminado`);
  
  console.log('\n🎉 ¡Reparación completada!');
  console.log('📝 Ahora puedes reiniciar el bot con: npm start');
  
} catch (error) {
  console.error('❌ Error durante la reparación:', error.message);
  console.log('\n🔔 Solución manual:');
  console.log(`   1. Cierra Excel completamente`);
  console.log(`   2. Renombra ${latestBackup} a citas_agendadas.xlsx`);
  console.log(`   3. Reinicia el bot`);
  process.exit(1);
}

// 4. Verificar archivos de backup restantes
console.log('\n4. Limpiando backups antiguos...');
const oldBackups = fs.readdirSync(__dirname + '/../')
  .filter(file => file.includes('_backup_') && file.endsWith('.xlsx'));

if (oldBackups.length > 0) {
  console.log(`🧹 Eliminando ${oldBackups.length} backup(s) antiguo(s)...`);
  oldBackups.forEach(backup => {
    try {
      fs.unlinkSync(path.join(__dirname, '../', backup));
      console.log(`   ✅ Eliminado: ${backup}`);
    } catch (error) {
      console.log(`   ⚠️ No se pudo eliminar: ${backup}`);
    }
  });
}

console.log('\n✅ Script completado exitosamente'); 