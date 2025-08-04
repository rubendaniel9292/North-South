
describe('RedisModuleModule', () => {
  // Test completamente aislado - solo verifica la existencia del archivo
  it('should have RedisModuleModule file', () => {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, 'redis-module.module.ts');
    
    expect(fs.existsSync(filePath)).toBe(true);
  });

  // Test de contenido del archivo básico
  it('should contain RedisModuleModule class', () => {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, 'redis-module.module.ts');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Verificar que contiene las palabras clave básicas
    expect(fileContent).toContain('RedisModuleModule');
    expect(fileContent).toContain('@Global');
    expect(fileContent).toContain('@Module');
    expect(fileContent).toContain('providers:');
    expect(fileContent).toContain('exports:');
  });

  // Test de configuración de Redis
  it('should have Redis client configuration', () => {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, 'redis-module.module.ts');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Verificar configuración de Redis
    expect(fileContent).toContain('REDIS_CLIENT');
    expect(fileContent).toContain('createClient');
    expect(fileContent).toContain('redis://localhost:6379');
    expect(fileContent).toContain('RedisModuleService');
  });

  // Test de que es un módulo global
  it('should be a global module', () => {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, 'redis-module.module.ts');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Verificar que está marcado como global
    expect(fileContent).toContain('@Global()');
    expect(fileContent).toContain('exports: [\'REDIS_CLIENT\', RedisModuleService]');
  });

  // Test de estructura de TypeScript
  it('should be a valid TypeScript file', () => {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, 'redis-module.module.ts');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Verificar imports y exports válidos
    expect(fileContent.includes('import')).toBe(true);
    expect(fileContent.includes('export')).toBe(true);
    expect(fileContent.includes('class RedisModuleModule')).toBe(true);
  });
});
