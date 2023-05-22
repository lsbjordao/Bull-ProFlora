import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get('OA-MapBiomas-LandCover/:species')
  addToQueue_oa_mapbiomas_landcover(@Param('species') species: string) {
    return this.appService.addToQueue_oa_mapbiomas_landcover(species);
  }

  @Post('records')
  addToQueue_records(@Body() data: any) {
    const {species} = data;
    return this.appService.addToQueue_records(species);
  }

  @Get('second')
  addToSecondQueue(@Query('fail') fail: boolean) {
    return this.appService.addToSecondQueue(fail ? true : false);
  }

}
