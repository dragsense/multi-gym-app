import { DeviceReaderDto } from "../dtos/device-reader-dtos/device-reader.dto";

export interface IDeviceReader extends DeviceReaderDto {}

export interface IDeviceReaderResponse {
  message: string;
  deviceReader: IDeviceReader;
}

