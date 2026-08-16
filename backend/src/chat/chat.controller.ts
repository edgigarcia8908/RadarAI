import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ChatService, ChatConsultaInput } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(@Inject(ChatService) private readonly service: ChatService) {}

  @Post('consultar')
  consultar(@Body() body: ChatConsultaInput) {
    return this.service.consultar(body);
  }
}
