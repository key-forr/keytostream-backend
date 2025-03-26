import { Module } from '@nestjs/common';
import { PlanService } from './plan.service';
import { PlanResolver } from './plan.resolver';

@Module({
  providers: [PlanResolver, PlanService],
})
export class PlanModule {}
