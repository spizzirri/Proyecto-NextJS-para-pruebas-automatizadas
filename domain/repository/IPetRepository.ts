import { IRepository } from "./IRepository";
import { PetEntity } from "../models/PetEntity";

export interface IPetRepository extends IRepository<PetEntity> {}

