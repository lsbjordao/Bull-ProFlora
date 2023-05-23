import { Controller, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Post('records')
  addToQueue_records(@Body() data: any) {
    const {species} = data;
    return this.appService.addToQueue_records(species);
  }
  
  @Post('oa-mapbiomas-landcover')
  addToQueue_oa_mapbiomas_landcover(@Body() data: any) {
    const {species} = data;
    return this.appService.addToQueue_oa_mapbiomas_landcover(species);
  }

  @Post('information')
  addToQueue_information(@Body() data: any) {
    const {species} = data;
    return this.appService.addToQueue_information(species);
  }

  @Post('distribution')
  addToQueue_distribution(@Body() data: any) {
    const {species} = data;
    return this.appService.addToQueue_distribution(species);
  }

  @Post('citationFFB')
  addToQueue_citationFFB(@Body() data: any) {
    const {species} = data;
    return this.appService.addToQueue_citationFFB(species);
  }

}
