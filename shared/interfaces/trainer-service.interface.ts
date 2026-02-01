import { TrainerServiceDto } from "../dtos/trainer-service-dtos/trainer-service.dto";

export interface ITrainerService extends TrainerServiceDto {}

export interface ITrainerServiceResponse {
  message: string;
  trainerService: ITrainerService;
}

