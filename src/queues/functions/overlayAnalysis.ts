//@ts-nocheck

const ee = require('@google/earthengine');
const privateKey = require('../../../credentials.json');
const EooAooCalc = require('@vicentecalfo/eoo-aoo-calc')

function calcArea(coordinates: any) {
    return new Promise((resolve, reject) => {
        ee.data.authenticateViaPrivateKey(
            privateKey,
            async () => {

                ee.initialize()

                const eoo = new EooAooCalc.EOO({ coordinates })
                const eooObj = eoo.calculate()
                const eooGeoJson = eooObj.convexHullPolygon
                const featureCollectionEOO = ee.FeatureCollection(eooGeoJson.features)

                var EOOgeometry = featureCollectionEOO.geometry();

                const aoo = new EooAooCalc.AOO({ coordinates })
                const aooObj = aoo.calculate({ gridWidthInKm: 2 })
                const aooGeoJson = aooObj.occupiedGrids
                const featureCollectionAOO = ee.FeatureCollection(aooGeoJson.features);

                var AOOgeometry = featureCollectionAOO.geometry();

                var image1 = ee.Image('projects/mapbiomas-public/assets/brazil/lulc/collection8/mapbiomas_collection80_integration_v1'); // 2022
                var image2 = ee.Image('projects/mapbiomas-raisg/public/collection5/mapbiomas_raisg_panamazonia_collection5_integration_v1'); // 2022
                var image3 = ee.Image('projects/MapBiomas_Pampa/public/collection3/mapbiomas_pampa_collection3_integration_v1'); // 2022
                var image4 = ee.Image('projects/mapbiomas-public/assets/chaco/lulc/collection5/mapbiomas_chaco_collection5_integration_v2'); // 2022
                var image5 = ee.Image('projects/mapbiomas_af_trinacional/public/collection3/mapbiomas_atlantic_forest_collection30_integration_v1'); // 2022
                var image6 = ee.Image('projects/mapbiomas-public/assets/peru/collection2/mapbiomas_peru_collection2_integration_v1'); // 2022
                var image7 = ee.Image('projects/MapBiomas_Pampa/public/collection3/mapbiomas_uruguay_collection1_integration_v1'); // 2022
                var image8 = ee.Image('projects/mapbiomas-public/assets/argentina/collection1/mapbiomas_argentina_collection1_integration_v1'); // 2022
                var image9 = ee.Image('projects/mapbiomas-public/assets/chile/collection1/mapbiomas_chile_collection1_integration_v1'); // 2022
                var image10 = ee.Image('projects/mapbiomas-public/assets/paraguay/collection1/mapbiomas_paraguay_collection1_integration_v1'); // 2022
                var image11 = ee.Image('projects/mapbiomas-public/assets/ecuador/collection1/mapbiomas_ecuador_collection1_integration_v1'); // 2022
                var image12 = ee.Image('projects/MapBiomas_Pampa/public/collection3/mapbiomas_uruguay_collection1_integration_v1'); // 2022
                var image13 = ee.Image('projects/mapbiomas-public/assets/venezuela/collection1/mapbiomas_venezuela_collection1_integration_v1'); // 2022
                var image14 = ee.Image('projects/mapbiomas-public/assets/colombia/collection1/mapbiomas_colombia_collection1_integration_v1'); // 2022
                var image15 = ee.Image('projects/mapbiomas-public/assets/bolivia/collection2/mapbiomas_bolivia_collection2_integration_v1')
                  .select(ee.Image('projects/mapbiomas-public/assets/bolivia/collection2/mapbiomas_bolivia_collection2_integration_v1')
                  .bandNames().filter(ee.Filter.neq('item', '2023'))); // 2023

                var image1bandNames = image1.bandNames().getInfo();

                // var image4bandNames = image4.bandNames().getInfo();
                // image4 = image4.select(image4bandNames.filter(function(band) { return band !== 'classification_2022'; }));

                var mosaic = ee.ImageCollection([image7, image6, image5, image4, image3, image2, image1]).mosaic(); // image8

                var image = mosaic;
                var bandNames = image1bandNames;

                var EOOresult: any = [];
                for (var name of bandNames) {
                    var bandName = name;
                    var band = image.select(bandName);
                    var clippedImage = band.clip(EOOgeometry);
                    var areaImage = ee.Image.pixelArea().divide(1000000).addBands(clippedImage)
                    var areas = new Promise(function (resolve, reject) {
                        areaImage.reduceRegion({
                            reducer: ee.Reducer
                                .sum()
                                .group({
                                    groupField: 1,
                                    groupName: 'class',
                                }),
                            geometry: clippedImage.geometry(),
                            scale: 10,
                            maxPixels: 1e7,
                            bestEffort: true
                        }).evaluate(function (result: any) {
                            resolve(result);
                        });
                    });

                    EOOresult.push({
                        band: name,
                        areaKm2: areas
                    });
                }

                var AOOresult: any = [];
                for (var name of bandNames) {
                    var bandName = name;
                    var band = image.select(bandName);
                    var clippedImage = band.clip(AOOgeometry);
                    var areaImage = ee.Image.pixelArea().divide(1000000).addBands(clippedImage)
                    var areas = new Promise(function (resolve, reject) {
                        areaImage.reduceRegion({
                            reducer: ee.Reducer
                                .sum()
                                .group({
                                    groupField: 1,
                                    groupName: 'class',
                                }),
                            geometry: clippedImage.geometry(),
                            scale: 10,
                            maxPixels: 1e7,
                            bestEffort: true
                        }).evaluate(function (result: any) {
                            resolve(result);
                        });
                    });

                    AOOresult.push({
                        band: name,
                        areaKm2: areas
                    });
                }

                Promise.all([
                    Promise.all(EOOresult.map(({ band, areaKm2 }: { band: any, areaKm2: any }) => areaKm2)),
                    Promise.all(AOOresult.map(({ band, areaKm2 }: { band: any, areaKm2: any }) => areaKm2))
                ]).then(([EOOareas, AOOareas]) => {
                    EOOresult = EOOresult.map((res: any, i: any) => ({
                        band: res.band,
                        areaKm2: EOOareas[i],
                    }));

                    AOOresult = AOOresult.map((res: any, i: any) => ({
                        band: res.band,
                        areaKm2: AOOareas[i],
                    }));

                    // EOOresult.forEach(result => {
                    //     result.areaKm2.groups.forEach(group => {
                    //         if (group.class === 22) {
                    //             group.class = 30;
                    //         }
                    //     });
                    // });

                    // AOOresult.forEach(result => {
                    //     result.areaKm2.groups.forEach(group => {
                    //         if (group.class === 22) {
                    //             group.class = 30;
                    //         }
                    //     });
                    // });

                    resolve({ EOO: EOOresult, AOO: AOOresult });

                }).catch((err) => console.log(err));

            },
            (error: any) => {
                console.log(error.message)
            }
        )
    })
}

export { calcArea }

function calcAreaGeojson(features: any) {
    return new Promise((resolve, reject) => {
        ee.data.authenticateViaPrivateKey(
            privateKey,
            async () => {

                ee.initialize()

                const featureCollection = ee.FeatureCollection(features);

                var geometry = featureCollection.geometry();
                let areaKm2 = geometry.area().getInfo()
                areaKm2 = areaKm2 / 1000000

                var image1 = ee.Image('projects/mapbiomas-workspace/public/collection8/mapbiomas_collection80_integration_v1');
                // var image2 = ee.Image('projects/mapbiomas-raisg/public/collection4/mapbiomas_raisg_panamazonia_collection4_integration_v1');
                // var image3 = ee.Image('projects/MapBiomas_Pampa/public/collection2/mapbiomas_pampa_collection2_integration_v1');
                // var image4 = ee.Image('projects/mapbiomas-chaco/public/collection4/mapbiomas_chaco_collection4_integration_v1');
                // var image5 = ee.Image('projects/mapbiomas_af_trinacional/public/collection2/mapbiomas_atlantic_forest_collection20_integration_v1');
                // var image6 = ee.Image('projects/mapbiomas-public/assets/peru/collection1/mapbiomas_peru_collection1_integration_v1');

                var image1bandNames = image1.bandNames().getInfo();
                // var image4bandNames = image4.bandNames().getInfo();

                // image4 = image4.select(image4bandNames.filter(function(band) { return band !== 'classification_2022'; }));

                var mosaic = ee.ImageCollection([image1]).mosaic(); // , image2, image3, image5, image6, image4

                var image = mosaic;
                var bandNames = image1bandNames;

                var geometryResult: any = [];
                for (var name of bandNames) {
                    var bandName = name;
                    var band = image.select(bandName);
                    var clippedImage = band.clip(geometry);
                    var areaImage = ee.Image.pixelArea().divide(1000000).addBands(clippedImage)
                    var areas = new Promise(function (resolve, reject) {
                        areaImage.reduceRegion({
                            reducer: ee.Reducer
                                .sum()
                                .group({
                                    groupField: 1,
                                    groupName: 'class',
                                }),
                            geometry: clippedImage.geometry(),
                            scale: 10,
                            maxPixels: 1e7,
                            bestEffort: true
                        }).evaluate(function (result: any) {
                            resolve(result);
                        });
                    });

                    geometryResult.push({
                        band: name,
                        areaKm2: areas
                    });
                }

                Promise.all([
                    Promise.all(geometryResult.map(({ band, areaKm2 }: { band: any, areaKm2: any }) => areaKm2))
                ]).then(([areas]) => {
                    geometryResult = geometryResult.map((res: any, i: any) => ({
                        band: res.band,
                        areaKm2: areas[i],
                    }));

                    resolve({ areaKm2: areaKm2, geometry: geometryResult });

                }).catch((err) => console.log(err));

            },
            (error: any) => {
                console.log(error.message)
            }
        )
    })
}

export { calcAreaGeojson }