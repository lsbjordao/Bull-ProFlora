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

  @Post('obraPrinceps')
  addToQueue_obraPrinceps(@Body() data: any) {
    const {species} = data;
    return this.appService.addToQueue_obraPrinceps(species);
  }

  @Post('oa_UCs')
  addToQueue_oa_UCs(@Body() data: any) {
    const {species} = data;
    return this.appService.addToQueue_oa_UCs(species);
  }

  @Post('oa_TERs')
  addToQueue_oa_TERs(@Body() data: any) {
    const {species} = data;
    return this.appService.addToQueue_oa_TERs(species);
  }

  @Post('oa_PANs')
  addToQueue_oa_PANs(@Body() data: any) {
    const {species} = data;
    return this.appService.addToQueue_oa_PANs(species);
  }

  @Post('conservationActions')
  addToQueue_conservationActions(@Body() data: any) {
    const {species} = data;
    return this.appService.addToQueue_conservationActions(species);
  }

  @Post('threats')
  addToQueue_threats(@Body() data: any) {
    const {species} = data;
    return this.appService.addToQueue_threats(species);
  }

  @Post('speciesProfile')
  addToQueue_speciesProfile(@Body() data: any) {
    const {species} = data;
    return this.appService.addToQueue_speciesProfile(species);
  }

}
