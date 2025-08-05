import { Test, TestingModule } from '@nestjs/testing';
import { GlobaldataController } from './globaldata.controller';
import { GlobaldataService } from '../services/globaldata.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorManager } from '@/helpers/error.manager';

describe('GlobaldataController', () => {
  let controller: GlobaldataController;
  let service: GlobaldataService;

  const mockProvinces = [
    { id: '1', provinceName: 'Pichincha' },
    { id: '2', provinceName: 'Guayas' }
  ];

  const mockCities = [
    { 
      id: '1', 
      cityName: 'Quito',
      province: { id: '1', provinceName: 'Pichincha' }
    },
    { 
      id: '2', 
      cityName: 'Guayaquil',
      province: { id: '2', provinceName: 'Guayas' }
    }
  ];

  const mockCivilStatus = [
    { id: '1', status: 'Soltero' },
    { id: '2', status: 'Casado' },
    { id: '3', status: 'Divorciado' }
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GlobaldataController],
      providers: [
        {
          provide: GlobaldataService,
          useValue: {
            getAllProvinces: jest.fn(),
            getAllCities: jest.fn(),
            getAllCivilStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<GlobaldataController>(GlobaldataController);
    service = module.get<GlobaldataService>(GlobaldataService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProvince', () => {
    it('debería retornar respuesta exitosa con provincias', async () => {
      // Arrange
      jest.spyOn(service, 'getAllProvinces').mockResolvedValue(mockProvinces as any);

      // Act
      const result = await controller.getProvince();

      // Assert
      expect(result).toEqual({
        status: 'success',
        allProvince: mockProvinces,
      });
      expect(service.getAllProvinces).toHaveBeenCalledTimes(1);
    });

    it('debería manejar errores NOT_FOUND correctamente', async () => {
      // Arrange
      const error = new ErrorManager({
        type: 'NOT_FOUND',
        message: 'No se encontraron provincias'
      });
      jest.spyOn(service, 'getAllProvinces').mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getProvince()).rejects.toThrow(ErrorManager);
      await expect(controller.getProvince()).rejects.toThrow('No se encontraron provincias');
    });

    it('debería manejar errores internos correctamente', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      jest.spyOn(service, 'getAllProvinces').mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getProvince()).rejects.toThrow(Error);
      await expect(controller.getProvince()).rejects.toThrow('Database connection failed');
    });
  });

  describe('getCities', () => {
    it('debería retornar respuesta exitosa con ciudades', async () => {
      // Arrange
      jest.spyOn(service, 'getAllCities').mockResolvedValue(mockCities as any);

      // Act
      const result = await controller.getCities();

      // Assert
      expect(result).toEqual({
        status: 'success',
        allCities: mockCities,
      });
      expect(service.getAllCities).toHaveBeenCalledTimes(1);
    });

    it('debería manejar errores del servicio correctamente', async () => {
      // Arrange
      const error = new ErrorManager({
        type: 'NOT_FOUND',
        message: 'No se encontraron ciudades'
      });
      jest.spyOn(service, 'getAllCities').mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getCities()).rejects.toThrow(ErrorManager);
      await expect(controller.getCities()).rejects.toThrow('No se encontraron ciudades');
    });

    it('debería propagar errores genéricos correctamente', async () => {
      // Arrange
      const error = new Error('Database error');
      jest.spyOn(service, 'getAllCities').mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getCities()).rejects.toThrow(Error);
      await expect(controller.getCities()).rejects.toThrow('Database error');
    });
  });

  describe('getCivil', () => {
    it('debería retornar respuesta exitosa con estados civiles', async () => {
      // Arrange
      jest.spyOn(service, 'getAllCivilStatus').mockResolvedValue(mockCivilStatus as any);

      // Act
      const result = await controller.getCivil();

      // Assert
      expect(result).toEqual({
        status: 'success',
        allStatus: mockCivilStatus,
      });
      expect(service.getAllCivilStatus).toHaveBeenCalledTimes(1);
    });

    it('debería manejar errores del servicio correctamente', async () => {
      // Arrange
      const error = new ErrorManager({
        type: 'INTERNAL_SERVER_ERROR',
        message: 'Error interno del servidor'
      });
      jest.spyOn(service, 'getAllCivilStatus').mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getCivil()).rejects.toThrow(ErrorManager);
      expect(service.getAllCivilStatus).toHaveBeenCalledTimes(1);
    });

    it('debería propagar errores genéricos sin transformar', async () => {
      // Arrange
      const error = new Error('Generic error');
      jest.spyOn(service, 'getAllCivilStatus').mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getCivil()).rejects.toThrow(Error);
      await expect(controller.getCivil()).rejects.toThrow('Generic error');
    });

    it('debería retornar undefined si no hay datos (edge case)', async () => {
      // Arrange
      jest.spyOn(service, 'getAllCivilStatus').mockResolvedValue(null as any);

      // Act
      const result = await controller.getCivil();

      // Assert
      expect(result).toBeUndefined();
      expect(service.getAllCivilStatus).toHaveBeenCalledTimes(1);
    });
  });

  describe('Funcionalidad Básica', () => {
    it('debería tener logger configurado correctamente', () => {
      expect((controller as any).logger).toBeDefined();
      expect((controller as any).logger.context).toBe('GlobaldataController');
    });

    it('debería tener servicio inyectado correctamente', () => {
      expect((controller as any).globaldataService).toBeDefined();
      expect((controller as any).globaldataService).toBe(service);
    });

    it('debería manejar respuestas exitosas con estructura simple', async () => {
      // Arrange
      jest.spyOn(service, 'getAllProvinces').mockResolvedValue(mockProvinces as any);

      // Act
      const result = await controller.getProvince();

      // Assert
      expect(result).toHaveProperty('status', 'success');
      expect(result).toHaveProperty('allProvince');
      expect(result).not.toHaveProperty('message');
      expect(result).not.toHaveProperty('timestamp');
    });
  });
});
