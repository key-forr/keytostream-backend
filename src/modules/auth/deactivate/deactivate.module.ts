import { Module } from '@nestjs/common';
import { DeactivateService } from './deactivate.service';
import { DeactivateResolver } from './deactivate.resolver';

@Module({
  providers: [DeactivateResolver, DeactivateService],
})
export class DeactivateModule {}
