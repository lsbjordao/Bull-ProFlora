import { Controller, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {
    //this.appService.addJobs();
  }

  @Post('records')
  addToQueue_records(@Body() data: any) {
    const { species, source, priority } = data;
    return this.appService.addToQueue_records(species, source, priority);
  }

  @Post('oa-mapbiomas-landcover')
  addToQueue_oa_mapbiomas_landcover(@Body() data: any) {
    const { species } = data;
    return this.appService.addToQueue_oa_mapbiomas_landcover(species);
  }

  @Post('oa-mapbiomas-fire')
  addToQueue_oa_mapbiomas_fire(@Body() data: any) {
    const { species } = data;
    return this.appService.addToQueue_oa_mapbiomas_fire(species);
  }

  @Post('oa-mapbiomas-landcover-geojson')
  addToQueue_oa_mapbiomas_landcover_geojson(@Body() data: any) {
    const { geojson } = data;
    return this.appService.addToQueue_oa_mapbiomas_landcover_geojson(geojson);
  }

  @Post('information')
  addToQueue_information(@Body() data: any) {
    const { species, source } = data;
    return this.appService.addToQueue_information(species, source);
  }

  @Post('distribution')
  addToQueue_distribution(@Body() data: any) {
    const { species, source } = data;
    return this.appService.addToQueue_distribution(species, source);
  }

  @Post('FFB')
  addToQueue_FFB(@Body() data: any) {
    const { species } = data;
    return this.appService.addToQueue_FFB(species);
  }

  @Post('obraPrinceps')
  addToQueue_obraPrinceps(@Body() data: any) {
    const { species } = data;
    return this.appService.addToQueue_obraPrinceps(species);
  }

  @Post('oa-UCs')
  addToQueue_oa_UCs(@Body() data: any) {
    const { species } = data;
    return this.appService.addToQueue_oa_UCs(species);
  }

  @Post('oa-TERs')
  addToQueue_oa_TERs(@Body() data: any) {
    const { species } = data;
    return this.appService.addToQueue_oa_TERs(species);
  }

  @Post('oa-PANs')
  addToQueue_oa_PANs(@Body() data: any) {
    const { species } = data;
    return this.appService.addToQueue_oa_PANs(species);
  }

  @Post('conservationActions')
  addToQueue_conservationActions(@Body() data: any) {
    const { species, source } = data;
    return this.appService.addToQueue_conservationActions(species, source);
  }

  @Post('threats')
  addToQueue_threats(@Body() data: any) {
    const { species } = data;
    return this.appService.addToQueue_threats(species);
  }

  @Post('speciesProfile')
  addToQueue_speciesProfile(@Body() data: any) {
    const { species } = data;
    return this.appService.addToQueue_speciesProfile(species);
  }

  @Post('stackedArea-chart-geojson')
  addToQueue_stackedArea_chart_geojson(@Body() data: any) {
    const { feature } = data;
    return this.appService.addToQueue_stackedArea_chart_geojson(feature);
  }

  @Post('trendline-chart-mapbiomas-landcover')
  addToQueue_trendline_chart_mapbiomas_landcover(@Body() data: any) {
    const { feature } = data;
    return this.appService.addToQueue_trendline_chart_mapbiomas_landcover(feature);
  }

  @Post('trendline-calcRates-mapbiomas-landcover')
  addToQueue_trendline_calcRates_mapbiomas_landcover(@Body() data: any) {
    const { feature } = data;
    return this.appService.addToQueue_trendline_calcRates_mapbiomas_landcover(feature);
  }

}
