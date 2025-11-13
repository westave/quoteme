export type UserRole = 'IMPORTER' | 'FORWARDER';
export type ForwarderStatus = 'PENDING_ACTIVATION' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';
export type ShipmentStatus = 'OPEN' | 'CLOSED';
export type TransportType =
  | 'EXPRESS_PARCEL'
  | 'DIRECT_RAILWAY'
  | 'SEA_RAILWAY'
  | 'ROAD_TRANSPORT'
  | 'AIR_FREIGHT';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  inn?: string;
  companyName?: string;
  forwarderStatus?: ForwarderStatus;
}

export interface Shipment {
  id: string;
  title: string;
  description?: string;
  readyForPickupDate: string;
  requiredDeliveryDate: string;
  bidsDeadline: string;
  incoterms: string;
  incotermsLocation: string;
  transportTypes: string[];
  pickupAddress: string;
  deliveryAddress: string;
  status: ShipmentStatus;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    email: string;
    companyName?: string;
  };
  bids?: Bid[];
  _count?: {
    bids: number;
  };
}

export interface Bid {
  id: string;
  costsBeforeBorder: number;
  costsBeforeBorderVat: number;
  costsAfterBorder: number;
  costsAfterBorderVat: number;
  localCosts: number;
  localCostsVat: number;
  totalCost: number;
  transportType: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  shipmentId: string;
  forwarderId: string;
  forwarder?: {
    id: string;
    companyName?: string;
    inn?: string;
  };
  shipment?: Shipment;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterForwarderRequest {
  email: string;
  password: string;
  inn: string;
  companyName: string;
}

export interface RegisterImporterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token?: string;
}
