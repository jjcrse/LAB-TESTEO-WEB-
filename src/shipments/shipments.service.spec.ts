import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { jest } from '@jest/globals';
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

  it('returns all shipments', async () => {
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

  it('returns a shipment when the id exists', async () => {
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

  it('throws NotFoundException when the shipment does not exist', async () => {
    repositoryMock.findOneBy.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(repositoryMock.findOneBy).toHaveBeenCalledTimes(1);
  });
});