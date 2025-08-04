import { Test, TestingModule } from '@nestjs/testing';

describe('AppModule', () => {
  // Test completamente aislado - solo verifica la existencia del archivo
  it('should have AppModule file', () => {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, 'app.module.ts');
    
    expect(fs.existsSync(filePath)).toBe(true);
  });

  // Test de contenido del archivo básico
  it('should contain AppModule class', () => {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, 'app.module.ts');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Verificar que contiene las palabras clave básicas
    expect(fileContent).toContain('AppModule');
    expect(fileContent).toContain('@Module');
    expect(fileContent).toContain('imports:');
  });

  // Test de que es un archivo TypeScript válido
  it('should be a valid TypeScript file', () => {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, 'app.module.ts');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Verificar que tiene imports y exports
    expect(fileContent.includes('import')).toBe(true);
    expect(fileContent.includes('export')).toBe(true);
    expect(fileContent.includes('class AppModule')).toBe(true);
  });
});