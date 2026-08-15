import { Module } from '@nestjs/common';
import { ceoStorageClientProvider, CEO_STORAGE_CLIENT } from './ceo-storage-client.provider';

@Module({
  providers: [ceoStorageClientProvider],
  exports: [CEO_STORAGE_CLIENT],
})
export class StorageModule {}
