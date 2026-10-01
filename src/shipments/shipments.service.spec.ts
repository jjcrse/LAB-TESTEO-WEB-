import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { jest } from '@jest/globals';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { ShipmentEntity } from './entities/shipment.entity';
import { ShipmentRulesService } from './shipment-rules.service';
import { ShipmentStatus } from './shipment-status.enum';
import { ShipmentsService } from './shipments.service';

describe('ShipmentsService', () => {
  let service: ShipmentsService;

  const repositoryMock = {
    find: jest.fn<() => Promise<ShipmentEntity[]>>(),
    findOneBy: jest.fn<(where: any) => Promise<ShipmentEntity | null>>(),
    create: jest.fn<(data: any) => ShipmentEntity>(),
    save: jest.fn<(shipment: any) => Promise<ShipmentEntity>>(),
  };

  const shipmentRulesServiceMock = {
    ensureCanBeDispatched: jest.fn<(shipment: any) => void>(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ShipmentsService,
        {
          provide: getRepositoryToken(ShipmentEntity),
          useValue: repositoryMock,
        },
        {
          provide: ShipmentRulesService,
          useValue: shipmentRulesServiceMock,
        },
      ],
    }).compile();

    service = moduleRef.get(ShipmentsService);
  });

  it('retorna todos los shipmets', async () => {
    const shipments = [
      {
        id: 1,
        trackingCode: 'TRK-001',
        destination: 'Cali',
        status: ShipmentStatus.CREATED,
      },
    ] as ShipmentEntity[];

    repositoryMock.find.mockResolvedValue(shipments);

    const result = await service.findAll();

    expect(repositoryMock.find).toHaveBeenCalledTimes(1);
    expect(result).toEqual(shipments);
  });

  it('retorna un shipment cuando el id existe', async () => {
    const shipment = {
      id: 7,
      trackingCode: 'TRK-007',
      destination: 'Bogotá',
      status: ShipmentStatus.CREATED,
    } as ShipmentEntity;

    repositoryMock.findOneBy.mockResolvedValue(shipment);

    const result = await service.findOne(7);

    expect(repositoryMock.findOneBy).toHaveBeenCalledWith({ id: 7 });
    expect(result).toEqual(shipment);
  });

  it('arroja NotFoundException cuando el shipment no existe', async () => {
    repositoryMock.findOneBy.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(repositoryMock.findOneBy).toHaveBeenCalledTimes(1);
  });

  it('crea un shipment con el status creado y lo guarda', async () => {
    const data: CreateShipmentDto = {
      trackingCode: 'TRK-010',
      destination: 'Medellín',
    };

    const builtShipment = {
      ...data,
      status: ShipmentStatus.CREATED,
    } as ShipmentEntity;

    const savedShipment = {
      id: 10,
      ...data,
      status: ShipmentStatus.CREATED,
    } as ShipmentEntity;

    repositoryMock.create.mockReturnValue(builtShipment);
    repositoryMock.save.mockResolvedValue(savedShipment);

    const result = await service.create(data);

    expect(repositoryMock.create).toHaveBeenCalledWith({
      ...data,
      status: ShipmentStatus.CREATED,
    });
    expect(repositoryMock.save).toHaveBeenCalledWith(builtShipment);
    expect(result).toEqual(savedShipment);
  });

  it('despacha un shipment y lo guarda', async () => {
    const shipment = {
      id: 4,
      trackingCode: 'TRK-004',
      destination: 'Cali',
      status: ShipmentStatus.CREATED,
    } as ShipmentEntity;

    const savedShipment = {
      ...shipment,
      status: ShipmentStatus.DISPATCHED,
    } as ShipmentEntity;

    repositoryMock.findOneBy.mockResolvedValue(shipment);
    repositoryMock.save.mockResolvedValue(savedShipment);

    const result = await service.dispatch(4);

    expect(shipmentRulesServiceMock.ensureCanBeDispatched).toHaveBeenCalledWith(
      shipment,
    );
    expect(repositoryMock.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 4,
        status: ShipmentStatus.DISPATCHED,
      }),
    );
    expect(result).toEqual(savedShipment);
  });

  it('no guarda el shipment cuando la regla rechaza el despacho', async () => {
    const shipment = {
      id: 5,
      trackingCode: 'TRK-005',
      destination: 'Cali',
      status: ShipmentStatus.DELIVERED,
    } as ShipmentEntity;

    repositoryMock.findOneBy.mockResolvedValue(shipment);

    shipmentRulesServiceMock.ensureCanBeDispatched.mockImplementation(() => {
      throw new ConflictException('solo crea el shipment que puede ser despachado');
    });

    await expect(service.dispatch(5)).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(repositoryMock.save).not.toHaveBeenCalled();
  });
});