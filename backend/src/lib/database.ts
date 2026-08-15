import dns from 'node:dns';
import { Module } from '@nestjs/common';
import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';

/**
 * Fix de Windows: Node/c-ares en Windows a veces no respeta el DNS del
 * sistema operativo, y las consultas SRV/TXT que requiere `mongodb+srv://`
 * fallan con `querySrv ECONNREFUSED` aunque `nslookup` sí funcione. Es
 * específico de Windows — en Linux/macOS el resolutor de Node normalmente
 * respeta el DNS del sistema y no necesita esto. Se aplica solo en win32
 * para no reconfigurar el resolutor global en producción (Linux).
 */
if (process.platform === 'win32') {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
  } catch {
    /* no crítico */
  }
}
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  /* Node < 18: no existe, no hay nada que hacer. */
}

/** Wrapper mínimo sobre MongooseModule.forRoot — vendorizado localmente para que este repo no dependa de un paquete privado externo. */
@Module({})
export class CoreDatabaseModule {
  static forRoot(uri: string, options: MongooseModuleOptions = {}) {
    return {
      module: CoreDatabaseModule,
      imports: [MongooseModule.forRoot(uri, { serverSelectionTimeoutMS: 10000, ...options })],
      exports: [MongooseModule],
    };
  }
}
